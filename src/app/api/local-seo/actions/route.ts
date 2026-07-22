import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { LocalSeoService } from "@/services/local-seo.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const data = await LocalSeoService.getActionCenter(locationId, doctorId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching actions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
