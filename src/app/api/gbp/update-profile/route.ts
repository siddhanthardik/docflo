import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { doctorId } = await getSessionData();
    const body = await request.json();
    const { locationId, description, category, hours } = body;

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const account = await prisma.gbpAccount.findFirst({
      where: { id: locationId, doctorId }
    });

    if (!account) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Since we are mocking the direct Google API connections right now,
    // we will save the updated profile fields directly into the insightsData JSON object.
    const insightsData = (account.insightsData as any) || {};

    if (description !== undefined) {
      insightsData.description = description;
    }
    if (category !== undefined) {
      if (!insightsData.categories) {
        insightsData.categories = {};
      }
      insightsData.categories.primaryCategory = { displayName: category, categoryId: `gcid:${category.toLowerCase().replace(/\s+/g, '_')}` };
    }
    if (hours !== undefined) {
      insightsData.regularHours = hours;
    }

    await prisma.gbpAccount.update({
      where: { id: account.id },
      data: { insightsData }
    });

    return NextResponse.json({ success: true, insights: insightsData });
  } catch (error) {
    console.error("Error updating profile data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
