import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const account = await prisma.gbpAccount.findFirst({ where: { doctorId: session.doctorId, lastSyncAt: { not: null } }, orderBy: { updatedAt: 'desc' } });
    if (!account) return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });

    return NextResponse.json({
      data: { 
        status: "healthy", 
        lastSyncAt: account.lastSyncAt,
        connected: !!account.refreshToken || !!account.accessToken,
        placesApiEnabled: !!process.env.GOOGLE_PLACES_API_KEY
      },
      source: "Gyrex Local SEO System",
      lastUpdated: account.lastSyncAt || new Date()
    });
  } catch (error: any) {
    console.error("System Health API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
