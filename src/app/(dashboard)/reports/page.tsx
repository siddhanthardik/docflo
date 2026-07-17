"use client";

import { useState } from "react";
import {
  Users, Calendar, Star, TrendingUp, Eye, MousePointerClick, Phone, Navigation, UserPlus, Search, Loader2, BarChart3, Bot, Clock, MessageSquare, ShieldAlert, CreditCard
} from "lucide-react";
import { KeywordTracker } from "@/components/reports/keyword-tracker";
import { useToast } from "@/components/ui/use-toast";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function ReportsPage() {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"operations" | "automation" | "growth">("operations");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/growth?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        toast({ title: "Error", description: "Failed to load report", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const labelClass = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider";

  const renderOperations = () => {
    if (!reportData) return null;
    
    const funnelData = [
      { name: 'Leads', value: reportData.patientFunnel?.leads || 0 },
      { name: 'Active', value: reportData.patientFunnel?.active || 0 },
      { name: 'Inactive', value: reportData.patientFunnel?.inactive || 0 },
      { name: 'Lost', value: reportData.patientFunnel?.lost || 0 },
    ].filter(d => d.value > 0);

    const outcomesData = [
      { name: 'Completed', value: reportData.appointmentOutcomes?.completed || 0 },
      { name: 'Scheduled', value: reportData.appointmentOutcomes?.scheduled || 0 },
      { name: 'Cancelled', value: reportData.appointmentOutcomes?.cancelled || 0 },
      { name: 'No-Show', value: reportData.appointmentOutcomes?.noShow || 0 },
    ].filter(d => d.value > 0);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} color="blue" title="Total New Patients" value={reportData.totalNewPatients} />
          <StatCard icon={Calendar} color="indigo" title="Total Appointments" value={reportData.totalAppointments} />
          <StatCard icon={TrendingUp} color="emerald" title="Active Patients" value={reportData.patientFunnel?.active || 0} />
          <StatCard icon={ShieldAlert} color="red" title="No-Shows" value={reportData.appointmentOutcomes?.noShow || 0} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Patient Conversion Funnel</h3>
            <div className="h-[300px]">
              {funnelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={funnelData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">No patient data available</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Appointment Outcomes</h3>
            <div className="h-[300px]">
              {outcomesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={outcomesData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {outcomesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">No appointment data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAutomation = () => {
    if (!reportData) return null;
    const aiPercentage = reportData.totalMessages > 0 
      ? Math.round((reportData.aiHandledMessages / reportData.totalMessages) * 100) 
      : 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={MessageSquare} color="blue" title="Total Messages" value={reportData.totalMessages} />
          <StatCard icon={Bot} color="violet" title="AI Resolution Rate" value={`${aiPercentage}%`} subtitle={`${reportData.aiHandledMessages} msgs`} />
          <StatCard icon={Clock} color="emerald" title="Time Saved (hrs)" value={reportData.aiHoursSaved?.toFixed(1) || 0} subtitle="By AI Assistant" />
          <StatCard icon={Star} color="yellow" title="Review Requests" value={reportData.reviewRequestsSent || 0} subtitle="Sent automatically" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-500" />
            AI & Automation Impact
          </h3>
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>During this period, your AI Assistant handled <strong>{reportData.aiHandledMessages}</strong> patient inquiries, which translates to roughly <strong>{reportData.aiHoursSaved?.toFixed(1)} hours</strong> of saved staff time (assuming 2 minutes per message).</p>
            <p>Additionally, the system automatically sent <strong>{reportData.reviewRequestsSent}</strong> review surveys to patients upon completion of their appointments, ensuring consistent reputation growth without manual effort.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderGrowth = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Eye} color="blue" title="Total Views" value={reportData.gbpData?.totalViews || 0} />
          <StatCard icon={MousePointerClick} color="emerald" title="Searches" value={reportData.gbpData?.totalSearches || 0} />
          <StatCard icon={Phone} color="yellow" title="Phone Calls" value={reportData.gbpData?.phoneCalls || 0} />
          <StatCard icon={Star} color="violet" title="Avg Rating" value={reportData.avgRating ? parseFloat(reportData.avgRating).toFixed(1) : "N/A"} subtitle={`from ${reportData.reviewCount} reviews`} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
          <KeywordTracker />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics & Reports</h1>
        <p className="text-gray-500 mt-1 text-sm font-medium">
          Comprehensive insights into your clinic's performance, operations, and growth.
        </p>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] mb-8">
        <div className="flex flex-col sm:flex-row items-end gap-5">
          <div className="flex-1 w-full">
            <label htmlFor="startDate" className={labelClass}>Start Date</label>
            <input id="startDate" type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1 w-full">
            <label htmlFor="endDate" className={labelClass}>End Date</label>
            <input id="endDate" type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl px-6 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all w-full sm:w-auto whitespace-nowrap shadow-sm shadow-indigo-200"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><BarChart3 className="h-4 w-4" /> Generate Report</>}
          </button>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 mb-6 bg-gray-100/50 p-1.5 rounded-xl w-fit">
        {[
          { key: "operations" as const, label: "Operations (CRM)", icon: Users },
          { key: "automation" as const, label: "Automation & AI", icon: Bot },
          { key: "growth" as const, label: "Local SEO & Growth", icon: TrendingUp },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === key
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {!reportData && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col items-center justify-center text-center animate-in fade-in">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Data Selected</h3>
          <p className="text-gray-500 text-sm max-w-sm">Select a date range and generate a report to unlock insights into your clinic's performance.</p>
        </div>
      )}

      {/* Content */}
      {reportData && (
        <div className="mt-6">
          {activeTab === "operations" && renderOperations()}
          {activeTab === "automation" && renderAutomation()}
          {activeTab === "growth" && renderGrowth()}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, color, title, value, subtitle }: any) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    emerald: "bg-emerald-50 text-emerald-600",
    yellow: "bg-amber-50 text-amber-500",
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-rose-50 text-rose-600",
  } as any;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center gap-4 transition-all hover:shadow-md">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900 leading-tight mt-0.5">{value}</p>
        {subtitle && <p className="text-xs font-medium text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}