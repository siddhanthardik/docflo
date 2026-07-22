"use client";

import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerCog, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export function SystemHealth() {
  const { data: healthData, isLoading } = useLocalSeoModule<any>('system-health');

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (!healthData) return null;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 md:p-8 text-slate-300">
      <div className="flex items-center gap-2 mb-6">
        <ServerCog className="h-5 w-5 text-slate-400" />
        <h2 className="text-xl font-bold text-white">System Health</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-2">Google Connection</div>
          <div className="flex items-center gap-2">
            {healthData.connected ? (
              <><CheckCircle2 className="h-5 w-5 text-emerald-400" /> <span className="text-white font-medium">Connected</span></>
            ) : (
              <><AlertCircle className="h-5 w-5 text-red-400" /> <span className="text-white font-medium">Disconnected</span></>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-2">Last API Sync</div>
          <div className="flex items-center gap-2 text-white font-medium">
            <Clock className="h-4 w-4 text-slate-400" />
            {healthData.lastSyncAt ? new Date(healthData.lastSyncAt).toLocaleString() : "Never"}
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-2">Sync Status</div>
          <div className="flex items-center gap-2">
            {healthData.lastSyncAt ? (
              <><CheckCircle2 className="h-5 w-5 text-emerald-400" /> <span className="text-white font-medium">SUCCESS</span></>
            ) : (
              <><AlertCircle className="h-5 w-5 text-amber-400" /> <span className="text-white font-medium">NEVER RUN</span></>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-2">System Integrations</div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span>Google Places API</span>
              <span className={healthData.placesApiEnabled ? "text-emerald-400" : "text-slate-500"}>
                {healthData.placesApiEnabled ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
