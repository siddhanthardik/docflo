"use client";

import { useState } from "react";
import {
  Users, Calendar, Star, TrendingUp, Eye, MousePointerClick, Phone, Navigation, UserPlus, Search, Loader2, BarChart3, Bot, Clock, MessageSquare, ShieldAlert, CreditCard, Download, Printer, DollarSign
} from "lucide-react";
import { KeywordTracker } from "@/components/reports/keyword-tracker";
import { useToast } from "@/components/ui/use-toast";
import { exportReportToCSV } from "@/lib/reports/export";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

type TabKey = "operations" | "financial" | "patients" | "reviews" | "automation";

export default function ReportsPage() {
  const { toast } = useToast();
  
  const getLocalYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const initialEnd = getLocalYMD(new Date());
  const initialStart = getLocalYMD(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("operations");

  const setPreset = (preset: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'today') {
      // already set to today
    } else if (preset === 'yesterday') {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
    } else if (preset === '7days') {
      start.setDate(now.getDate() - 7);
    } else if (preset === '30days') {
      start.setDate(now.getDate() - 30);
    } else if (preset === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'ytd') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    setStartDate(getLocalYMD(start));
    setEndDate(getLocalYMD(end));
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/reports/growth?startDate=${startDate}&endDate=${endDate}&timezone=${encodeURIComponent(tz)}`);
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
    
    const outcomesData = [
      { name: 'Completed', value: reportData.appointmentOutcomes?.completed || 0 },
      { name: 'Confirmed', value: reportData.appointmentOutcomes?.scheduled || 0 },
      { name: 'Cancelled', value: reportData.appointmentOutcomes?.cancelled || 0 },
      { name: 'No-Show', value: reportData.appointmentOutcomes?.noShow || 0 },
    ].filter(d => d.value > 0);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Calendar} color="indigo" title="Total Appointments" value={reportData.totalAppointments || 0} />
          <StatCard icon={TrendingUp} color="emerald" title="Completed" value={reportData.appointmentOutcomes?.completed || 0} />
          <StatCard icon={ShieldAlert} color="red" title="No-Shows" value={reportData.appointmentOutcomes?.noShow || 0} />
          <StatCard icon={Clock} color="amber" title="Cancelled" value={reportData.appointmentOutcomes?.cancelled || 0} />
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
    );
  };

  const renderFinancial = () => {
    if (!reportData || !reportData.financials) return null;
    const { financials } = reportData;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={DollarSign} color="emerald" title="Revenue Summary" value={`$${(financials.revenueSummary || 0).toLocaleString()}`} subtitle="Total Amount Billed" />
          <StatCard icon={CreditCard} color="indigo" title="Paid Invoices" value={`$${(financials.paidInvoicesTotal || 0).toLocaleString()}`} subtitle={`${financials.paidInvoicesCount} Invoices Paid`} />
          <StatCard icon={ShieldAlert} color="yellow" title="Unpaid Invoices" value={`$${(financials.unpaidInvoicesTotal || 0).toLocaleString()}`} subtitle={`${financials.unpaidInvoicesCount} Invoices Unpaid`} />
          <StatCard icon={ShieldAlert} color="red" title="Overdue Invoices" value={`$${(financials.overdueInvoicesTotal || 0).toLocaleString()}`} subtitle={`${financials.overdueInvoicesCount} Invoices Overdue`} />
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-indigo-500" /> Collection Summary
          </h3>
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>You have a total of <strong>${(financials.outstandingAmount || 0).toLocaleString()}</strong> in outstanding payments for this period.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderPatients = () => {
    if (!reportData) return null;

    const funnelData = [
      { name: 'Leads', value: reportData.patientFunnel?.leads || 0 },
      { name: 'Active', value: reportData.patientFunnel?.active || 0 },
      { name: 'Inactive', value: reportData.patientFunnel?.inactive || 0 },
      { name: 'Lost', value: reportData.patientFunnel?.lost || 0 },
    ].filter(d => d.value > 0);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={UserPlus} color="blue" title="Total New Patients" value={reportData.totalNewPatients || 0} />
          <StatCard icon={TrendingUp} color="emerald" title="Active Patients" value={reportData.patientFunnel?.active || 0} />
          <StatCard icon={Users} color="indigo" title="Leads" value={reportData.patientFunnel?.leads || 0} />
          <StatCard icon={ShieldAlert} color="yellow" title="Inactive Patients" value={reportData.patientFunnel?.inactive || 0} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Patient Types Breakdown</h3>
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
      </div>
    );
  };

  const renderReviews = () => {
    if (!reportData) return null;
    
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Star} color="yellow" title="New Reviews Received" value={reportData.reviewCount || 0} />
          <StatCard icon={TrendingUp} color="emerald" title="Average Rating" value={reportData.avgRating ? Number(reportData.avgRating).toFixed(1) : "N/A"} />
          <StatCard icon={Eye} color="blue" title="GBP Profile Views" value={reportData.gbpData?.totalViews || 0} subtitle="Google Maps & Search" />
          <StatCard icon={MousePointerClick} color="indigo" title="GBP Interactions" value={(reportData.gbpData?.phoneCalls || 0) + (reportData.gbpData?.directionRequests || 0)} subtitle="Calls & Directions" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" /> Reputation Summary
          </h3>
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>During the selected period, your clinic received <strong>{reportData.reviewCount || 0}</strong> new reviews with an average rating of <strong>{reportData.avgRating ? Number(reportData.avgRating).toFixed(1) : "N/A"}</strong>.</p>
            {reportData.gbpData && (
              <p>Your Google Business Profile generated <strong>{reportData.gbpData.totalViews || 0}</strong> views and <strong>{(reportData.gbpData.phoneCalls || 0) + (reportData.gbpData.directionRequests || 0)}</strong> interactions (including <strong>{reportData.gbpData.phoneCalls || 0}</strong> phone calls).</p>
            )}
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
          <StatCard icon={Clock} color="emerald" title="Time Saved (hrs)" value={reportData.aiHoursSaved?.toFixed(1) || 0} subtitle="*Estimated: 2m per AI reply" />
          <StatCard icon={UserPlus} color="yellow" title="Human Handoffs" value={reportData.totalMessages - reportData.aiHandledMessages} subtitle="Handled by Staff" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-500" />
            AI & Automation Impact
          </h3>
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>During this period, your AI Assistant handled <strong>{reportData.aiHandledMessages}</strong> patient inquiries, which translates to roughly <strong>{reportData.aiHoursSaved?.toFixed(1)} hours</strong> of saved staff time (*estimated assuming 2 minutes saved per message).</p>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics & Reports</h1>
        <p className="text-gray-500 mt-1 text-sm font-medium">
          Comprehensive historical reports of your clinic's performance, operations, and financials.
        </p>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] mb-8 print:hidden">
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setPreset('today')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">Today</button>
          <button onClick={() => setPreset('yesterday')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">Yesterday</button>
          <button onClick={() => setPreset('7days')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">Last 7 Days</button>
          <button onClick={() => setPreset('30days')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">Last 30 Days</button>
          <button onClick={() => setPreset('thisMonth')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">This Month</button>
          <button onClick={() => setPreset('lastMonth')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">Last Month</button>
          <button onClick={() => setPreset('ytd')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">Year to Date</button>
        </div>
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
          
          {reportData && (
            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
              <button
                onClick={() => exportReportToCSV(reportData)}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all flex-1 sm:flex-none shadow-sm"
              >
                <Download className="h-4 w-4" /> CSV
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all flex-1 sm:flex-none shadow-sm"
              >
                <Printer className="h-4 w-4" /> Print / PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex flex-wrap gap-2 mb-6 bg-gray-100/50 p-1.5 rounded-xl w-fit print:hidden">
        {[
          { key: "operations" as const, label: "Operations", icon: Calendar },
          { key: "financial" as const, label: "Financial", icon: CreditCard },
          { key: "patients" as const, label: "Patients", icon: Users },
          { key: "reviews" as const, label: "Reviews", icon: Star },
          { key: "automation" as const, label: "Automation & AI", icon: Bot },
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
          <p className="text-gray-500 text-sm max-w-sm">Select a date range and generate a report to unlock historical insights into your clinic's performance.</p>
        </div>
      )}

      {/* Content */}
      {reportData && (
        <div className="mt-6">
          {activeTab === "operations" && renderOperations()}
          {activeTab === "financial" && renderFinancial()}
          {activeTab === "patients" && renderPatients()}
          {activeTab === "reviews" && renderReviews()}
          {activeTab === "automation" && renderAutomation()}
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
    amber: "bg-amber-50 text-amber-500",
    yellow: "bg-yellow-50 text-yellow-600",
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-rose-50 text-rose-600",
  } as any;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center gap-4 transition-all hover:shadow-md">
      <div className={`flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl ${colors[color] || 'bg-gray-50 text-gray-600'}`}>
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