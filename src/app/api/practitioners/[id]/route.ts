import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import * as z from "zod";

const updatePractitionerSchema = z.object({
  name: z.string().min(2, "Name is required (at least 2 characters)").optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal('')).nullable(),
  phone: z.string().optional().or(z.literal('')).nullable(),
  specialty: z.string().optional().or(z.literal('')).nullable(),
  otherSpecialty: z.string().optional().or(z.literal('')).nullable(),
  qualification: z.string().optional().or(z.literal('')).nullable(),
  registrationNumber: z.string().optional().or(z.literal('')).nullable(),
  consultationFee: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
  bufferTime: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
  calendarColor: z.string().optional().nullable(),
  displayOrder: z.number().optional(),
  workingDays: z.array(z.string()).optional(),
  workingHoursStart: z.string().optional().nullable(),
  workingHoursEnd: z.string().optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
  isOwner: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSessionData();
    if (!session?.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role && !["DOCTOR", "ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const practitionerId = params.id;
    const body = await req.json();
    const validatedData = updatePractitionerSchema.parse(body);

    const existingPractitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
    });

    if (!existingPractitioner || existingPractitioner.doctorId !== session.doctorId) {
      return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
    }

    // Disallow self-serve ownership changes to prevent revenue leakage & account flipping
    if (validatedData.isOwner !== undefined) {
      return NextResponse.json(
        { error: "Ownership transfer is restricted to SuperAdmin Support." },
        { status: 403 }
      );
    }

    const { isOwner, ...updateData } = validatedData;

    const updatedPractitioner = await prisma.practitioner.update({
      where: { id: practitionerId },
      data: updateData,
    });

    return NextResponse.json(updatedPractitioner);
  } catch (error: any) {
    console.error("PATCH_PRACTITIONER_ERROR", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid doctor input data." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update doctor." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSessionData();
    if (!session?.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role && !["DOCTOR", "ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const practitionerId = params.id;

    const existingPractitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
    });

    if (!existingPractitioner || existingPractitioner.doctorId !== session.doctorId) {
      return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
    }

    if (existingPractitioner.isOwner) {
      return NextResponse.json(
        { error: "Cannot delete the owner practitioner. Transfer ownership first." },
        { status: 400 }
      );
    }

    // Instead of hard delete, maybe soft delete? The schema doesn't have isArchived, we have isActive.
    // If they want true deletion, let's allow it if there are no appointments, else fail or cascade.
    // For now, we will perform a hard delete as CASCADE is enabled on the model.
    await prisma.practitioner.delete({
      where: { id: practitionerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE_PRACTITIONER_ERROR", error);
    return NextResponse.json(
      { error: "Could not delete practitioner. They may have associated appointments." },
      { status: 500 }
    );
  }
}
