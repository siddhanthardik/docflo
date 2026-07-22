"use client";

import { useState, useEffect } from "react";
import { Loader2, MessageCircle, Calendar, CheckCircle2, ArrowRight, XCircle } from "lucide-react";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { toast } from "@/components/ui/use-toast";

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [waStatus, setWaStatus] = useState<string>("Not Connected");
  const [gcalStatus, setGcalStatus] = useState<{ connected: boolean; connectedAt?: string | null }>({
    connected: false,
  });
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);

      // 1. WhatsApp status
      const waRes = await fetch("/api/whatsapp/qr");
      if (waRes.ok) {
        const waData = await waRes.json();
        if (waData.status === "CONNECTED") setWaStatus("Connected");
      }

      // 2. Google Calendar status
      const gcalRes = await fetch("/api/integrations/google-calendar/status");
      if (gcalRes.ok) {
        const gcalData = await gcalRes.json();
        setGcalStatus(gcalData);
      }
    } catch (error) {
      console.error("Failed to load integrations status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGCal = () => {
    window.location.href = "/api/integrations/google-calendar/auth";
  };

  const handleDisconnectGCal = async () => {
    try {
      setDisconnecting(true);
      const res = await fetch("/api/integrations/google-calendar/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        toast({ title: "Google Calendar Disconnected" });
        setGcalStatus({ connected: false });
      } else {
        toast({ title: "Error", description: "Failed to disconnect Google Calendar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your profile, clinic configuration, and integrations</p>
      </div>

      <SettingsTabs />

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-4xl">
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-6 mt-0">
          Connected Applications
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. WhatsApp Business */}
            <div className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  {waStatus === "Connected" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      Not Connected
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900">WhatsApp Business</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Send automated appointment reminders, instant feedback requests, and converse with patients in real-time.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                <a
                  href="/settings/whatsapp"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
                >
                  Manage Connection <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 2. Google Calendar */}
            <div className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                  {gcalStatus.connected ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      Not Connected
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900">Google Calendar</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Automatically sync your patient appointments to your personal or clinic Google Calendar in real-time.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                {gcalStatus.connected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectGCal}
                    disabled={disconnecting}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Disconnect Calendar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectGCal}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 transition-all"
                  >
                    Connect Google Calendar <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
