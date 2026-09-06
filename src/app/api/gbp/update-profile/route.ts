import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { GBPService } from "@/services/gbp.service";
import { formatOperatingHours, convertToGoogleRegularHours } from "@/lib/operating-hours";

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;
    const body = await req.json();
    const { locationId, description, category, hours, appointmentUrl, phone, website, attributes, categories } = body;

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const account = await prisma.gbpAccount.findFirst({
      where: { id: locationId, doctorId }
    });

    if (!account) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const insightsData = (account.insightsData as any) || {};

    if (description !== undefined) {
      insightsData.description = description;
    }
    if (category !== undefined) {
      if (!insightsData.categories) insightsData.categories = {};
      insightsData.categories.primaryCategory = { displayName: category, categoryId: `gcid:${category.toLowerCase().replace(/\s+/g, '_')}` };
    }
    if (categories !== undefined) {
      if (!insightsData.categories) insightsData.categories = {};
      insightsData.categories.additionalCategories = (Array.isArray(categories) ? categories : [categories]).map((c: string) => ({ displayName: c }));
    }
    if (hours !== undefined) {
      insightsData.hours = formatOperatingHours(hours);
      insightsData.regularHours = convertToGoogleRegularHours(hours);
    }
    if (appointmentUrl !== undefined) {
      insightsData.appointmentUrl = appointmentUrl;
    }
    if (phone !== undefined) {
      insightsData.phone = phone;
    }
    if (website !== undefined) {
      insightsData.website = website;
    }
    if (attributes !== undefined) {
      insightsData.attributes = Array.isArray(attributes) ? attributes : [attributes];
    }

    await prisma.gbpAccount.update({
      where: { id: account.id },
      data: { insightsData }
    });

    // Also update snapshot if exists
    const snapshot = await prisma.profileSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: "desc" },
    });
    if (snapshot) {
      const snapData = (snapshot.json as any) || {};
      if (description !== undefined) snapData.description = description;
      if (hours !== undefined) snapData.hours = formatOperatingHours(hours);
      if (phone !== undefined) snapData.phone = phone;
      if (website !== undefined) snapData.website = website;
      await prisma.profileSnapshot.update({
        where: { id: snapshot.id },
        data: { json: snapData, date: new Date() }
      }).catch(() => {});
    }

    // Google Maps live sync
    let googleSynced = false;
    let googleSyncError: string | null = null;

    try {
      const tokenData = await getValidGbpAccessToken(doctorId);
      if (tokenData?.accessToken && account.locationName) {
        const gbpService = new GBPService(tokenData.accessToken, doctorId);
        const updateMask: string[] = [];
        const patchData: any = {};

        if (description !== undefined) {
          updateMask.push("profile.description");
          patchData.profile = { description };
        }
        if (website !== undefined) {
          updateMask.push("websiteUri");
          patchData.websiteUri = website;
        }
        if (phone !== undefined) {
          updateMask.push("phoneNumbers.primaryPhone");
          patchData.phoneNumbers = { primaryPhone: phone };
        }
        if (hours !== undefined) {
          updateMask.push("regularHours");
          patchData.regularHours = convertToGoogleRegularHours(hours);
        }
        if (category !== undefined) {
          updateMask.push("categories.primaryCategory");
          if (!patchData.categories) patchData.categories = {};
          patchData.categories.primaryCategory = { displayName: category };
        }
        if (categories !== undefined) {
          updateMask.push("categories.additionalCategories");
          if (!patchData.categories) patchData.categories = {};
          patchData.categories.additionalCategories = (Array.isArray(categories) ? categories : [categories]).map((c: string) => ({ displayName: c }));
        }

        if (updateMask.length > 0) {
          await gbpService.patchLocation(account.locationName, updateMask, patchData);
          googleSynced = true;
        }
      }
    } catch (gErr: any) {
      console.warn("[GBP update-profile] Live Google sync error:", gErr.message);
      googleSyncError = gErr.message;
    }

    return NextResponse.json({
      success: true,
      googleSynced,
      googleSyncError,
      insights: insightsData
    });
  } catch (error) {
    console.error("Error updating profile data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
