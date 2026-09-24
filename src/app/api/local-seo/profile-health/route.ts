import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { GBPService } from "@/services/gbp.service";

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
      select: { workingHoursStart: true, workingHoursEnd: true, phone: true, name: true, specialty: true, clinicName: true },
    });

    const insights = (account.insightsData as any) || {};
    const snapshotData = (snapshot?.json as any) || {};

    // Dynamic Doctor Hours from snapshot, insights, or doctor's verified clinic timings
    let hours = snapshotData.hours || insights.hours || insights.regularHours;
    if (!hours && doctor?.workingHoursStart && doctor?.workingHoursEnd) {
      hours = `Mon-Sat ${doctor.workingHoursStart} - ${doctor.workingHoursEnd}`;
    }

    let appointmentUrl = snapshotData.appointmentUrl || insights.appointmentUrl || null;
    let attributes = snapshotData.attributes || insights.attributes || [];

    // Live Google Read-Back: If appointmentUrl or attributes are missing locally, verify against Google APIs
    if ((!appointmentUrl || attributes.length === 0) && account.locationName) {
      try {
        const tokenData = await getValidGbpAccessToken(session.doctorId);
        if (tokenData?.accessToken) {
          const gbpService = new GBPService(tokenData.accessToken, session.doctorId);
          if (!appointmentUrl) {
            const links = await gbpService.getPlaceActionLinks(account.locationName);
            const apptLink = links.find((l) => l.placeActionType === "APPOINTMENT" || l.placeActionType === "ONLINE_APPOINTMENT");
            if (apptLink?.uri) {
              appointmentUrl = apptLink.uri;
            }
          }
          if (attributes.length === 0) {
            const attrs = await gbpService.getLocationAttributes(account.locationName);
            if (attrs && attrs.length > 0) {
              attributes = attrs.map((a) => {
                const parts = a.name.split("/");
                return parts[parts.length - 1];
              });
            }
          }
        }
      } catch (readErr) {
        console.warn("[Profile Health GET] Google read-back notice:", readErr);
      }
    }

    const mergedData = {
      ...insights,
      ...snapshotData,
      hours: hours || null,
      appointmentUrl: appointmentUrl || null,
      attributes: attributes || [],
      doctorName: doctor?.name || "Doctor",
      doctorSpecialty: doctor?.specialty || "Specialist",
      clinicName: doctor?.clinicName || account.locationName || "Clinic",
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
