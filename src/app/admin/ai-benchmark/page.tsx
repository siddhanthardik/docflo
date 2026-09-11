import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AIBenchmarkClient } from "./AIBenchmarkClient";

export const dynamic = "force-dynamic";

async function getBenchmarkData() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const cookie = headersList.get("cookie") || "";

  try {
    const res = await fetch(`${protocol}://${host}/api/benchmark`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "AIR-Bench v1.0",
        seedScenarioCount: 20,
        availableCategories: [],
        recentReports: [],
        latestReport: null
      };
    }

    return res.json();
  } catch (e) {
    console.error("[getBenchmarkData] Error:", e);
    return {
      title: "AIR-Bench v1.0",
      seedScenarioCount: 20,
      availableCategories: [],
      recentReports: [],
      latestReport: null
    };
  }
}

export default async function AdminAIBenchmarkPage() {
  const session = await auth();

  if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
    redirect("/");
  }

  const data = await getBenchmarkData();

  return <AIBenchmarkClient initialData={data} />;
}
