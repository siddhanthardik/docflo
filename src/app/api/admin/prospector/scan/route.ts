import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProspectorService } from "@/lib/prospector";
import { GoogleSheetsService } from "@/lib/google-sheets";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { areaOrPincode, specialty, city, country, limit = 10 } = body;

    if (!areaOrPincode || !specialty) {
      return NextResponse.json({ error: "Area / PIN code and Specialty are required" }, { status: 400 });
    }

    // 1. Discover clinics & extract emails
    const leads = await ProspectorService.discoverClinics({
      areaOrPincode,
      specialty,
      city,
      country,
      limit: Number(limit),
    });

    // 2. Sync lead rows to Google Sheet
    const sheetSync = await GoogleSheetsService.syncLeadsToSheet(leads);

    return NextResponse.json({
      success: true,
      message: `Discovered ${leads.length} doctor leads and synced to Google Sheets.`,
      leads,
      sheetSync,
    });
  } catch (error: any) {
    console.error("[PROSPECTOR SCAN ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to scan area" }, { status: 500 });
  }
}
