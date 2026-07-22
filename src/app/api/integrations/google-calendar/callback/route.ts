import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const doctorId = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (error || !code || !doctorId) {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=gcal_denied`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${baseUrl}/api/integrations/google-calendar/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=gcal_env_missing`);
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("GCal Token Exchange Error:", tokenData);
      return NextResponse.redirect(`${baseUrl}/settings/integrations?error=gcal_token_failed`);
    }

    // Update Doctor in Database with GCal credentials
    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        gcalAccessToken: tokenData.access_token,
        gcalRefreshToken: tokenData.refresh_token || undefined,
        gcalConnectedAt: new Date(),
      } as any,
    });

    return NextResponse.redirect(`${baseUrl}/settings/integrations?status=gcal_connected`);
  } catch (error) {
    console.error("Error in GCal callback:", error);
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=gcal_server_error`);
  }
}
