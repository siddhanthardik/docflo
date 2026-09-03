import { prisma } from "@/lib/prisma";
import type { GbpAccountInsights as GBPInsights } from "@/types/gbp";

interface GBPAccount {
  name: string;
  accountName?: string;
  type?: string;
}

interface GBPLocation {
  name: string;
  title?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  phoneNumbers?: {
    primaryPhone?: string;
  };
  websiteUri?: string;
  metadata?: {
    mapsUri?: string;
    newReviewUri?: string;
  };
  categories?: any;
  regularHours?: any;
  profile?: {
    description?: string;
  };
}

const ACCOUNT_MANAGEMENT_BASE =
  "https://mybusinessaccountmanagement.googleapis.com/v1";
const BUSINESS_INFORMATION_BASE =
  "https://mybusinessbusinessinformation.googleapis.com/v1";
const PERFORMANCE_BASE = "https://businessprofileperformance.googleapis.com/v1";
const LEGACY_GBP_BASE = "https://mybusiness.googleapis.com/v4";

const LOCATION_READ_MASK = [
  "name",
  "title",
  "storefrontAddress",
  "phoneNumbers",
  "websiteUri",
  "metadata",
  "categories",
  "regularHours",
  "profile"
].join(",");

export function sanitizeGbpPostSummary(summary: string): { cleanSummary: string; hadPhone: boolean } {
  if (!summary) return { cleanSummary: "", hadPhone: false };

  // Google strictly bans phone numbers in post description (phone-stuffing policy).
  // Detect contact patterns with phone labels or 10+ digit phone numbers
  const phonePatternWithLabels = /(?:📞|☎️|📱|Tel|Phone|Call|Mobile|Contact)(?:\s*(?:us|today|now)?)?(?:\s*(?:at|on|:))?\s*(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/gi;
  const rawPhonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}/g;

  let hadPhone = false;
  let clean = summary;

  if (phonePatternWithLabels.test(clean)) {
    hadPhone = true;
    clean = clean.replace(phonePatternWithLabels, "Tap 'Call Now' below to reach our team.");
  } else if (rawPhonePattern.test(clean)) {
    const matches = clean.match(rawPhonePattern);
    if (matches && matches.some((m) => m.replace(/\D/g, "").length >= 10)) {
      hadPhone = true;
      clean = clean.replace(rawPhonePattern, "");
    }
  }

  clean = clean
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();

  return { cleanSummary: clean, hadPhone };
}

export class GBPService {
  private accessToken: string;
  private doctorId: string;

  constructor(accessToken: string, doctorId: string) {
    this.accessToken = accessToken;
    this.doctorId = doctorId;
  }

