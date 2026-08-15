import { NextResponse } from "next/server";
import { GbpPostPublisherService } from "@/services/gbp-post-publisher.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Basic CRON secret check
    if (process.env.CRON_SECRET && req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[CRON] Starting Scheduled GBP Posts Publishing Sweep...");

    const summary = await GbpPostPublisherService.publishDuePosts();

    return NextResponse.json({
      success: true,
      message: `Scheduled GBP posts sweep finished. Scanned: ${summary.scanned}, Published: ${summary.published}, Failed: ${summary.failed}`,
      summary,
    });
  } catch (error: any) {
    console.error("[CRON GBP POSTS ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
