import { prisma } from "@/lib/prisma";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { GbpInformationProvider } from "@/lib/google-providers/GbpInformationProvider";
import { GbpPerformanceProvider } from "@/lib/google-providers/GbpPerformanceProvider";
import { GooglePlacesProvider } from "@/lib/google-providers/GooglePlacesProvider";
import { GbpReviewsProvider } from "@/lib/google-providers/GbpReviewsProvider";
import { GbpPostsProvider } from "@/lib/google-providers/GbpPostsProvider";
import { GbpQaProvider } from "@/lib/google-providers/GbpQaProvider";
import { GoogleNormalizer } from "@/services/normalization/GoogleNormalizer";

export class GoogleSyncEngine {
  /**
   * Syncs all Google data for a given doctor's connected accounts and creates database snapshots.
   */
  static async syncAll(doctorId: string) {
    const authResult = await getValidGbpAccessToken(doctorId);
    if (!authResult) {
      throw new Error("No connected Google Business Profile found for this user.");
    }

    const { account, accessToken } = authResult;
    
    // We only sync if there is an active location
    if (!account.locationId) {
      return { success: true, message: "No active location selected. Skipped sync." };
    }

    // Ensure we don't duplicate 'locations/' if locationId already includes it
    const locationName = account.locationId?.startsWith('locations/') 
      ? account.locationId 
      : `locations/${account.locationId}`;
      
    const accountLocationPath = `accounts/${account.id}/${locationName}`; 
    // Note: The actual path depends on how the location was originally selected. 
    // Assuming locationName works for most APIs. For Reviews/Posts, parent format might vary.
    // For simplicity in this engine, we'll try to fetch what we can.

    const date = new Date();

    try {
      // 1. Sync Profile Information
      const rawProfile = await GbpInformationProvider.getLocationInformation(locationName, accessToken);
      const normalizedProfile = GoogleNormalizer.normalizeProfileInfo(rawProfile);
      
      await prisma.profileSnapshot.create({
        data: {
          gbpAccountId: account.id,
          locationId: account.locationId,
          date,
          json: JSON.parse(JSON.stringify(normalizedProfile))
        }
      });

      // 2. Sync Performance Metrics (Last 30 days as a default sync batch)
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      
      const rawPerformance = await GbpPerformanceProvider.getPerformanceMetrics(locationName, accessToken, {
        startDate: { year: start.getFullYear(), month: start.getMonth() + 1, day: start.getDate() },
        endDate: { year: end.getFullYear(), month: end.getMonth() + 1, day: end.getDate() }
      });

      await prisma.gbpPerformanceSnapshot.create({
        data: {
          gbpAccountId: account.id,
          locationId: account.locationId,
          date,
          json: rawPerformance
        }
      });

      // 3. Sync Keyword Impressions (Current Month)
      const rawKeywords = await GbpPerformanceProvider.getSearchKeywords(locationName, accessToken, {
        startMonth: { year: start.getFullYear(), month: start.getMonth() + 1 },
        endMonth: { year: end.getFullYear(), month: end.getMonth() + 1 }
      });

      await prisma.gbpKeywordSnapshot.create({
        data: {
          gbpAccountId: account.id,
          locationId: account.locationId,
          date,
          json: rawKeywords
        }
      });

      // 4. Sync Reviews
      // We need the full path like accounts/123/locations/456 for some APIs
      // If the account has insightsData.accountName, we use it to build the full path.
      let fullLocationPath = account.locationName || locationName;
      const insights = account.insightsData as any;
      
      if (insights && insights.accountName && !fullLocationPath.startsWith("accounts/")) {
        // Ensure locationName doesn't already have 'locations/' if we're joining it
        const locPart = locationName.startsWith("locations/") ? locationName : `locations/${locationName}`;
        fullLocationPath = `${insights.accountName}/${locPart}`;
      } else if (!fullLocationPath.startsWith("accounts/")) {
        // If we don't have accountName in insights, fallback to locationName (which may fail for v4 APIs)
        fullLocationPath = locationName;
      }

      if (fullLocationPath.startsWith('accounts/')) {
        try {
          const rawReviews = await GbpReviewsProvider.getReviews(fullLocationPath, accessToken);
          await prisma.gbpReviewSnapshot.create({
            data: {
              gbpAccountId: account.id,
              locationId: account.locationId,
              date,
              json: rawReviews
            }
          });
        } catch (revErr) {
          console.warn("[GoogleSyncEngine] Failed to sync reviews:", revErr);
        }
      }

      // 5. Sync Competitors (If we have lat/lng from profile)
      if (rawProfile.latlng) {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
        if (apiKey) {
           const primaryCategory = normalizedProfile.primaryCategory || "medical_clinic";
           const rawCompetitors = await GooglePlacesProvider.searchNearbyCompetitors(
             rawProfile.latlng.latitude,
             rawProfile.latlng.longitude,
             primaryCategory,
             apiKey
           );
           
           const normalizedCompetitors = GoogleNormalizer.normalizeCompetitors(rawCompetitors, rawProfile.latlng.latitude, rawProfile.latlng.longitude);
           
           await prisma.competitorSnapshot.create({
             data: {
               gbpAccountId: account.id,
               locationId: account.locationId,
               date,
               json: JSON.parse(JSON.stringify(normalizedCompetitors))
             }
           });
        }
      }

      // 6. Sync Posts (Local Posts)
      if (fullLocationPath.startsWith('accounts/')) {
        try {
          const rawPosts = await GbpPostsProvider.getPosts(fullLocationPath, accessToken);
          await prisma.gbpPostSnapshot.create({
            data: {
              gbpAccountId: account.id,
              locationId: account.locationId,
              date,
              json: rawPosts
            }
          });
        } catch (postErr) {
          console.warn("[GoogleSyncEngine] Failed to sync posts:", postErr);
        }
      }

      // 7. Sync Q&A
      try {
        const rawQa = await GbpQaProvider.getQuestionsAndAnswers(locationName, accessToken);
        await prisma.gbpQaSnapshot.create({
          data: {
            gbpAccountId: account.id,
            locationId: account.locationId,
            date,
            json: rawQa
          }
        });
      } catch (qaErr) {
        console.warn("[GoogleSyncEngine] Failed to sync Q&A:", qaErr);
      }

      // Update lastSyncAt (do not overwrite locationName with the English profile title)
      await prisma.gbpAccount.update({
        where: { id: account.id },
        data: { 
          lastSyncAt: new Date(),
          // We intentionally do NOT update locationName here to prevent overwriting Google identifiers with human-readable titles.
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error("Sync Engine Error:", error);
      throw new Error(`Sync Engine Failed: ${error.message}`);
    }
  }
}

