import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { GBPService, normalizeGoogleCategory, interpretGbpError } from "@/services/gbp.service";
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

    // CRITICAL SAFETY RULE: Business Name must remain read-only.
    // Never allow Business Name edits through the normal QuickFixModal flow.
    if (field === "name" || field === "title") {
      return NextResponse.json(
        {
          error: "Business Name changes must be managed directly on Google Business Profile to prevent automated listing suspension.",
          field,
        },
        { status: 400 }
      );
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
      const normCat = normalizeGoogleCategory(value);
      insightsData.categories.primaryCategory = {
        displayName: normCat ? normCat.displayName : value,
        name: normCat ? normCat.name : undefined,
      };
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

    // 4. Push update directly to Google Business Profile API (Google Maps live sync)
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
          // CRITICAL BUG FIX: An appointment URL must NEVER overwrite the clinic's primary website!
          // Use Google's official Place Actions API (APPOINTMENT action type).
          await gbpService.upsertPlaceActionLink(account.locationName, value, "APPOINTMENT");
          googleSynced = true;
        } else if (field === "phone") {
          updateMask = ["phoneNumbers.primaryPhone"];
          patchData = { phoneNumbers: { primaryPhone: value } };
        } else if (field === "hours" || field === "regularHours") {
          updateMask = ["regularHours"];
          patchData = { regularHours: convertToGoogleRegularHours(value) };
        } else if (field === "primaryCategory") {
          // CATEGORY SAFETY: Resolve to valid Google category resource
          const normalized = normalizeGoogleCategory(value);
          if (!normalized) {
            return NextResponse.json(
              { error: `"${value}" could not be recognized as a valid Google medical category. Please select a recognized specialty.` },
              { status: 400 }
            );
          }
          updateMask = ["categories.primaryCategory"];
          patchData = {
            categories: {
              primaryCategory: {
                name: normalized.name,
                displayName: normalized.displayName,
              },
            },
          };
        } else if (field === "categories") {
          // CATEGORY SAFETY: Validate all additional categories
          const rawCats = Array.isArray(value) ? value : [value];
          const validCats: { name: string; displayName: string }[] = [];
          const invalidCats: string[] = [];

          for (const c of rawCats) {
            const norm = normalizeGoogleCategory(c);
            if (norm) {
              validCats.push(norm);
            } else {
              invalidCats.push(c);
            }
          }

          if (validCats.length === 0 && rawCats.length > 0) {
            return NextResponse.json(
              { error: `None of the selected categories could be mapped to recognized Google categories: ${invalidCats.join(", ")}` },
              { status: 400 }
            );
          }

          updateMask = ["categories.additionalCategories"];
          patchData = {
            categories: {
              additionalCategories: validCats.map((vc) => ({
                name: vc.name,
                displayName: vc.displayName,
              })),
            },
          };
        } else if (field === "attributes") {
          // ATTRIBUTES SYNC: Use Google Business Information Attributes API
          const rawAttrs = Array.isArray(value) ? value : [value];
          await gbpService.updateLocationAttributes(account.locationName, rawAttrs);
          googleSynced = true;
        }

        if (updateMask.length > 0) {
          await gbpService.patchLocation(account.locationName, updateMask, patchData);
          googleSynced = true;
        }
      }
    } catch (gErr: any) {
      console.warn("[Profile Update] Google live sync error:", gErr);
      const msg = gErr.message || "";
      if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
        googleSyncError = "Google account permissions insufficient or authorization expired.";
      } else if (msg.includes("404") || msg.includes("NOT_FOUND")) {
        googleSyncError = "Connected Google Business location was not found or has been moved.";
      } else if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        googleSyncError = "Google API rate limit reached. Please wait a few minutes before updating again.";
      } else if (msg.includes("INVALID_ARGUMENT") || msg.includes("400")) {
        googleSyncError = `Google rejected this value: ${msg.replace(/Google Business Profile API error \d+:?/, "").trim() || "Invalid format"}`;
      } else {
        googleSyncError = msg || "Failed to push live to Google Maps";
      }
    }

    return NextResponse.json({
      success: true,
      googleSynced,
      googleSyncError,
      field,
      value,
      message: googleSynced
        ? `"${field}" submitted and synced with Google Maps!`
        : `"${field}" saved locally to clinic profile. (Google sync notice: ${googleSyncError || "Offline"})`,
    });
  } catch (error: any) {
    console.error("Profile Health Update API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

