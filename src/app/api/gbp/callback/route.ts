import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { GBPService } from "@/services/gbp.service";

const GBP_OAUTH_STATE_COOKIE = "gbp_oauth_state";

function getAppUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

function redirectTo(req: Request, path: string) {
  const response = NextResponse.redirect(`${getAppUrl(req)}${path}`);
  response.cookies.set(GBP_OAUTH_STATE_COOKIE, "", { maxAge: 0, path: "/api/gbp" });
  return response;
}

function decodeState(state: string) {
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      doctorId?: string;
      nonce?: string;
    };
  } catch {
    return {};
  }
}

function formatAddress(location: any) {
  const address = location.storefrontAddress;
  if (!address) return "";

  return [
    ...(address.addressLines || []),
    address.locality,
    address.administrativeArea,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const cookieState = req.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${GBP_OAUTH_STATE_COOKIE}=`))
      ?.split("=")[1];

    if (!code || !state || !cookieState || state !== cookieState) {
      return redirectTo(req, "/gbp?error=invalid_oauth_state");
    }

    const stateData = decodeState(state);
    const { doctorId } = await getSessionData();
    if (!stateData.doctorId || stateData.doctorId !== doctorId) {
      return redirectTo(req, "/gbp?error=invalid_oauth_state");
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return redirectTo(req, "/gbp?error=google_oauth_not_configured");
    }

    const appUrl = getAppUrl(req);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${appUrl}/api/gbp/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("GBP token exchange failed:", await tokenResponse.text());
      return redirectTo(req, "/gbp?error=token_exchange_failed");
    }

    const tokenData = await tokenResponse.json();
    const existingAccount = await prisma.gbpAccount.findFirst({
      where: { doctorId, refreshToken: { not: "" } },
    });
    const refreshToken = tokenData.refresh_token || existingAccount?.refreshToken;

    if (!refreshToken) {
      return redirectTo(req, "/gbp?error=missing_refresh_token");
    }

    // Set secure HttpOnly cookie with the tokens to use in the selection screen
    const tempTokenData = {
      accessToken: tokenData.access_token,
      refreshToken,
      expiresIn: tokenData.expires_in || 3600
    };
    
    const response = NextResponse.redirect(`${getAppUrl(req)}/gbp/select-profile`);
    response.cookies.set(GBP_OAUTH_STATE_COOKIE, "", { maxAge: 0, path: "/api/gbp" }); // Clear state cookie
    response.cookies.set("gbp_temp_auth", JSON.stringify(tempTokenData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in GBP callback:", error);
    return redirectTo(req, "/gbp?error=connection_failed");
  }
}

