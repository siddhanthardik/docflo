import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { ReportEngine } from "@/lib/reports/engine";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    let timezone = searchParams.get("timezone");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

    // Retrieve clinic info for timezone and metadata
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { timezone: true, clinicName: true, name: true }
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Fallback to browser timezone only if clinic timezone is missing/invalid
    if (doctor.timezone && doctor.timezone !== "UTC") {
      timezone = doctor.timezone;
    } else if (!timezone) {
      timezone = "UTC";
    }

    const clinicName = doctor.clinicName || "My Clinic";
    const generatedBy = doctor.name;

    try {
      const report = await ReportEngine.generateGrowthReport(
        doctorId,
        clinicName,
        generatedBy,
        startDate,
        endDate,
        timezone!
      );
      
      // Flatten for the legacy frontend to remain backwards compatible for now
      return NextResponse.json({
        ...report.totals,
        metadata: report.metadata,
        dateRange: report.dateRange
      });
    } catch (err: any) {
      if (err.message.includes("exceeds maximum allowed limit") || err.message.includes("cannot be after") || err.message.includes("Invalid date")) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}