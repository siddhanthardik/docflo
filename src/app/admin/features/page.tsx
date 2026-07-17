import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FeaturesClient } from "./FeaturesClient";
import { redirect } from "next/navigation";

export default async function FeaturesPage() {
  const session = await auth();

  if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
    redirect("/");
  }

  const featureFlags = await prisma.featureFlag.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <FeaturesClient initialFeatures={featureFlags} />
    </div>
  );
}
