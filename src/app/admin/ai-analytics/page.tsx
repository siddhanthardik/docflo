import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AIAnalyticsClient } from "./AIAnalyticsClient";

export const dynamic = "force-dynamic";

async function getAIAnalyticsData() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const cookie = headersList.get("cookie") || "";

  const res = await fetch(`${protocol}://${host}/api/admin/ai-analytics`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      summary: {
        totalTokensLifetime: 0,
        totalCostLifetime: 0,
        totalRequestsLifetime: 0,
        totalTokensThisMonth: 0,
        totalCostThisMonth: 0,
        totalRequestsThisMonth: 0,
        activeClinicsThisMonth: 0,
      },
      clinicLeaderboard: [],
      featureBreakdown: [],
      recentLogs: [],
    };
  }

  return res.json();
}

export default async function AdminAIAnalyticsPage() {
  const session = await auth();

  if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
    redirect("/");
  }

  const data = await getAIAnalyticsData();

  return <AIAnalyticsClient initialData={data} />;
}
