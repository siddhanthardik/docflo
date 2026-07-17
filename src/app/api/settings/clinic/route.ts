import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Determine the effective doctor ID (staff members operate under their linked doctor)
    let doctorId = session.user.id;
    const role = (session.user as any).role;

    if (role === "RECEPTIONIST" || role === "STAFF") {
      const staff = await prisma.staffMember.findUnique({
        where: { id: session.user.id },
        select: { doctorId: true },
      });
      if (!staff) {
        return NextResponse.json({ error: "Staff record not found" }, { status: 400 });
      }
      doctorId = staff.doctorId;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        timezone: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        daysOff: true,
      },
    });

    return NextResponse.json(doctor || {});
  } catch (error) {
    console.error("Error fetching clinic settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let doctorId = session.user.id;
    const role = (session.user as any).role;

    if (role === "RECEPTIONIST" || role === "STAFF") {
      const staff = await prisma.staffMember.findUnique({
        where: { id: session.user.id },
        select: { doctorId: true },
      });
      if (!staff) {
        return NextResponse.json({ error: "Staff record not found" }, { status: 400 });
      }
      doctorId = staff.doctorId;
    }

    const body = await req.json();
    const { timezone, workingHoursStart, workingHoursEnd, daysOff } = body;

    if (!timezone || !workingHoursStart || !workingHoursEnd) {
      return NextResponse.json(
        { error: "Timezone, working hours start, and working hours end are required." },
        { status: 400 }
      );
    }

    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        timezone,
        workingHoursStart,
        workingHoursEnd,
        daysOff: Array.isArray(daysOff) ? daysOff : [],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating clinic settings:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}