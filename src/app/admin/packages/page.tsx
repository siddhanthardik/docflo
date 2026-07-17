import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PackagesClient } from "./PackagesClient";

export default async function PackagesPage() {
  const session = await auth();
  const packages = await prisma.package.findMany({
    orderBy: { price: "asc" }
  });

  return (
    <div className="space-y-6">
      <PackagesClient initialPackages={packages} />
    </div>
  );
}
