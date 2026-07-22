import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { EntitlementService } from "@/services/entitlement.service";
import * as z from "zod";

const createPractitionerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  specialty: z.string().optional().or(z.literal('')),
  otherSpecialty: z.string().optional().or(z.literal('')),
  qualification: z.string().optional().or(z.literal('')),
  registrationNumber: z.string().optional().or(z.literal('')),
  consultationFee: z.number().optional(),
  duration: z.number().optional(),
  bufferTime: z.number().optional(),
  isActive: z.boolean().default(true),
  calendarColor: z.string().optional(),
  displayOrder: z.number().default(0),
  workingDays: z.array(z.string()).default([]),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session?.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const practitioners = await prisma.practitioner.findMany({
      where: { doctorId: session.doctorId },
      orderBy: [
        { isOwner: "desc" },
        { displayOrder: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(practitioners);
  } catch (error) {
    console.error("GET_PRACTITIONERS_ERROR", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionData();
    if (!session?.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow Admin/Doctor to add practitioners
    if (session.role && !["DOCTOR", "ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Enforce MAX_PRACTITIONERS limit
    await EntitlementService.requireLimit(session.doctorId, 'MAX_PRACTITIONERS');

    const body = await req.json();
    const validatedData = createPractitionerSchema.parse(body);

    const practitioner = await prisma.practitioner.create({
      data: {
        ...validatedData,
        doctorId: session.doctorId,
        isOwner: false, // New practitioners created via API cannot be owner by default
      },
    });

    return NextResponse.json(practitioner, { status: 201 });
  } catch (error: any) {
    console.error("POST_PRACTITIONERS_ERROR", error);
    if (error.name === 'UsageLimitExceededError') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
