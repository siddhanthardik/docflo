import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LeadDetailClient from "./lead-detail-client";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  
  const lead = await prisma.auditLead.findUnique({
    where: { id: leadId },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        include: { report: true }
      },
      activities: {
        orderBy: { createdAt: "desc" }
      },
      assignedTo: true,
    }
  });

  if (!lead) {
    notFound();
  }

  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' }
  });

  return <LeadDetailClient lead={lead} packages={packages} />;
}
