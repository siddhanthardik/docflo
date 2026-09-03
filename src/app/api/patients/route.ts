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
      // Intentionally skipping location-based filtering for patients 
      // as one doctor account equals one clinic in the system architecture.
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
      if (type === "ACTIVE") {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const typeCondition = {
          OR: [
            { patientType: "ACTIVE", appointments: { some: { date: { gte: oneYearAgo } } } },
            { patientType: "ACTIVE", appointments: { none: {} }, createdAt: { gte: oneYearAgo } }
          ]
        };
        where.AND = where.AND ? [...where.AND, typeCondition] : [typeCondition];
      } else if (type === "INACTIVE") {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const typeCondition = {
          OR: [
            { patientType: "INACTIVE" },
            { patientType: "ACTIVE", appointments: { none: { date: { gte: oneYearAgo } } }, createdAt: { lt: oneYearAgo } },
            { patientType: "ACTIVE", appointments: { none: {} }, createdAt: { lt: oneYearAgo } }
          ]
        };
        where.AND = where.AND ? [...where.AND, typeCondition] : [typeCondition];
      } else {
        where.patientType = type;
      }
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

    const cleanPhone = (validatedData.phone || "").replace(/\D/g, "");
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    // Check if patient with this 10-digit phone already exists for this clinic
    if (last10.length >= 10) {
      const existingPatient = await prisma.patient.findFirst({
        where: {
          doctorId,
          OR: [
            { phone: validatedData.phone },
            { phone: cleanPhone },
            { phone: `+${cleanPhone}` },
            { phone: { endsWith: last10 } }
          ]
        },
        select: { id: true, firstName: true, lastName: true, phone: true }
      });

      if (existingPatient) {
        return NextResponse.json(
          {
            error: `A patient with this mobile number already exists (${existingPatient.firstName} ${existingPatient.lastName}, ${existingPatient.phone}).`,
            existingPatient
          },
          { status: 409 }
        );
      }
    }

    const normalizedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : (validatedData.phone.startsWith("+") ? validatedData.phone : `+${cleanPhone}`);

    const patient = await prisma.$transaction(async (tx) => {
      // 1. Lock the Doctor row to prevent concurrent creations from exceeding limits
      await tx.doctor.update({
        where: { id: doctorId },
        data: { updatedAt: new Date() }
      });

      // 2. Enforce MAX_PATIENTS under CLINIC_CORE
      const block = await entitlementGuard(doctorId, req, { module: "CLINIC_CORE", limit: "MAX_PATIENTS" });
      if (block) {
        throw block;
      }

      // 3. Create the patient
      return await tx.patient.create({
        data: {
          ...validatedData,
          phone: normalizedPhone,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : null,
          doctorId,
          primaryPractitionerId: validatedData.primaryPractitionerId || undefined,
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