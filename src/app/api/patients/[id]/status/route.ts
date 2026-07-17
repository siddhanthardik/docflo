import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { z } from "zod";

const statusSchema = z.object({
  patientType: z.enum(["LEAD", "ACTIVE", "INACTIVE", "LOST"]),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId } = await getSessionData();
    const body = await req.json();
    const { patientType } = statusSchema.parse(body);

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
      data: { patientType },
    });

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("Error updating patient status:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
