import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Zap, 
  Database,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server
} from "lucide-react";
import { RevenueChart, AcquisitionChart } from "./DashboardCharts";
import { RecentActivity, LatestPayments, TopClinicsList } from "./RecentActivity";
import { headers } from "next/headers";

async function getMetrics(endpoint: string) {
  // Use absolute URL since fetch in Server Components requires it
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const cookie = headersList.get('cookie') || '';
  
  const res = await fetch(`${protocol}://${host}/api/admin/metrics/${endpoint}`, {
    headers: {
      cookie
    },
    next: { revalidate: 60 }
  });
  
  if (!res.ok) {
    console.error(`Failed to fetch ${endpoint} metrics`);
    return null;
  }
  return res.json();
}

export default async function AdminDashboardPage() {
  const session = await auth();
  
  if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
    redirect("/");
  }

  // Fetch all dashboard data concurrently
  const [revenueData, customerData, usageData, healthData, recentData] = await Promise.all([
    getMetrics("revenue"),
    getMetrics("customers"),
    getMetrics("usage"),
    getMetrics("health"),
    getMetrics("recent")
  ]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Overview</h1>
          <p className="text-gray-500 mt-1">Enterprise SaaS metrics and system health.</p>
        </div>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total MRR</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">${revenueData?.mrr || 0}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">ARR: ${revenueData?.arr || 0}</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">${revenueData?.totalRevenue || 0}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">Lifetime</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Clinics</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{customerData?.activeClinics || 0}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">Out of {customerData?.totalCustomers || 0} total</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">AI Agents Active</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{usageData?.aiUsage || 0}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">Across all clinics</p>
            </div>
            <div className="p-2 bg-violet-50 rounded-lg">
              <Zap className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-900">Revenue Growth (6M)</h3>
          </div>
          <div className="p-4">
            <RevenueChart data={revenueData?.revenueChart || []} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-900">Clinic Acquisition (6M)</h3>
          </div>
          <div className="p-4">
            <AcquisitionChart data={customerData?.acquisitionChart || []} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Details & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Clinics */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Top Performing Clinics</h3>
          </div>
          <div className="flex-1 overflow-auto max-h-[300px]">
            <TopClinicsList clinics={recentData?.topClinics || []} />
          </div>
        </div>

        {/* Latest Payments */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Latest Payments</h3>
          </div>
          <div className="flex-1 overflow-auto max-h-[300px]">
            <LatestPayments payments={recentData?.latestPayments || []} />
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Server className="h-4 w-4 text-gray-400" />
              System Health
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Database Size</span>
              </div>
              <span className="text-sm font-mono text-gray-900">{healthData?.databaseSize || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Daily Logins</span>
              </div>
              <span className="text-sm font-mono text-gray-900">{healthData?.dailyActiveUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">API Status</span>
              </div>
              <span className="text-sm font-medium text-emerald-600">Operational</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
