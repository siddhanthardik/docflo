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
          orderBy: [
            { createdAt: "desc" },
            { id: "desc" }
          ],
          take: 1,
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Ensure conversation.lastMessageAt reflects actual latest timestamp & patientName syncs with official patient records
    const synchronizedConversations = conversations
      .map((c) => {
        const latestMessageDate = c.messages?.[0]?.createdAt;
        const isDoctorOrStaff = (c.patientName || "").toLowerCase().includes("doctor") || (c.patientName || "").toLowerCase().includes("staff");
        const formattedPhone = c.patientPhone ? (c.patientPhone.startsWith("+") ? c.patientPhone : `+${c.patientPhone}`) : "";

        let cleanName = c.patientPhone;
        if (c.patient) {
          const ptFirst = sanitizePersonName(c.patient.firstName || "");
          const ptLast = sanitizePersonName(c.patient.lastName || "");
          cleanName = `${ptFirst} ${ptLast}`.trim() || "Patient";
        } else if (isDoctorOrStaff) {
          cleanName = sanitizePersonName(c.patientName || "") || "Clinic Team";
        } else {
          cleanName = formattedPhone;
        }

        // Asynchronously self-heal database record if out of sync
        if (c.patientName !== cleanName && cleanName) {
          prisma.conversation.update({
            where: { id: c.id },
            data: { patientName: cleanName }
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
