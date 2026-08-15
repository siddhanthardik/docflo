import { prisma } from "@/lib/prisma";
import { GBPService } from "@/services/gbp.service";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";

export interface PublishResult {
  postId: string;
  doctorId: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  error?: string;
  gbpPostId?: string;
}

export class GbpPostPublisherService {
  /**
   * Scans and publishes all GBP posts that are scheduled and due for publication (scheduledFor <= now).
   */
  static async publishDuePosts(): Promise<{
    scanned: number;
    published: number;
    failed: number;
    results: PublishResult[];
  }> {
    const now = new Date();

    // 1. Fetch all due scheduled posts
    const duePosts = await prisma.gBPPost.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: {
          lte: now,
        },
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    if (duePosts.length === 0) {
      return { scanned: 0, published: 0, failed: 0, results: [] };
    }

    console.log(`[GbpPostPublisherService] Found ${duePosts.length} due scheduled post(s) to publish.`);

    const results: PublishResult[] = [];
    let publishedCount = 0;
    let failedCount = 0;

    for (const post of duePosts) {
      try {
        const doctorId = post.doctorId;

        // 2. Fetch valid GBP OAuth account & access token
        const authResult = await getValidGbpAccessToken(doctorId);
        if (!authResult || !authResult.account || !authResult.accessToken) {
          throw new Error("Google Business Profile is not connected or token is invalid.");
        }

        const { account, accessToken } = authResult;
        const insights = account.insightsData as any;

        if (!insights?.locationName) {
          throw new Error("No clinic location selected for Google Business Profile.");
        }

        let fullLocationName = insights.locationName;
        if (insights.accountName && !fullLocationName.startsWith("accounts/")) {
          const locPart = fullLocationName.startsWith("locations/") ? fullLocationName : `locations/${fullLocationName}`;
          fullLocationName = `${insights.accountName}/${locPart}`;
        }

        // 3. Publish to Google Business Profile via API
        const gbpService = new GBPService(accessToken, doctorId);
        const res = await gbpService.createPost(
          fullLocationName,
          post.content,
          post.postType || "STANDARD",
          post.imageUrl || undefined,
          post.ctaType || undefined,
          post.ctaLink || undefined
        );

        // 4. Update post status to PUBLISHED
        await prisma.gBPPost.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            gbpPostId: res.name,
            gbpAccountId: account.id,
          },
        });

        console.log(`[GbpPostPublisherService] Successfully published post ${post.id} (GBP Post ID: ${res.name})`);
        publishedCount++;
        results.push({
          postId: post.id,
          doctorId: post.doctorId,
          status: "SUCCESS",
          gbpPostId: res.name,
        });
      } catch (error: any) {
        console.error(`[GbpPostPublisherService] Failed to publish post ${post.id}:`, error.message);
        failedCount++;
        results.push({
          postId: post.id,
          doctorId: post.doctorId,
          status: "FAILED",
          error: error.message || "Unknown publishing error",
        });
      }
    }

    return {
      scanned: duePosts.length,
      published: publishedCount,
      failed: failedCount,
      results,
    };
  }
}
