import { NextResponse } from "next/server";

/**
 * Validates CRON requests against the configured CRON_SECRET environment variable.
 * In production, if CRON_SECRET is not configured or Authorization does not match,
 * the request is rejected with 401 Unauthorized to prevent arbitrary execution.
 */
export function verifyCronRequest(req: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("Authorization");

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } else if (process.env.NODE_ENV === "production") {
    return new NextResponse(JSON.stringify({ error: "CRON_SECRET not configured on server" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  return null;
}
