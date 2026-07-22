"use client";

import { useState } from "react";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, MousePointerClick, Calendar, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export function SearchVisibility() {
  const { data: visibilityData, isLoading } = useLocalSeoModule<any>('performance');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Time period is static for now since API always syncs last 6 months or current month, 
  // but we can mock the dropdown UI for aesthetic purposes matching Google's.
  const now = new Date();
  const currentMonthStr = format(now, "MMM yyyy");
  const timePeriodLabel = `${currentMonthStr}–${currentMonthStr}`;

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (!visibilityData) return null;

  let desktopSearch = 0;
  let mobileSearch = 0;
  let desktopMaps = 0;
  let mobileMaps = 0;
  let websiteClicks = 0;
  let callClicks = 0;
  let directionRequests = 0;
  let bookings = 0;
  let foodOrders = 0;

  if (visibilityData?.multiDailyMetricTimeSeries) {
    for (const series of visibilityData.multiDailyMetricTimeSeries) {
      let sum = 0;
      if (series.timeSeries && series.timeSeries.datedValues) {
        for (const val of series.timeSeries.datedValues) {
          sum += parseInt(val.value || '0', 10);
        }
      }
      
      switch (series.dailyMetric) {
        case 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH': desktopSearch = sum; break;
        case 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH': mobileSearch = sum; break;
        case 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS': desktopMaps = sum; break;
        case 'BUSINESS_IMPRESSIONS_MOBILE_MAPS': mobileMaps = sum; break;
        case 'WEBSITE_CLICKS': websiteClicks = sum; break;
        case 'CALL_CLICKS': callClicks = sum; break;
        case 'BUSINESS_DIRECTION_REQUESTS': directionRequests = sum; break;
        case 'BUSINESS_BOOKINGS': bookings = sum; break;
        case 'BUSINESS_FOOD_ORDERS': foodOrders = sum; break;
      }
    }
  }

  const totalViews = desktopSearch + mobileSearch + desktopMaps + mobileMaps;
  const totalClicks = websiteClicks + callClicks + directionRequests + bookings;

  if (totalViews === 0 && totalClicks === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Performance Data</h3>
        <p className="text-gray-500 max-w-md mx-auto">Google has not reported any performance metrics for this location.</p>
      </div>
    );
  }

  const pieData = [
    { name: 'Google Search – mobile', value: mobileSearch, color: '#f9ab00' }, // Yellow/Orange
    { name: 'Google Search – desktop', value: desktopSearch, color: '#4285f4' }, // Blue
    { name: 'Google Maps – mobile', value: mobileMaps, color: '#ea4335' }, // Red
    { name: 'Google Maps – desktop', value: desktopMaps, color: '#34a853' }, // Green
  ].filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Top Header matching Google UI */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          <div className="text-blue-600 border-b-2 border-blue-600 pb-2 font-medium text-sm whitespace-nowrap cursor-pointer">Overview</div>
          <div className="text-gray-500 pb-2 font-medium text-sm whitespace-nowrap cursor-pointer hover:text-gray-700">Calls</div>
          <div className="text-gray-500 pb-2 font-medium text-sm whitespace-nowrap cursor-pointer hover:text-gray-700">Chat clicks</div>
          <div className="text-gray-500 pb-2 font-medium text-sm whitespace-nowrap cursor-pointer hover:text-gray-700">Bookings</div>
          <div className="text-gray-500 pb-2 font-medium text-sm whitespace-nowrap cursor-pointer hover:text-gray-700">Directions</div>
          <div className="text-gray-500 pb-2 font-medium text-sm whitespace-nowrap cursor-pointer hover:text-gray-700">Website clicks</div>
        </div>

        <div className="relative hidden md:block">
          <div className="absolute -top-3 left-3 bg-white px-1 text-xs text-blue-600 font-medium">Time period</div>
          <button 
            className="flex items-center gap-2 border-2 border-blue-600 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <Calendar className="h-4 w-4 text-gray-500" />
            {timePeriodLabel}
            <ChevronDown className="h-4 w-4 text-gray-500 ml-2" />
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-10">
          <h2 className="text-5xl font-light text-gray-900 mb-2">{totalViews.toLocaleString()}</h2>
          <div className="flex items-center text-gray-600 gap-2">
            <Eye className="h-4 w-4" />
            <span>People viewed your Business Profile</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Platform and device breakdown</h3>
            <p className="text-sm text-gray-500 mb-6">Platform and devices that people used to find your profile</p>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-48 w-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => value?.toLocaleString()}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                {pieData.map((item, idx) => {
                  const percentage = totalViews > 0 ? Math.round((item.value / totalViews) * 100) : 0;
                  return (
                    <div key={idx} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-bold text-gray-900">{item.value.toLocaleString()} · {percentage}%</span>
                      </div>
                      <div className="text-sm text-gray-500 ml-4 pl-1">{item.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-8 flex flex-col justify-center">
             <div className="mb-8">
               <h3 className="text-lg font-medium text-gray-900 mb-6">Engagement Actions</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Website clicks</span>
                   <span className="font-bold text-gray-900">{websiteClicks.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Calls</span>
                   <span className="font-bold text-gray-900">{callClicks.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Direction requests</span>
                   <span className="font-bold text-gray-900">{directionRequests.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Bookings</span>
                   <span className="font-bold text-gray-900">{bookings.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                   <span className="text-gray-900 font-medium">Total Actions</span>
                   <span className="font-bold text-blue-600">{totalClicks.toLocaleString()}</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
