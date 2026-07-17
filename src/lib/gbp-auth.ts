import { prisma } from "@/lib/prisma";

export async function getValidGbpAccessToken(doctorId: string) {
  const account = await prisma.gbpAccount.findFirst({ where: { doctorId } });

  if (!account) {
    return null;
  }

  let accessToken = account.accessToken;
  if (new Date() <= account.tokenExpiry) {
    return { account, accessToken };
  }

  const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: account.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!refreshResponse.ok) {
    throw new Error("Failed to refresh Google Business Profile access token");
  }

  const refreshData = await refreshResponse.json();
  accessToken = refreshData.access_token;

  const updatedAccount = await prisma.gbpAccount.update({
    where: { id: account.id },
    data: {
      accessToken,
      tokenExpiry: new Date(Date.now() + Number(refreshData.expires_in || 3600) * 1000),
    },
  });

  return { account: updatedAccount, accessToken };
}