  private async googleFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(
        `Google Business Profile API error ${response.status}: ${details}`
      );
    }

    return response.json() as Promise<T>;
  }

  private getPerformanceLocationName(locationName: string) {
    if (/^locations\/[^/]+$/.test(locationName)) {
      return locationName;
    }

    const locationMatch = locationName.match(/\/locations\/([^/]+)/);
    return locationMatch ? `locations/${locationMatch[1]}` : null;
  }

  private sumMetric(data: any, metricName: string) {
    const series =
      data?.multiDailyMetricTimeSeries
        ?.flatMap((item: any) => item.dailyMetricTimeSeries || [])
        ?.filter((item: any) => item.dailyMetric === metricName) || [];

    return series.reduce((metricTotal: number, item: any) => {
      const points = item.timeSeries?.datedValues || [];
      return (
        metricTotal +
        points.reduce(
          (pointTotal: number, point: any) => pointTotal + Number(point.value || 0),
          0
        )
      );
    }, 0);
  }

  async getAccounts(): Promise<GBPAccount[]> {
    const accounts: GBPAccount[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({ pageSize: "20" });
      if (pageToken) params.set("pageToken", pageToken);

      const data = await this.googleFetch<{
        accounts?: GBPAccount[];
        nextPageToken?: string;
      }>(`${ACCOUNT_MANAGEMENT_BASE}/accounts?${params.toString()}`);

      accounts.push(...(data.accounts || []));
      pageToken = data.nextPageToken;
    } while (pageToken);

    return accounts;
  }

  async getLocations() {
    return this.getAccounts();
  }

  async listLocations(accountName: string): Promise<GBPLocation[]> {
    const locations: GBPLocation[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        pageSize: "100",
        readMask: LOCATION_READ_MASK,
      });
      if (pageToken) params.set("pageToken", pageToken);

      const data = await this.googleFetch<{
        locations?: GBPLocation[];
        nextPageToken?: string;
      }>(
        `${BUSINESS_INFORMATION_BASE}/${accountName}/locations?${params.toString()}`
      );

      locations.push(...(data.locations || []));
      pageToken = data.nextPageToken;
    } while (pageToken);

    return locations;
  }

  async discoverFirstLocation() {
    const accounts = await this.getAccounts();

    for (const account of accounts) {
      const accountLocations = await this.listLocations(account.name);
      const location = accountLocations.find((item) => item.name);

      if (location) {
        return { account, location };
      }
    }

    return null;
  }

  async discoverAllLocations() {
    const accounts = await this.getAccounts();
    const allLocations: { account: GBPAccount; location: GBPLocation }[] = [];

    for (const account of accounts) {
      const accountLocations = await this.listLocations(account.name);
      for (const location of accountLocations) {
        if (location.name) {
          allLocations.push({ account, location });
        }
      }
    }

    return allLocations;
  }

  async getLocationDetails(locationName: string) {
    const params = new URLSearchParams({ readMask: LOCATION_READ_MASK });
    return this.googleFetch<GBPLocation>(
      `${BUSINESS_INFORMATION_BASE}/${locationName}?${params.toString()}`
    );
  }

  async getInsights(locationName: string, startDate: Date, endDate: Date): Promise<GBPInsights> {
    try {
      const performanceLocationName = this.getPerformanceLocationName(locationName);
      if (!performanceLocationName) {
        throw new Error("Invalid Google Business Profile location format");
      }

      const currentParams = new URLSearchParams();
      [
        "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
        "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
        "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
        "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
        "WEBSITE_CLICKS",
        "CALL_CLICKS",
        "BUSINESS_DIRECTION_REQUESTS",
        "BUSINESS_BOOKINGS"
      ].forEach((metric) => currentParams.append("dailyMetrics", metric));
      
      currentParams.set("dailyRange.start_date.year", String(startDate.getFullYear()));
      currentParams.set("dailyRange.start_date.month", String(startDate.getMonth() + 1));
      currentParams.set("dailyRange.start_date.day", String(startDate.getDate()));
      currentParams.set("dailyRange.end_date.year", String(endDate.getFullYear()));
      currentParams.set("dailyRange.end_date.month", String(endDate.getMonth() + 1));
      currentParams.set("dailyRange.end_date.day", String(endDate.getDate()));

      const previousStartDate = new Date(startDate);
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
      const prevEndDate = new Date(endDate);
      prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);

      const prevParams = new URLSearchParams(currentParams.toString());
      prevParams.set("dailyRange.start_date.year", String(previousStartDate.getFullYear()));
      prevParams.set("dailyRange.start_date.month", String(previousStartDate.getMonth() + 1));
      prevParams.set("dailyRange.start_date.day", String(previousStartDate.getDate()));
      prevParams.set("dailyRange.end_date.year", String(prevEndDate.getFullYear()));
      prevParams.set("dailyRange.end_date.month", String(prevEndDate.getMonth() + 1));
      prevParams.set("dailyRange.end_date.day", String(prevEndDate.getDate()));

      const [data, prevData] = await Promise.all([
        this.googleFetch<any>(`${PERFORMANCE_BASE}/${performanceLocationName}:fetchMultiDailyMetricsTimeSeries?${currentParams.toString()}`),
        this.googleFetch<any>(`${PERFORMANCE_BASE}/${performanceLocationName}:fetchMultiDailyMetricsTimeSeries?${prevParams.toString()}`)
      ]);

      const desktopMaps = this.sumMetric(data, "BUSINESS_IMPRESSIONS_DESKTOP_MAPS");
      const desktopSearch = this.sumMetric(data, "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH");
      const mobileMaps = this.sumMetric(data, "BUSINESS_IMPRESSIONS_MOBILE_MAPS");
      const mobileSearch = this.sumMetric(data, "BUSINESS_IMPRESSIONS_MOBILE_SEARCH");
      
      const mapsViews = desktopMaps + mobileMaps;
      const searchViews = desktopSearch + mobileSearch;
      const totalViews = searchViews + mapsViews;
      
      const websiteClicks = this.sumMetric(data, "WEBSITE_CLICKS");
      const phoneCalls = this.sumMetric(data, "CALL_CLICKS");
      const directionRequests = this.sumMetric(data, "BUSINESS_DIRECTION_REQUESTS");
      const bookings = this.sumMetric(data, "BUSINESS_BOOKINGS");
      const totalActions = websiteClicks + phoneCalls + directionRequests + bookings;

      // Previous Year
      const prevDesktopMaps = this.sumMetric(prevData, "BUSINESS_IMPRESSIONS_DESKTOP_MAPS");
      const prevDesktopSearch = this.sumMetric(prevData, "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH");
      const prevMobileMaps = this.sumMetric(prevData, "BUSINESS_IMPRESSIONS_MOBILE_MAPS");
      const prevMobileSearch = this.sumMetric(prevData, "BUSINESS_IMPRESSIONS_MOBILE_SEARCH");
      const prevMapsViews = prevDesktopMaps + prevMobileMaps;
      const prevSearchViews = prevDesktopSearch + prevMobileSearch;
      const prevTotalViews = prevSearchViews + prevMapsViews;

      const prevWebsiteClicks = this.sumMetric(prevData, "WEBSITE_CLICKS");
      const prevPhoneCalls = this.sumMetric(prevData, "CALL_CLICKS");
      const prevDirectionRequests = this.sumMetric(prevData, "BUSINESS_DIRECTION_REQUESTS");
      const prevBookings = this.sumMetric(prevData, "BUSINESS_BOOKINGS");
      const prevTotalActions = prevWebsiteClicks + prevPhoneCalls + prevDirectionRequests + prevBookings;

      const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
      };

      const viewsChange = calcChange(totalViews, prevTotalViews);
      const actionsChange = calcChange(totalActions, prevTotalActions);

      const insights: GBPInsights = {
        locationName,
        profileName: locationName,
        totalSearches: totalViews,
        directSearches: 0,
        discoverySearches: 0,
        totalViews,
        searchViews,
        mapsViews,
        totalActions,
        websiteClicks,
        phoneCalls,
        directionRequests,
        viewsChange,
        searchChange: viewsChange,
        actionsChange
      };

      // Extract time series for charts
      const timeSeriesData = data.multiDailyMetricTimeSeries || [];

      const accountRecord = await prisma.gbpAccount.findUnique({
        where: {
          doctorId_locationName: {
            doctorId: this.doctorId,
            locationName: locationName,
          },
        },
        select: { insightsData: true },
      });
      const existingInsights = (accountRecord?.insightsData as any) || {};

      const newInsightsData = {
        ...existingInsights,
        ...insights,
        desktopMaps,
        desktopSearch,
        mobileMaps,
        mobileSearch,
        timeSeriesData,
        bookings,
        fetchedMonth: `${startDate.getFullYear()}-${startDate.getMonth() + 1}`,
        cacheVersion: 2
      };

      await prisma.gbpAccount.update({
        where: {
          doctorId_locationName: {
            doctorId: this.doctorId,
            locationName: locationName,
          },
        },
        data: {
          insightsData: newInsightsData as any,
          lastSyncAt: new Date(),
        },
      });

      return insights;
    } catch (error) {
      console.error("Error fetching GBP insights:", error);
      throw error;
    }
  }

  async getSearchKeywords(locationName: string, startMonth: Date, endMonth: Date) {
    try {
      const performanceLocationName = this.getPerformanceLocationName(locationName);
      if (!performanceLocationName) {
        return [];
      }

      const params = new URLSearchParams({ pageSize: "100" });
      params.set("monthlyRange.start_month.year", String(startMonth.getFullYear()));
      params.set("monthlyRange.start_month.month", String(startMonth.getMonth() + 1));
      params.set("monthlyRange.end_month.year", String(endMonth.getFullYear()));
      params.set("monthlyRange.end_month.month", String(endMonth.getMonth() + 1));

      const data = await this.googleFetch<any>(
        `${PERFORMANCE_BASE}/${performanceLocationName}/searchkeywords/impressions/monthly?${params.toString()}`
      );

      const keywords = (data.searchKeywordsCounts || []).map((item: any) => ({
        query: item.searchKeyword,
        impressions: Number(item.insightsValue?.value || item.insightsValue?.threshold || 0),
        clicks: 0,
        ctr: 0,
        avgPosition: 0,
        trend: "stable",
      }));

      const accountRecord = await prisma.gbpAccount.findUnique({
        where: {
          doctorId_locationName: {
            doctorId: this.doctorId,
            locationName: locationName,
          },
        },
      });
      const existingInsights = (accountRecord?.insightsData as any) || {};
      existingInsights.searchKeywords = keywords;
      await prisma.gbpAccount.update({
        where: {
          doctorId_locationName: {
            doctorId: this.doctorId,
            locationName: locationName,
          },
        },
        data: { insightsData: existingInsights },
      });

      return keywords;
    } catch (error) {
      console.error("Error fetching search keywords:", error);
      return [];
    }
  }

  async getReviews(locationName: string, gbpAccountId?: string) {
    try {
      let fullPath = locationName.trim();
      
      if (!fullPath.startsWith("accounts/")) {
        let accountName: string | undefined;
        if (gbpAccountId) {
          const acc = await prisma.gbpAccount.findUnique({ where: { id: gbpAccountId } });
          const insights = (acc?.insightsData as any) || {};
          accountName = insights.accountName;
        }
        if (!accountName) {
          try {
            const accountsData = await this.googleFetch<any>(`${LEGACY_GBP_BASE}/accounts`);
            if (accountsData?.accounts?.[0]?.name) {
              accountName = accountsData.accounts[0].name;
            }
          } catch (e) {
            console.warn("[GBPService] Could not fetch accounts list:", e);
          }
        }
        if (accountName) {
          const locPart = fullPath.startsWith("locations/") ? fullPath : `locations/${fullPath}`;
          fullPath = `${accountName}/${locPart}`;
        }
      }

      if (!fullPath.startsWith("accounts/")) {
        console.warn(`[GBPService] Cannot fetch reviews: location path "${fullPath}" is not in accounts/X/locations/Y format.`);
        return [];
      }

      const allRawReviews: any[] = [];
      let pageToken: string | undefined = undefined;
      let averageRating: number | undefined;
      let totalReviewCount: number | undefined;

      do {
        const params = new URLSearchParams({
          pageSize: "50",
          orderBy: "updateTime desc",
        });
        if (pageToken) params.set("pageToken", pageToken);

        const data = await this.googleFetch<any>(
          `${LEGACY_GBP_BASE}/${fullPath}/reviews?${params.toString()}`
        );
        
        if (data.reviews) {
          allRawReviews.push(...data.reviews);
        }
        
        // Capture stats from first page
        if (!pageToken) {
          averageRating = data.averageRating;
          totalReviewCount = data.totalReviewCount;
        }

        pageToken = data.nextPageToken;
      } while (pageToken);

      const reviews = allRawReviews.map((review: any) => ({
        reviewId: review.reviewId,
        reviewerName: review.reviewer?.displayName || "Google user",
        rating:
          review.starRating === "FIVE" ? 5 :
          review.starRating === "FOUR" ? 4 :
          review.starRating === "THREE" ? 3 :
          review.starRating === "TWO" ? 2 :
          review.starRating === "ONE" ? 1 : 0,
        comment: review.comment || "",
        createTime: review.createTime,
        reply: review.reviewReply?.comment || null,
      }));

      if (gbpAccountId && (averageRating !== undefined || totalReviewCount !== undefined)) {
        const account = await prisma.gbpAccount.findUnique({ where: { id: gbpAccountId } });
        if (account) {
          const insights = (account.insightsData as any) || {};
          insights.rating = averageRating || insights.rating || 0;
          insights.user_ratings_total = totalReviewCount || insights.user_ratings_total || 0;
          
          await prisma.gbpAccount.update({
            where: { id: gbpAccountId },
            data: { insightsData: insights }
          });
        }
      }

      for (const review of reviews) {
        await prisma.review.upsert({
          where: { id: review.reviewId },
          update: {
            rating: review.rating,
            comment: review.comment,
            reply: review.reply,
            responded: !!review.reply,
            gbpAccountId: gbpAccountId || undefined,
          },
          create: {
            id: review.reviewId,
            doctorId: this.doctorId,
            gbpAccountId: gbpAccountId || undefined,
            reviewerName: review.reviewerName,
            rating: review.rating,
            comment: review.comment,
            reply: review.reply,
            source: "GOOGLE",
            reviewDate: new Date(review.createTime),
            responded: !!review.reply,
          },
        });
      }

      // Cleanup: Delete reviews from the database that are no longer present in Google's API response
      // This ensures the local database count perfectly matches the live Google Reviews count.
      if (gbpAccountId) {
        const fetchedReviewIds = reviews.map((r: any) => r.reviewId);
        await prisma.review.deleteMany({
          where: {
            doctorId: this.doctorId,
            gbpAccountId: gbpAccountId,
            source: "GOOGLE",
            id: { notIn: fetchedReviewIds },
          },
        });
      }

      return reviews;
    } catch (error) {
      console.error("Error fetching GBP reviews:", error);
      throw error;
    }
  }

  async replyToReview(
    locationName: string,
    reviewId: string,
    comment: string
  ) {
    try {
      if (!locationName.startsWith("accounts/")) {
        throw new Error("Reviews can only be managed for OAuth-connected GBP locations");
      }

      const response = await fetch(
        `${LEGACY_GBP_BASE}/${locationName}/reviews/${reviewId}/reply`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comment }),
        }
      );
      if (!response.ok) throw new Error("Failed to reply to review");

      await prisma.review.update({
        where: { id: reviewId },
        data: { reply: comment, responded: true },
      });
      return await response.json();
    } catch (error) {
      console.error("Error replying to review:", error);
      throw error;
    }
  }

  async createPost(
    locationName: string,
    summary: string,
    topicType: string = "STANDARD",
    imageUrl?: string,
    ctaType?: string,
    ctaLink?: string,
    languageCode: string = "en"
  ) {
    try {
      if (!locationName.startsWith("accounts/")) {
        throw new Error("Posts can only be created for OAuth-connected GBP locations");
      }

      // Pre-flight sanitize summary to prevent Google content filter rejections
      const { cleanSummary, hadPhone } = sanitizeGbpPostSummary(summary);
      let effectiveCtaType = ctaType;

      // If user included a phone number in text and had no action button, auto-attach "Call Now"
      if (hadPhone && (!effectiveCtaType || effectiveCtaType === "NONE")) {
        effectiveCtaType = "CALL";
      }

      // Build the request body for GBP API
      const body: any = {
        summary: cleanSummary || summary,
        languageCode,
        topicType: topicType || "STANDARD",
      };

      // Add Media (Image)
      if (imageUrl) {
        let fullUrl = imageUrl;
        if (imageUrl.startsWith("/")) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gyrex.in";
          fullUrl = `${baseUrl}${imageUrl}`;
        }

        body.media = [
          {
            mediaFormat: "PHOTO",
            sourceUrl: fullUrl,
          },
        ];
      }

      // Add Call to Action
      if (effectiveCtaType && effectiveCtaType !== "NONE") {
        if (effectiveCtaType === "CALL") {
          body.callToAction = {
            actionType: "CALL",
          };
        } else if (ctaLink) {
          body.callToAction = {
            actionType: effectiveCtaType,
            url: ctaLink,
          };
        }
      }

      const response = await fetch(
        `${LEGACY_GBP_BASE}/${locationName}/localPosts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("GBP createPost error:", response.status, errorText);

        let friendlyMessage = `Failed to create post on Google Business Profile: ${errorText}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed?.error?.code === 500 || parsed?.error?.status === "INTERNAL") {
            friendlyMessage = "Google rejected this post (Google Content Policy Error). Google does not allow phone numbers or unverified links in the post text body. Please remove any phone numbers from the text and use the 'Call Now' button instead.";
          } else if (parsed?.error?.message) {
            friendlyMessage = `Google Business Profile error: ${parsed.error.message}`;
          }
        } catch (_) {}

        throw new Error(friendlyMessage);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }
}

