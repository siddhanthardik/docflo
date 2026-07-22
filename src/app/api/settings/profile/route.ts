import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        clinicName: true,
        address: true,
        city: true,
        state: true,
        country: true,
        image: true,
        currency: true,
        isCurrencyLocked: true,
        role: true,
        invoicePrefix: true,
        taxGstNumber: true,
        invoiceFooter: true,
        language: true,
        dateFormat: true,
        firstDayOfWeek: true,
        timezone: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        daysOff: true,
        createdAt: true,
        package: { select: { name: true } },
        subscriptionStatus: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const response = { ...doctor, subscriptionPlan: doctor.package?.name || "FREE" };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, currency: true, isCurrencyLocked: true, role: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      name, phone, specialty, 
      clinicName, address, city, state, country, image, 
      currentPassword, newPassword,
      currency, invoicePrefix, taxGstNumber, invoiceFooter,
      language, dateFormat, firstDayOfWeek,
      timezone, workingHoursStart, workingHoursEnd, daysOff
    } = body;

    const updateData: any = {
      name, phone, specialty,
      clinicName, address, city, state, country, image,
      invoicePrefix, taxGstNumber, invoiceFooter,
      language, dateFormat, 
      firstDayOfWeek: firstDayOfWeek === "Sunday" ? 0 : (firstDayOfWeek === "Monday" ? 1 : Number(firstDayOfWeek) || 0),
      timezone, workingHoursStart, workingHoursEnd, daysOff
    };

    // Currency locking logic
    const isAdmin = doctor.role === "ADMIN" || doctor.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";

    if (currency) {
      if (doctor.isCurrencyLocked && !isAdmin) {
        // If locked and user is not admin, keep existing currency
        updateData.currency = doctor.currency;
      } else {
        // Allow update and lock if set for the first time
        updateData.currency = currency;
        if (!isAdmin) {
          updateData.isCurrencyLocked = true;
        }
      }
    }

    // Handle password change
    if (newPassword && currentPassword) {
      const { compare } = await import("bcryptjs");
      const isValid = await compare(currentPassword, doctor.password);

      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      updateData.password = await hash(newPassword, 12);
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        clinicName: true,
        address: true,
        city: true,
        state: true,
        country: true,
        image: true,
        currency: true,
        isCurrencyLocked: true,
      },
    });

    return NextResponse.json(updatedDoctor);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}