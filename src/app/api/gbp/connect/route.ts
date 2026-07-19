import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

const GBP_OAUTH_STATE_COOKIE = "gbp_oauth_state";
const GBP_SCOPE = "https://www.googleapis.com/auth/business.manage";

function getAppUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

function encodeState(value: Record<string, string>) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export async function GET(req: Request) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: "Google OAuth client is not configured" },
        { status: 500 }
      );
    }

    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;
    const nonce = randomBytes(24).toString("base64url");
    const state = encodeState({ doctorId, nonce });
    const appUrl = getAppUrl(req);

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set("redirect_uri", `${appUrl}/api/gbp/callback`);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", GBP_SCOPE);
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent select_account");
    googleAuthUrl.searchParams.set("include_granted_scopes", "true");
    googleAuthUrl.searchParams.set("state", state);

    const response = NextResponse.json({ url: googleAuthUrl.toString() });
    response.cookies.set(GBP_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/api/gbp",
    });

    return response;
  } catch (error) {
    console.error("Error initiating GBP connection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
