import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DollarSign, Users, Package as PackageIcon, ArrowUpRight, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();
  
  const totalCustomers = await prisma.doctor.count();
  const activePackages = await prisma.package.count({ where: { isActive: true } });
  
  // Calculate real MRR
  const activeSubscriptions = await prisma.doctor.findMany({
    where: { subscriptionStatus: "ACTIVE" },
    include: { package: true }
  });
  
  const totalMRR = activeSubscriptions.reduce((acc, doc) => {
    return acc + (doc.package?.price || 0);
  }, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Superadmin Overview</h1>
          <p className="text-gray-500 mt-1">Key metrics and performance of your SaaS platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total MRR</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">${totalMRR}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalCustomers}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Packages</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{activePackages}</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <PackageIcon className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{activeSubscriptions.length}</h3>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-rose-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
