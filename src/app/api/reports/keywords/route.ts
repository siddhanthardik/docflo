import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function GET() {
  try {
    const { doctorId } = await getSessionData();

    const gbpAccount = await prisma.gbpAccount.findFirst({
      where: { doctorId },
      select: { insightsData: true },
    });

    // Try to extract keyword data from stored GBP insights (if available)
    let keywords: any[] = [];
    if (gbpAccount?.insightsData) {
      const insights = gbpAccount.insightsData as any;
      // Check if searchKeywords was stored during a previous sync
      if (insights.searchKeywords && Array.isArray(insights.searchKeywords)) {
        keywords = insights.searchKeywords;
      }
    }

    // If no data, return an empty array (the UI shows a message)
    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Error fetching keyword data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}