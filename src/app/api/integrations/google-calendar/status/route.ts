import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: session.user.id },
      select: {
        gcalAccessToken: true,
        gcalRefreshToken: true,
        gcalConnectedAt: true,
      },
    });

    const isConnected = Boolean(doctor?.gcalAccessToken || doctor?.gcalRefreshToken);

    return NextResponse.json({
      connected: isConnected,
      connectedAt: doctor?.gcalConnectedAt || null,
    });
  } catch (error) {
    console.error("Error fetching Google Calendar status:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
