import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.doctorId || session.user.id;
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const notifications = await prisma.notification.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Mark as read
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.doctorId || session.user.id;
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.notification.updateMany({
      where: { doctorId: doctor.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
