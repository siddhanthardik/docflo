import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { sanitizePersonName } from "@/lib/utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, doctorId },
      include: { patient: true }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // If already linked to a patient, return success
    if (conversation.patientId && conversation.patient) {
      return NextResponse.json({
        success: true,
        patient: conversation.patient,
        message: "Conversation already linked to registered patient"
      });
    }

    const cleanDigits = (conversation.patientPhone || "").replace(/\D/g, "");
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    const normalizedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : (conversation.patientPhone.startsWith("+") ? conversation.patientPhone : `+${cleanDigits}`);

    // Parse first name and last name from WhatsApp profile name
    const rawName = sanitizePersonName(conversation.patientName || "") || "";
    let firstName = "Patient";
    let lastName = "";

    if (rawName && !rawName.startsWith("Lead") && rawName !== conversation.patientPhone) {
      const parts = rawName.split(" ").filter(Boolean);
      firstName = parts[0] || "Patient";
      lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
    }

    // Check if patient already exists by phone in this clinic
    let targetPatient = await prisma.patient.findFirst({
      where: {
        doctorId,
        OR: [
          { phone: conversation.patientPhone },
          { phone: normalizedPhone },
          { phone: cleanDigits },
          ...(last10.length >= 10 ? [{ phone: { endsWith: last10 } }] : [])
        ]
      }
    });

    if (!targetPatient) {
      // Create new patient record in clinic database
      targetPatient = await prisma.patient.create({
        data: {
          doctorId,
          firstName,
          lastName,
          phone: normalizedPhone,
          patientType: "ACTIVE",
          tags: ["WhatsApp Lead", "Registered from Chat"]
        }
      });
    }

    // Link conversation to the registered patient
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        patientId: targetPatient.id,
        patientName: `${targetPatient.firstName} ${targetPatient.lastName || ""}`.trim()
      },
      include: {
        patient: {
          include: {
            appointments: {
              orderBy: { date: "desc" },
              take: 5
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      patient: updatedConversation.patient,
      conversation: updatedConversation
    });
  } catch (error: any) {
    console.error("[REGISTER_PATIENT_FROM_CHAT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to register patient" }, { status: 500 });
  }
}
