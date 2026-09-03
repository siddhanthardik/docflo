import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.doctorId || session.user.id;
    const body = await req.json();
    const { primaryPatientId, duplicatePatientId } = body;

    if (!primaryPatientId || !duplicatePatientId) {
      return NextResponse.json(
        { error: "Both primaryPatientId and duplicatePatientId are required." },
        { status: 400 }
      );
    }

    if (primaryPatientId === duplicatePatientId) {
      return NextResponse.json(
        { error: "Cannot merge a patient into itself." },
        { status: 400 }
      );
    }

    // Verify both patients belong to this doctor/clinic
    const [primaryPatient, duplicatePatient] = await Promise.all([
      prisma.patient.findFirst({
        where: { id: primaryPatientId, doctorId }
      }),
      prisma.patient.findFirst({
        where: { id: duplicatePatientId, doctorId }
      })
    ]);

    if (!primaryPatient || !duplicatePatient) {
      return NextResponse.json(
        { error: "One or both patient records were not found for this clinic." },
        { status: 404 }
      );
    }

    // Execute safe merge in a transaction
    const mergedPatient = await prisma.$transaction(async (tx) => {
      // 1. Re-assign all appointments
      await tx.appointment.updateMany({
        where: { patientId: duplicatePatientId },
        data: { patientId: primaryPatientId }
      });

      // 2. Re-assign all invoices
      await tx.invoice.updateMany({
        where: { patientId: duplicatePatientId },
        data: { patientId: primaryPatientId }
      });

      // 3. Re-assign all conversations
      await tx.conversation.updateMany({
        where: { patientId: duplicatePatientId },
        data: { patientId: primaryPatientId }
      });

      // 4. Re-assign waitlist entries
      await tx.waitlistEntry.updateMany({
        where: { patientId: duplicatePatientId },
        data: { patientId: primaryPatientId }
      });

      // 5. Re-assign campaign recipient entries
      await tx.campaignRecipient.updateMany({
        where: { patientId: duplicatePatientId },
        data: { patientId: primaryPatientId }
      });

      // 6. Merge tags, notes, and demographic details into primary patient
      const combinedTags = Array.from(new Set([...(primaryPatient.tags || []), ...(duplicatePatient.tags || [])]));
      const updates: any = {
        tags: combinedTags
      };

      if (!primaryPatient.gender && duplicatePatient.gender) {
        updates.gender = duplicatePatient.gender;
      }
      if (!primaryPatient.dateOfBirth && duplicatePatient.dateOfBirth) {
        updates.dateOfBirth = duplicatePatient.dateOfBirth;
      }
      if (!primaryPatient.email && duplicatePatient.email) {
        updates.email = duplicatePatient.email;
      }
      if (!primaryPatient.medicalNotes && duplicatePatient.medicalNotes) {
        updates.medicalNotes = duplicatePatient.medicalNotes;
      }
      if (!primaryPatient.primaryPractitionerId && duplicatePatient.primaryPractitionerId) {
        updates.primaryPractitionerId = duplicatePatient.primaryPractitionerId;
      }

      const updatedPrimary = await tx.patient.update({
        where: { id: primaryPatientId },
        data: updates
      });

      // 7. Safely delete the duplicate patient row
      await tx.patient.delete({
        where: { id: duplicatePatientId }
      });

      return updatedPrimary;
    });

    return NextResponse.json({
      success: true,
      message: "Patients merged successfully.",
      mergedPatient
    });
  } catch (error: any) {
    console.error("Error merging patients:", error);
    return NextResponse.json(
      { error: error.message || "Failed to merge patients" },
      { status: 500 }
    );
  }
}
