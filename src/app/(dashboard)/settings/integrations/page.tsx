"use client";

import { useState, useEffect } from "react";
import { Loader2, MessageCircle, CheckCircle2, ArrowRight, XCircle, Store, AlertTriangle } from "lucide-react";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [waStatus, setWaStatus] = useState<string>("Not Connected");

  // GBP Profile Status
  const [gbpStatus, setGbpStatus] = useState<{ connected: boolean; locationName?: string | null }>({
    connected: false,
  });

  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectingGbp, setDisconnectingGbp] = useState(false);
  const [isGbpDisconnectModalOpen, setIsGbpDisconnectModalOpen] = useState(false);

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
        setWaStatus(waData.status === "CONNECTED" ? "Connected" : "Not Connected");
      }

      // 3. Google Business Profile status
      const gbpRes = await fetch("/api/gbp/status");
      if (gbpRes.ok) {
        const gbpData = await gbpRes.json();
        setGbpStatus({
          connected: !!gbpData.connected,
          locationName: gbpData.locationName || null,
        });
      }
    } catch (error) {
      console.error("Failed to load integrations status:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleConnectGBP = () => {
    window.location.href = "/api/gbp/connect";
  };

  const handleDisconnectGBP = async () => {
    try {
      setDisconnectingGbp(true);
      const res = await fetch("/api/gbp/disconnect", {
        method: "DELETE",
      });
      if (res.ok) {
        toast({
          title: "Google Business Profile Disconnected! 🧹",
          description: "Profile un-linked cleanly. You can now re-authenticate with fresh permissions.",
        });
        setGbpStatus({ connected: false });
        setIsGbpDisconnectModalOpen(false);
      } else {
        toast({ title: "Error", description: "Failed to disconnect GBP profile", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setDisconnectingGbp(false);
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
          Connected Applications & Profiles
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

            {/* 2. Google Business Profile */}
            <div className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Store className="h-6 w-6" />
                  </div>
                  {gbpStatus.connected ? (
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

                <h4 className="text-base font-bold text-slate-900">Google Business Profile</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {gbpStatus.connected
                    ? `Connected: ${gbpStatus.locationName || 'Clinic GBP Profile'}. Sync reviews, posts, and search keywords.`
                    : "Connect your official Google Business Profile to track local rankings, automate review replies, and post updates."}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                {gbpStatus.connected ? (
                  <button
                    type="button"
                    onClick={() => setIsGbpDisconnectModalOpen(true)}
                    disabled={disconnectingGbp}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Disconnect GBP Profile
                  </button>
                ) : (
                  <a
                    href="/gbp"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 inline-flex items-center gap-1.5 transition-all"
                  >
                    Go to GBP Profile Page <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>



          </div>
        )}
      </div>

      {/* Disconnect GBP Permission Confirmation Modal */}
      <Dialog open={isGbpDisconnectModalOpen} onOpenChange={setIsGbpDisconnectModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Confirm GBP Profile Disconnection
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 leading-relaxed">
              Disconnecting will un-link this Google Business Profile and reset stored snapshot cache. 
              <strong className="block text-slate-800 font-semibold mt-1">
                Please ensure you have explicit permission from the clinic owner before proceeding.
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-900">
            <p className="font-semibold mb-1">What happens when you disconnect?</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
              <li>Stored OAuth tokens and location connection will be cleared.</li>
              <li>You can immediately re-authenticate via Google OAuth to pick the latest location or updated permissions.</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGbpDisconnectModalOpen(false)}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={disconnectingGbp}
              onClick={handleDisconnectGBP}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5"
            >
              {disconnectingGbp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Confirm & Disconnect GBP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
