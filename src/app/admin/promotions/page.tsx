import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PromotionsClient } from "./PromotionsClient";

export default async function PromotionsPage() {
  const session = await auth();
  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <PromotionsClient initialPromotions={promotions} />
    </div>
  );
}
