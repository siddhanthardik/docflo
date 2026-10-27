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

    const body = await req.json().catch(() => ({}));

    const cleanDigits = (body.phone || conversation.patientPhone || "").replace(/\D/g, "");
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    const normalizedPhone = body.phone ? body.phone.trim() : (cleanDigits.length === 10 ? `+91${cleanDigits}` : (conversation.patientPhone.startsWith("+") ? conversation.patientPhone : `+${cleanDigits}`));

    const firstName = (body.firstName || "").trim() || "Patient";
    const lastName = (body.lastName || "").trim();
    const email = body.email ? body.email.trim() : undefined;
    const dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : undefined;
    const gender = body.gender || undefined;
    const bloodGroup = body.bloodGroup || undefined;
    const address = body.address ? body.address.trim() : undefined;
    const city = body.city ? body.city.trim() : undefined;
    const medicalNotes = body.medicalNotes ? body.medicalNotes.trim() : undefined;
    const primaryPractitionerId = body.primaryPractitionerId && body.primaryPractitionerId !== "NONE" ? body.primaryPractitionerId : undefined;
    const tags = Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : ["Registered from WhatsApp"];

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
          email,
          dateOfBirth,
          gender,
          bloodGroup,
          address,
          city,
          medicalNotes,
          primaryPractitionerId,
          patientType: "ACTIVE",
          tags
        }
      });
    } else {
      // Update existing patient record with submitted demographics
      targetPatient = await prisma.patient.update({
        where: { id: targetPatient.id },
        data: {
          firstName: firstName !== "Patient" ? firstName : targetPatient.firstName,
          lastName: lastName || targetPatient.lastName,
          email: email || targetPatient.email,
          dateOfBirth: dateOfBirth || targetPatient.dateOfBirth,
          gender: gender || targetPatient.gender,
          bloodGroup: bloodGroup || targetPatient.bloodGroup,
          address: address || targetPatient.address,
          city: city || targetPatient.city,
          medicalNotes: medicalNotes || targetPatient.medicalNotes,
          primaryPractitionerId: primaryPractitionerId || targetPatient.primaryPractitionerId,
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
