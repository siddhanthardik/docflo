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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Enterprise SaaS metrics and system health.</p>
        </div>
      </div>

      {/* Top Level KPIs - Responsive 2x2 Grid on Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total MRR</span>
            <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-xl text-emerald-700 font-extrabold text-xs">
              ₹
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{(revenueData?.consolidated?.mrr ?? revenueData?.mrr ?? 0).toLocaleString("en-IN")}
            </h3>
            <p className="text-xs font-bold text-slate-500">
              ₹{(revenueData?.inr?.mrr || 0).toLocaleString("en-IN")} INR
              {Boolean(revenueData?.usd?.mrr && revenueData.usd.mrr > 0) && ` • $${revenueData.usd.mrr.toLocaleString("en-US")} USD`}
            </p>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            ARR: ₹{(revenueData?.consolidated?.arr ?? revenueData?.arr ?? 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all hover:border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-xl">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{(revenueData?.consolidated?.totalRevenue ?? revenueData?.totalRevenue ?? 0).toLocaleString("en-IN")}
            </h3>
            {Boolean(revenueData?.usd?.totalRevenue && revenueData.usd.totalRevenue > 0) ? (
              <p className="text-xs font-bold text-slate-500">
                ₹{(revenueData?.inr?.totalRevenue || 0).toLocaleString("en-IN")} INR • ${revenueData.usd.totalRevenue.toLocaleString("en-US")} USD
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium mt-1">Lifetime collections</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all hover:border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Active Clinics</span>
            <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-xl">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{customerData?.activeClinics || 0}</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Out of {customerData?.totalCustomers || 0} total</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all hover:border-violet-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Active AI Clinics</span>
            <div className="p-1.5 sm:p-2 bg-violet-50 rounded-xl">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{usageData?.activeClinicsWithAi ?? usageData?.aiUsage ?? 0}</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {customerData?.activeClinics ? `${Math.round(((usageData?.activeClinicsWithAi ?? usageData?.aiUsage ?? 0) / customerData.activeClinics) * 100)}% clinic adoption` : "Across all clinics"}
          </p>
        </div>
      </div>

      {/* Middle Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Revenue Growth (6M)</h3>
          </div>
          <div className="p-4">
            <RevenueChart data={revenueData?.revenueChart || []} />
          </div>
        </div>
        
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Clinic Acquisition (6M)</h3>
          </div>
          <div className="p-4">
            <AcquisitionChart data={customerData?.acquisitionChart || []} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Details & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Top Clinics */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top Performing Clinics</h3>
          </div>
          <div className="flex-1 overflow-auto max-h-[300px]">
            <TopClinicsList clinics={recentData?.topClinics || []} />
          </div>
        </div>

        {/* Latest Payments */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Latest Payments</h3>
          </div>
          <div className="flex-1 overflow-auto max-h-[300px]">
            <LatestPayments payments={recentData?.latestPayments || []} />
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-400" />
              System Health
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">Database Size</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-900">{healthData?.databaseSize || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">Daily Logins</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-900">{healthData?.dailyActiveUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-700">API Status</span>
              </div>
              <span className="text-xs font-bold text-emerald-600">Operational</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
