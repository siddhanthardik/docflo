import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SubscriptionsClient } from "./SubscriptionsClient";

export default async function SubscriptionsPage() {
  const session = await auth();
  if (!session || !['SUPERADMIN', 'ADMIN', 'SALES'].includes(session.user?.role || '')) {
    redirect('/login');
  }

  // Fetch doctors with their active subscriptions and package info
  const doctors = await prisma.doctor.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      country: true,
      subscriptionStatus: true,
      package: {
        select: {
          name: true,
        }
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div className="space-y-6">
      <SubscriptionsClient initialDoctors={doctors} />
    </div>
  );
}
