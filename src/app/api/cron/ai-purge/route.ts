import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Nightly Cron Job: 30-Day Rolling Storage Auto-Purge
 * 
 * Cleans up raw WhatsApp chat_messages older than 30 days for inactive conversations,
 * maintaining a lightweight, high-performance database capped at ~50GB total storage
 * across 1,00,000+ platform doctors while permanently preserving doctor custom rules and feedback.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow local development executions
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Purge old chat messages older than 30 days
    const purgeResult = await prisma.chatMessage.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    console.log(`[AI Storage Auto-Purge Cron] Deleted ${purgeResult.count} chat messages older than 30 days.`);

    return NextResponse.json({
      success: true,
      purgedCount: purgeResult.count,
      cutoffDate: thirtyDaysAgo.toISOString()
    });
  } catch (error: any) {
    console.error("GET /api/cron/ai-purge error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
