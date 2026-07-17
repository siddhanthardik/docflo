"use client";

import { useState, useEffect } from "react";
import { Loader2, Globe, Zap, CalendarDays, Camera, ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import { useLocationContext } from "@/contexts/LocationContext";

const COLORS = ['#f9ab00', '#4285f4', '#34a853', '#ea4335', '#8b5cf6'];

export default function BusinessInsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(`${new Date().getFullYear()}-${new Date().getMonth() + 1}`);
  const [isComparing, setIsComparing] = useState(false);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const { activeLocationId } = useLocationContext();

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const url = `/api/gbp/insights?month=${encodeURIComponent(dateRange)}${activeLocationId ? `&locationId=${activeLocationId}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [dateRange, activeLocationId]);

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const { summary, traffic, engagement, deepDives, reputation } = data;

  const StatCard = ({ title, value, change, icon: Icon, colorClass }: any) => {
    const numericChange = Number(change) || 0;
    const isNegative = numericChange < 0;
    const displayChange = Math.abs(numericChange);
    
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
            <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <div>
          <div className="text-4xl font-black text-indigo-600 mb-2">{value}</div>
          <div className={`text-xs font-bold flex items-center gap-1 ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
            {isNegative ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
            {isNegative ? '-' : '+'}{displayChange}% this month
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Business Insights</h1>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg flex items-center text-sm px-1 overflow-hidden">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer w-full focus:ring-0"
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const val = `${d.getFullYear()}-${d.getMonth() + 1}`;
                const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                return <option key={val} value={val}>{label}</option>;
              })}
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 transition-colors">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 font-medium">Custom Range</span>
          </div>

          <div 
            onClick={() => setIsComparing(!isComparing)}
            className={`flex items-center gap-2 shadow-sm rounded-lg px-3 py-1.5 text-sm cursor-pointer transition-colors border ${isComparing ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <span className={isComparing ? "font-bold" : "font-medium"}>Compare:</span>
            <span className="font-medium">Previous Period</span>
          </div>
        </div>
      </div>

      {/* TOP SUMMARY ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Views" 
          value={summary.totalViews.value.toLocaleString()} 
          change={summary.totalViews.change} 
          icon={Globe} 
          colorClass="bg-blue-600 text-blue-600" 
        />
        <StatCard 
          title="Search Views" 
          value={summary.totalViews.breakdown.search.toLocaleString()} 
          change={0} 
          icon={Zap} 
          colorClass="bg-amber-500 text-amber-500" 
        />
        <StatCard 
          title="Map Views" 
          value={summary.totalViews.breakdown.maps.toLocaleString()} 
          change={0} 
          icon={CalendarDays} 
          colorClass="bg-purple-500 text-purple-500" 
        />
        <StatCard 
          title="Total Actions" 
          value={summary.totalActions.value.toLocaleString()} 
          change={summary.totalActions.change} 
          icon={Camera} 
          colorClass="bg-pink-500 text-pink-500" 
        />
      </div>

      {/* ROW 2: TRAFFIC & VIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm col-span-2">
          <h3 className="text-base font-bold text-gray-900 mb-6">Views Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={traffic.dailyViews} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line connectNulls={true} type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={3} dot={{ r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-6">Top Search Keywords</h3>
          {traffic.topKeywords?.length > 0 ? (
            <>
              <div className="space-y-3 mt-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {(showAllKeywords ? traffic.topKeywords : traffic.topKeywords.slice(0, 5)).map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-sm font-medium text-gray-600 truncate max-w-[150px]">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{item.value}</span>
                  </div>
                ))}
              </div>
              {traffic.topKeywords.length > 5 && (
                <button 
                  onClick={() => setShowAllKeywords(!showAllKeywords)}
                  className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 w-full text-center py-1 transition-colors hover:bg-indigo-50 rounded"
                >
                  {showAllKeywords ? "Show less" : "Show all keywords"}
                </button>
              )}
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4">
              <span className="text-3xl mb-2">🔍</span>
              <p className="text-sm font-medium text-gray-500">Not enough search keyword data available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ROW 3: ENGAGEMENT & PLATFORMS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-6">Patient Actions</h3>
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">📞 Called your clinic</span>
              <span className="text-sm font-bold text-indigo-600">{engagement.patientActions.called}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">📍 Got directions</span>
              <span className="text-sm font-bold text-indigo-600">{engagement.patientActions.directions}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">🌐 Visited website</span>
              <span className="text-sm font-bold text-indigo-600">{engagement.patientActions.website}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">🖼️ Viewed photos</span>
              <span className="text-sm font-bold text-indigo-600">{engagement.patientActions.photos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">📅 Booked appointment</span>
              <span className="text-sm font-bold text-indigo-600">{engagement.patientActions.booked}</span>
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-6">Device Breakdown</h3>
          {engagement.deviceBreakdown?.reduce((sum: number, item: any) => sum + (item.value || 0), 0) > 0 ? (
            <>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={engagement.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {engagement.deviceBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {engagement.deviceBreakdown.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-sm font-medium text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center text-center px-4">
              <span className="text-3xl mb-2">📱</span>
              <p className="text-sm font-medium text-gray-500">No device data available yet.</p>
            </div>
          )}
        </div>

        {/* Platform Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-6">Platform Breakdown</h3>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={traffic.platformBreakdown} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151' }} width={80} />
                <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 4: CALL ANALYTICS & REVIEW METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm col-span-2">
          <h3 className="text-base font-bold text-gray-900 mb-6">Call Analytics Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deepDives.callsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line connectNulls={true} type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-6">Review Metrics</h3>
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">Average Rating</span>
              <span className="text-sm font-bold text-amber-500 flex items-center gap-1">{reputation.metrics.avgRating} ⭐</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">Total Reviews</span>
              <span className="text-sm font-black text-gray-900">{reputation.metrics.totalReviews}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">This Month</span>
              <span className="text-sm font-bold text-emerald-500">{reputation.metrics.thisMonth} new</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-600">Response Rate</span>
              <span className="text-sm font-bold text-indigo-600">{reputation.metrics.responseRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Avg Response Time</span>
              <span className="text-sm font-bold text-gray-900">{reputation.metrics.avgResponseTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 5: REPUTATION GROWTH */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-6">Review Sentiment & Growth</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reputation.sentimentGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} domain={['dataMin - 0.2', 'dataMax + 0.2']} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Line connectNulls={true} yAxisId="left" type="monotone" dataKey="rating" name="Avg Rating" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
              <Line yAxisId="right" type="monotone" dataKey="reviews" name="Total Reviews" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
