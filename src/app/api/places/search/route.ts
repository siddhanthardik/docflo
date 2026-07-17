import { NextResponse } from "next/server";
import { PlacesService } from "@/services/places.service";
import { getSessionData } from "@/lib/session";

export async function GET(req: Request) {
  try {
    await getSessionData(); // ensure authenticated
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    if (!query) return NextResponse.json({ places: [] });

    const placesService = new PlacesService();
    const places = await placesService.searchPlaces(query);
    return NextResponse.json({ places });
  } catch (error: any) {
    console.error("Places search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}