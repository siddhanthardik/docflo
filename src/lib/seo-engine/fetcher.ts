import { prisma } from "@/lib/prisma";
import { ScanStatus } from "@prisma/client";

export async function createSnapshotFromAccount(
  gbpAccountId: string,
  engineRunId: string,
  engineVersion: string = "1.0.0"
) {
  const account = await prisma.gbpAccount.findUnique({
    where: { id: gbpAccountId }
  });

  if (!account) throw new Error("Account not found");

  const startMs = Date.now();
  let scanStatus = ScanStatus.SUCCESS;
  let apiErrors: any = null;
  let apiLatencyMs = 0;

  let reviewCount: number | null = null;
  let averageRating: number | null = null;
  let photoCount: number | null = null;
  let postCount: number | null = null;
  let primaryCategory: string | null = null;
  let unansweredReviews: number | null = null;
  let hasAppointmentUrl: boolean | null = null;
  let hasWebsite: boolean | null = null;

  let rawData: any = {};

  try {
    // In a real production system, this invokes the Google API.
    // For now, we simulate extraction from the connected account's cache.
    const apiStart = Date.now();
    rawData = account.insightsData || {};
    
    // Explicit null extraction - NEVER default to 0
    if (typeof rawData.totalReviews === 'number') reviewCount = rawData.totalReviews;
    if (typeof rawData.averageRating === 'number') averageRating = rawData.averageRating;
    if (typeof rawData.photoCount === 'number') photoCount = rawData.photoCount;
    if (typeof rawData.postCount === 'number') postCount = rawData.postCount;
    if (rawData.categories?.primaryCategory?.displayName) primaryCategory = rawData.categories.primaryCategory.displayName;
    if (typeof rawData.unansweredReviews === 'number') unansweredReviews = rawData.unansweredReviews;
    if (rawData.appointmentUrl !== undefined) hasAppointmentUrl = !!rawData.appointmentUrl;
    if (rawData.websiteUrl !== undefined) hasWebsite = !!rawData.websiteUrl;

    apiLatencyMs = Date.now() - apiStart;
    
    // Simulate partial failure detection
    if (reviewCount === null && postCount === null && !rawData.mockData) {
      // In a real scenario, this happens if Google API returned a partial object or quota error for a specific endpoint
      scanStatus = ScanStatus.PARTIAL;
      apiErrors = { message: "Partial data fetched", missingFields: ["totalReviews", "postCount"] };
    }
  } catch (error: any) {
    scanStatus = ScanStatus.FAILED;
    apiErrors = { message: error.message, stack: error.stack };
  }

  const scanDurationMs = Date.now() - startMs;

  const snapshot = await prisma.gbpSnapshot.create({
    data: {
      gbpAccountId,
      engineRunId,
      scanStatus,
      apiErrors,
      scanDurationMs,
      apiLatencyMs,
      engineVersion,
      connectorVersion: "google-api-nodejs-client v120",
      googleApiVersion: "v1",
      reviewCount,
      averageRating,
      photoCount,
      postCount,
      primaryCategory,
      unansweredReviews,
      hasAppointmentUrl,
      hasWebsite,
      rawGoogleResponse: rawData
    }
  });

  return snapshot;
}
