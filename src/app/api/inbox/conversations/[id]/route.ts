import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { sanitizePersonName } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
    if (block) return block;

    const conversation = await prisma.conversation.findFirst({
      where: { id, doctorId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        patient: {
          include: {
            appointments: {
              orderBy: { date: "desc" },
              take: 5,
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const cleanPatientName = sanitizePersonName(conversation.patientName || "") || conversation.patientPhone;
    let cleanPatient = conversation.patient;

    if (cleanPatient) {
      const cleanFirst = sanitizePersonName(cleanPatient.firstName || "");
      const cleanLast = sanitizePersonName(cleanPatient.lastName || "");
      if ((cleanFirst && cleanFirst !== cleanPatient.firstName) || cleanLast !== (cleanPatient.lastName || "")) {
        prisma.patient.update({
          where: { id: cleanPatient.id },
          data: { firstName: cleanFirst || "Patient", lastName: cleanLast }
        }).catch(() => {});
        cleanPatient = { ...cleanPatient, firstName: cleanFirst || "Patient", lastName: cleanLast };
      }
    }

    if (conversation.patientName && conversation.patientName !== cleanPatientName) {
      prisma.conversation.update({
        where: { id: conversation.id },
        data: { patientName: cleanPatientName }
      }).catch(() => {});
    }

    return NextResponse.json({
      ...conversation,
      patientName: cleanPatientName,
      patient: cleanPatient
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
