import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSessionData();
    if (!session || !session.doctorId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const account = await prisma.gbpAccount.findFirst({
      where: { doctorId: session.doctorId, lastSyncAt: { not: null } },
      orderBy: { updatedAt: "desc" },
    });

    if (!account) {
      return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });
    }

    const snapshot = await prisma.profileSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: "desc" },
    });

    const doctor = await prisma.doctor.findUnique({
      where: { id: session.doctorId },
      select: { workingHoursStart: true, workingHoursEnd: true, phone: true, name: true },
    });

    const insights = (account.insightsData as any) || {};
    const snapshotData = (snapshot?.json as any) || {};

    // Dynamic Doctor Hours Fallback (e.g. 5:30 PM - 7:30 PM)
    let hours = snapshotData.hours || insights.hours || insights.regularHours;
    if (!hours && doctor?.workingHoursStart && doctor?.workingHoursEnd) {
      hours = `Mon-Sat ${doctor.workingHoursStart} - ${doctor.workingHoursEnd}`;
    }

    const mergedData = {
      ...insights,
      ...snapshotData,
      hours: hours || snapshotData.hours || insights.hours || insights.regularHours || "Mon-Sat 5:30 PM - 7:30 PM",
      attributes: snapshotData.attributes || insights.attributes || [],
    };

    return NextResponse.json({
      data: mergedData,
      source: "Google Business Profile API",
      lastUpdated: snapshot?.date || new Date(),
    });
  } catch (error: any) {
    console.error("Profile Health API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
