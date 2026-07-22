import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${baseUrl}/api/integrations/google-calendar/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "GOOGLE_CLIENT_ID environment variable is missing. Please add it to your .env file." },
        { status: 400 }
      );
    }

    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" ");

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes,
      access_type: "offline",
      prompt: "consent",
      state: session.user.id,
    }).toString()}`;

    return NextResponse.redirect(googleAuthUrl);
  } catch (error: any) {
    console.error("Google Calendar auth error:", error);
    return NextResponse.json({ error: "Failed to initiate Google Calendar OAuth" }, { status: 500 });
  }
}
