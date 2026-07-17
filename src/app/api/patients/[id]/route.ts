import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData, isDoctor } from "@/lib/session";
import { patientSchema } from "@/lib/validators";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId } = await getSessionData();

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        doctorId,   // ensure patient belongs to this clinic
      },
      include: {
        appointments: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId } = await getSessionData();
    const body = await req.json();
    const validatedData = patientSchema.parse(body);

    const existingPatient = await prisma.patient.findFirst({
      where: {
        id,
        doctorId,
      },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : null,
      },
    });

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId, role } = await getSessionData();

    // Only doctors (or admins) can delete patients
    if (!isDoctor(role)) {
      return NextResponse.json(
        { error: "You do not have permission to delete patients" },
        { status: 403 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        doctorId,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}