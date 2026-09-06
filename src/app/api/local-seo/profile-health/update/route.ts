import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { GBPService } from "@/services/gbp.service";
import { formatOperatingHours, convertToGoogleRegularHours } from "@/lib/operating-hours";

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
    } else if (field === "hours") {
      snapshotData.hours = formatOperatingHours(value);
      snapshotData.regularHours = convertToGoogleRegularHours(value);
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
      insightsData.hours = formatOperatingHours(value);
      insightsData.regularHours = convertToGoogleRegularHours(value);
    } else if (field === "attributes") {
      insightsData.attributes = Array.isArray(value) ? value : [value];
    } else {
      insightsData[field] = value;
    }

    await prisma.gbpAccount.update({
      where: { id: account.id },
      data: { insightsData: JSON.parse(JSON.stringify(insightsData)) },
    });

    if (field === "phone" && typeof value === "string") {
      await prisma.doctor.update({
        where: { id: session.doctorId },
        data: { phone: value.trim() }
      }).catch(e => console.warn("Could not sync phone to doctor:", e));
    }

    // 4. Push update directly to Google Business Profile API (Google Maps sync)
    let googleSynced = false;
    let googleSyncError: string | null = null;

    try {
      const tokenData = await getValidGbpAccessToken(session.doctorId);
      if (tokenData?.accessToken && account.locationName) {
        const gbpService = new GBPService(tokenData.accessToken, session.doctorId);
        let updateMask: string[] = [];
        let patchData: any = {};

        if (field === "description") {
          updateMask = ["profile.description"];
          patchData = { profile: { description: value } };
        } else if (field === "website" || field === "websiteUri") {
          updateMask = ["websiteUri"];
          patchData = { websiteUri: value };
        } else if (field === "appointmentUrl") {
          // In Google Business Information API, websiteUri or metadata links can hold booking URL
          updateMask = ["websiteUri"];
          patchData = { websiteUri: value };
        } else if (field === "phone") {
          updateMask = ["phoneNumbers.primaryPhone"];
          patchData = { phoneNumbers: { primaryPhone: value } };
        } else if (field === "hours" || field === "regularHours") {
          updateMask = ["regularHours"];
          patchData = { regularHours: convertToGoogleRegularHours(value) };
        } else if (field === "primaryCategory") {
          updateMask = ["categories.primaryCategory"];
          patchData = { categories: { primaryCategory: { displayName: value } } };
        } else if (field === "categories") {
          updateMask = ["categories.additionalCategories"];
          const cats = (Array.isArray(value) ? value : [value]).map((c: string) => ({ displayName: c }));
          patchData = { categories: { additionalCategories: cats } };
        }

        if (updateMask.length > 0) {
          await gbpService.patchLocation(account.locationName, updateMask, patchData);
          googleSynced = true;
        }
      }
    } catch (gErr: any) {
      console.warn("[Profile Update] Google live sync note:", gErr.message);
      googleSyncError = gErr.message || "Failed to push live to Google Maps";
    }

    return NextResponse.json({
      success: true,
      googleSynced,
      googleSyncError,
      field,
      value,
      message: googleSynced
        ? `"${field}" updated and synced directly with Google Maps!`
        : `"${field}" saved to your clinic profile.`,
    });
  } catch (error: any) {
    console.error("Profile Health Update API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
