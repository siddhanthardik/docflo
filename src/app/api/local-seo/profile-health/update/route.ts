import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSessionData();
    if (!session || !session.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { field, value } = body;

    if (!field) {
      return NextResponse.json({ error: "Missing field name" }, { status: 400 });
    }

    const account = await prisma.gbpAccount.findFirst({
      where: { doctorId: session.doctorId, lastSyncAt: { not: null } },
      orderBy: { updatedAt: "desc" },
    });

    if (!account) {
      return NextResponse.json({ error: "No connected Google Business Profile found" }, { status: 400 });
    }

    // 1. Fetch latest profile snapshot
    const snapshot = await prisma.profileSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: "desc" },
    });

    const snapshotData = (snapshot?.json as any) || {};

    // 2. Update snapshot JSON field
    if (field === "categories") {
      snapshotData.categories = Array.isArray(value) ? value : [value];
    } else if (field === "attributes") {
      snapshotData.attributes = Array.isArray(value) ? value : [value];
    } else {
      snapshotData[field] = value;
    }

    // Upsert / Save ProfileSnapshot
    if (snapshot) {
      await prisma.profileSnapshot.update({
        where: { id: snapshot.id },
        data: {
          json: JSON.parse(JSON.stringify(snapshotData)),
          date: new Date(),
        },
      });
    } else {
      await prisma.profileSnapshot.create({
        data: {
          gbpAccountId: account.id,
          locationId: account.locationId || account.id,
          date: new Date(),
          json: JSON.parse(JSON.stringify(snapshotData)),
        },
      });
    }

    // 3. Update account.insightsData JSON as well for sync parity
    const insightsData = (account.insightsData as any) || {};
    if (field === "categories") {
      if (!insightsData.categories) insightsData.categories = {};
      insightsData.categories.additionalCategories = (Array.isArray(value) ? value : [value]).map((c: string) => ({ displayName: c }));
    } else if (field === "primaryCategory") {
      if (!insightsData.categories) insightsData.categories = {};
      insightsData.categories.primaryCategory = { displayName: value };
    } else if (field === "hours") {
      insightsData.hours = value;
      insightsData.regularHours = value;
    } else if (field === "attributes") {
      insightsData.attributes = Array.isArray(value) ? value : [value];
    } else {
      insightsData[field] = value;
    }

    await prisma.gbpAccount.update({
      where: { id: account.id },
      data: { insightsData: JSON.parse(JSON.stringify(insightsData)) },
    });

    return NextResponse.json({
      success: true,
      field,
      value,
      message: `${field} updated and synced to profile snapshot.`,
    });
  } catch (error: any) {
    console.error("Profile Health Update API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
