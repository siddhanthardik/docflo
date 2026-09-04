import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;

    // Find connected Google Business Profile
    const account = await prisma.gbpAccount.findFirst({
      where: { doctorId },
      orderBy: { createdAt: "desc" },
    });

    if (!account) {
      return NextResponse.json({
        connected: false,
        error: "No connected Google Business Profile found. Please connect your Google Profile first.",
      });
    }

    const insights = (account.insightsData as any) || {};
    const regularHours = insights.regularHours || insights.hours || null;

    if (!regularHours) {
      return NextResponse.json({
        connected: true,
        hasHours: false,
        error: "Google Profile is connected, but opening hours are not published on Google Maps.",
      });
    }

    // Google API returns periods: [ { openDay: "MONDAY", openTime: "09:00", closeDay: "MONDAY", closeTime: "13:30" }, ... ]
    let periods: any[] = [];
    if (Array.isArray(regularHours.periods)) {
      periods = regularHours.periods;
    } else if (Array.isArray(regularHours)) {
      periods = regularHours;
    }

    let morningSlot = { enabled: false, start: "09:00", end: "13:30" };
    let afternoonSlot = { enabled: false, start: "14:00", end: "17:00" };
    let eveningSlot = { enabled: false, start: "17:30", end: "20:30" };
    let closedDays: string[] = [];

    const daysMap = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const allDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const activeDaysSet = new Set<string>();

    if (periods.length > 0) {
      // Find typical weekday slots
      for (const p of periods) {
        const day = p.openDay || p.day || "";
        if (day) activeDaysSet.add(day.toUpperCase());

        const openTime = p.openTime ? (typeof p.openTime === "string" ? p.openTime : `${String(p.openTime.hours || 0).padStart(2, '0')}:${String(p.openTime.minutes || 0).padStart(2, '0')}`) : "";
        const closeTime = p.closeTime ? (typeof p.closeTime === "string" ? p.closeTime : `${String(p.closeTime.hours || 0).padStart(2, '0')}:${String(p.closeTime.minutes || 0).padStart(2, '0')}`) : "";

        if (openTime && closeTime) {
          const startHour = parseInt(openTime.split(":")[0], 10);
          if (startHour < 12) {
            morningSlot = { enabled: true, start: openTime, end: closeTime };
          } else if (startHour >= 12 && startHour < 16) {
            afternoonSlot = { enabled: true, start: openTime, end: closeTime };
          } else {
            eveningSlot = { enabled: true, start: openTime, end: closeTime };
          }
        }
      }

      // Check which days are closed
      for (const d of allDays) {
        if (!activeDaysSet.has(d.toUpperCase())) {
          closedDays.push(d);
        }
      }
    } else if (typeof regularHours === "object") {
      // Sometimes regularHours is stored as text or map
      morningSlot.enabled = true;
    }

    return NextResponse.json({
      connected: true,
      hasHours: true,
      morningSlot,
      afternoonSlot,
      eveningSlot,
      closedDays,
      rawHours: regularHours,
    });
  } catch (error: any) {
    console.error("Error syncing google hours:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch Google hours" }, { status: 500 });
  }
}
