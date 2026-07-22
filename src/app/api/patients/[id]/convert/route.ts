import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { doctorId } = await getSessionData();
    const { id: patientId } = await params;

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Verify patient belongs to this doctor
    const existingPatient = await prisma.patient.findFirst({
      where: { id: patientId, doctorId },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Update patientType to ACTIVE
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        patientType: "ACTIVE",
      },
    });

    return NextResponse.json(updatedPatient);
  } catch (error: any) {
    console.error("Error converting patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
