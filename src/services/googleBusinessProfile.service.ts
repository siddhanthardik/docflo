import { prisma } from "@/lib/prisma";
import { GbpAccount } from "@/types/gbp";

export type GBPNormalizedAccount = GbpAccount;

export class GoogleBusinessProfileService {
  /**
   * Checks if the user has any connected Google Business Profile accounts.
   */
  static async getConnectedProfile(doctorId: string): Promise<boolean> {
    const account = await prisma.gbpAccount.findFirst({
      where: { doctorId },
      select: { id: true }
    });
    return !!account;
  }

  /**
   * Retrieves all normalized accounts for the user.
   */
  static async getAccounts(doctorId: string): Promise<GBPNormalizedAccount[]> {
    const accounts = await prisma.gbpAccount.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' }
    });

    if (!accounts.length) return [];

    return Promise.all(accounts.map(async (account) => {
      const insights = (account.insightsData as any) || {};
      
      const storedReviews = await prisma.review.findMany({
        where: { doctorId, source: "GOOGLE", gbpAccountId: account.id }, 
        orderBy: { reviewDate: "desc" },
        take: 5
      });

      return {
        id: account.id,
        locationId: account.locationId,
        locationName: account.locationName,
        insights: {
          name: insights.name || "Google Business Profile",
          formattedAddress: insights.formattedAddress || "",
          rating: insights.rating || 0,
          user_ratings_total: insights.user_ratings_total || 0,
          phone: insights.phone || "",
          website: insights.website || "",
          placeId: insights.placeId || null,
          mapsUri: insights.mapsUri || "",
          newReviewUri: insights.newReviewUri || "",
          totalViews: insights.totalViews || 0,
          searchViews: insights.searchViews || 0,
          mapsViews: insights.mapsViews || 0,
          phoneCalls: insights.phoneCalls || 0,
          directionRequests: insights.directionRequests || 0,
          websiteClicks: insights.websiteClicks || 0,
          directSearches: insights.directSearches || 0,
          discoverySearches: insights.discoverySearches || 0,
          totalActions: insights.totalActions || 0,
          searchKeywords: insights.searchKeywords || [],
          categories: insights.categories || null,
          description: insights.description || "",
          accountName: insights.accountName || "",
        },
        recentReviews: storedReviews.map(r => ({
          id: r.id,
          author_name: r.reviewerName,
          rating: r.rating,
          text: r.comment,
          replied: r.responded,
          reply: r.reply,
          relative_time_description: r.reviewDate ? r.reviewDate.toISOString() : new Date().toISOString(),
        }))
      };
    }));
  }

  /**
   * Retrieves a specific active location for the user by its internal DB ID.
   */
  static async getActiveLocation(doctorId: string, accountId: string): Promise<GBPNormalizedAccount | null> {
    const accounts = await this.getAccounts(doctorId);
    return accounts.find(acc => acc.id === accountId) || null;
  }
}
