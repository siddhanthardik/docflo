import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const doctorId = session.user.id;

    const account = await prisma.gbpAccount.findFirst({
      where: { doctorId },
      orderBy: { createdAt: "desc" }
    });

    if (!account) {
      return NextResponse.json({ connected: false });
    }

    const insights = (account.insightsData as any) || {};
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { clinicName: true, name: true }
    });

    const displayName = account.locationName || insights.name || doctor?.clinicName || doctor?.name || "Connected Profile";

    return NextResponse.json({
      connected: true,
      locationId: account.id,
      locationName: displayName,
      connectedAt: account.createdAt.toISOString()
    });
  } catch (error) {
    console.error("GET /api/gbp/status error:", error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}
