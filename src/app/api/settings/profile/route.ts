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
        createdAt: true,
        package: { select: { name: true } },
        subscriptionStatus: true,
      },
    });

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

    const body = await req.json();
    const { name, phone, specialty, clinicName, address, city, state, country, currentPassword, newPassword } = body;

    const updateData: any = {
      name,
      phone,
      specialty,
      clinicName,
      address,
      city,
      state,
      country,
    };

    // Handle password change
    if (newPassword && currentPassword) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: session.user.id },
      });

      if (!doctor) {
        return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
      }

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