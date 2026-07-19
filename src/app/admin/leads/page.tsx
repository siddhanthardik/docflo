import { prisma } from "@/lib/prisma";
import LeadDataGrid from "./lead-data-grid";
import { Users, UserPlus, Activity, CheckCircle, XCircle, TrendingUp, Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await prisma.auditLead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      assignedTo: true
    }
  });

  // Calculate Metrics
  const totalLeads = leads.length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysLeads = leads.filter(l => new Date(l.createdAt) >= today).length;
  
  const qualifiedLeads = leads.filter(l => l.status === "QUALIFIED").length;
  const customers = leads.filter(l => l.status === "CUSTOMER").length;

  const auditsRunning = leads.filter(l => l.requests[0]?.status === "SCANNING").length;
  const auditsCompleted = leads.filter(l => l.requests[0]?.status === "COMPLETED").length;
  const auditsFailed = leads.filter(l => l.requests[0]?.status === "FAILED").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CRM Leads Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">Manage, track, and assign inbound local SEO audit leads.</p>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <MetricCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total Leads" value={totalLeads} />
        <MetricCard icon={<UserPlus className="w-5 h-5 text-indigo-600" />} label="Today's Leads" value={todaysLeads} />
        <MetricCard icon={<Activity className="w-5 h-5 text-amber-600" />} label="Running Audits" value={auditsRunning} />
        <MetricCard icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} label="Completed Audits" value={auditsCompleted} />
        <MetricCard icon={<XCircle className="w-5 h-5 text-red-600" />} label="Failed Audits" value={auditsFailed} />
        <MetricCard icon={<TrendingUp className="w-5 h-5 text-purple-600" />} label="Qualified Leads" value={qualifiedLeads} />
        <MetricCard icon={<Briefcase className="w-5 h-5 text-emerald-600" />} label="Customers" value={customers} />
      </div>

      {/* Data Grid Component */}
      <LeadDataGrid leads={leads} />
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
        <div className="text-xs font-medium text-slate-500">{label}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-auto">{value}</div>
    </div>
  );
}
