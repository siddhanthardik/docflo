import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { whatsappManager } from "@/lib/whatsapp-manager"; // Initialize WhatsApp Manager
import { entitlementGuard } from "@/lib/withEntitlements";
import { sanitizePersonName } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
    if (block) return block;

    const conversations = await prisma.conversation.findMany({
      where: { doctorId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Ensure conversation.lastMessageAt reflects actual latest timestamp & patientName has zero emojis
    const synchronizedConversations = conversations
      .map((c) => {
        const latestMessageDate = c.messages?.[0]?.createdAt;
        const cleanName = sanitizePersonName(c.patientName || "") || c.patientPhone;

        // Asynchronously self-heal database record if emojis were present
        if (c.patientName && c.patientName !== cleanName && cleanName) {
          prisma.conversation.update({
            where: { id: c.id },
            data: { patientName: cleanName }
          }).catch(() => {});

          const last10 = (c.patientPhone || "").slice(-10);
          prisma.patient.findFirst({
            where: {
              doctorId,
              OR: [
                { phone: c.patientPhone },
                { phone: `+${c.patientPhone}` },
                ...(last10.length >= 10 ? [{ phone: { endsWith: last10 } }] : [])
              ]
            }
          }).then((p) => {
            if (p) {
              const cleanFirst = sanitizePersonName(p.firstName || "");
              const cleanLast = sanitizePersonName(p.lastName || "");
              if (cleanFirst !== p.firstName || cleanLast !== p.lastName) {
                prisma.patient.update({
                  where: { id: p.id },
                  data: { firstName: cleanFirst || "Patient", lastName: cleanLast }
                }).catch(() => {});
              }
            }
          }).catch(() => {});
        }

        return {
          ...c,
          patientName: cleanName,
          lastMessageAt: latestMessageDate ? new Date(latestMessageDate).toISOString() : c.lastMessageAt,
        };
      })
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json({ conversations: synchronizedConversations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
