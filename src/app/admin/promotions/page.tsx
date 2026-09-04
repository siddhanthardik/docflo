import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PromotionsClient } from "./PromotionsClient";

export default async function PromotionsPage() {
  const session = await auth();
  if (!session || !["SUPERADMIN", "ADMIN", "MARKETING"].includes(session.user?.role || "")) {
    redirect("/login");
  }

  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <PromotionsClient initialPromotions={promotions} />
    </div>
  );
}
