import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { patientSchema } from "@/lib/validators";
import { getSessionData, isDoctor } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function GET(req: Request) {
  try {
    const { doctorId, locationId } = await getSessionData();  // scoped to the correct clinic

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const type = searchParams.get("type") || ""; // 'LEAD', 'ACTIVE', etc.
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {
      doctorId,   // always filter by the clinic
    };
    
    if (locationId) {
      where.gbpAccountId = locationId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (type && type !== "ALL") {
      where.patientType = type;
    }

    const primaryPractitionerId = searchParams.get("primaryPractitionerId");
    if (primaryPractitionerId) {
      where.primaryPractitionerId = primaryPractitionerId;
    }

    const [patients, totalCount] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          appointments: {
            take: 1,
            orderBy: { date: "desc" },
            select: { date: true, status: true },
          },
          primaryPractitioner: {
            select: { id: true, name: true }
          }
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { doctorId, locationId } = await getSessionData();

    const body = await req.json();
    const validatedData = patientSchema.parse(body);

    const patient = await prisma.$transaction(async (tx) => {
      // 1. Lock the Doctor row to prevent concurrent creations from exceeding limits
      // Using an update instead of raw SQL to avoid relation not found errors
      await tx.doctor.update({
        where: { id: doctorId },
        data: { updatedAt: new Date() }
      });

      // 2. Enforce MAX_PATIENTS under CLINIC_CORE
      // (This uses global prisma inside, which is safe because the lock ensures serialized execution)
      const block = await entitlementGuard(doctorId, req, { module: "CLINIC_CORE", limit: "MAX_PATIENTS" });
      if (block) {
        throw block;
      }

      // 3. Create the patient
      return await tx.patient.create({
        data: {
          ...validatedData,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : null,
          doctorId,
          primaryPractitionerId: validatedData.primaryPractitionerId || undefined,
          gbpAccountId: locationId || undefined,
          tags: validatedData.tags || [],
        },
      });
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error; // Return the block response from entitlementGuard
    }
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}