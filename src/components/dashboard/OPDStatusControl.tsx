"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle, 
  ChevronDown, 
  Sparkles, 
  Activity,
  Send,
  Calendar,
  Users,
  ShieldAlert,
  Info
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function OPDStatusControl() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);

  // Modal State
  const [selectedDelay, setSelectedDelay] = useState<number>(30);
  const [notifyPatients, setNotifyPatients] = useState<boolean>(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/doctor/opd-status");
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

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleAction = async (action: "RESUME" | "DELAY" | "PAUSE_TODAY" | "CANCEL_TODAY") => {
    try {
      setUpdating(true);
      const res = await fetch("/api/doctor/opd-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          delayMinutes: selectedDelay,
          notifyPatients,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast({
          title: action === "RESUME" ? "Schedule Restored! ✅" : "Schedule Updated",
          description: json.message,
        });
        setIsOpen(false);
        fetchStatus();
      } else {
        toast({
          title: "Error",
          description: json.error || "Could not update schedule",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const { doctor, todayTotalCount = 0, todayAiCount = 0, appointmentsToday = [] } = data || {};
  const opdStatus = doctor?.opdStatus || "ACTIVE";
  const currentDelay = doctor?.opdDelayMinutes || 0;
  const maxAiBookings = doctor?.maxDailyAiBookings ?? "Unlimited";

  // Earliest upcoming appointment time for preview
  const previewStartTime = useMemo(() => {
    const now = new Date();
    const futureApts = appointmentsToday.filter((a: any) => new Date(a.startTime) >= now);
    if (futureApts.length > 0) {
      const orig = new Date(futureApts[0].startTime);
      const shifted = new Date(orig.getTime() + selectedDelay * 60000);
      return shifted.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    }
    // Fallback based on typical evening session
    const sample = new Date();
    sample.setHours(17, 0, 0, 0);
    sample.setMinutes(sample.getMinutes() + selectedDelay);
    return sample.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }, [appointmentsToday, selectedDelay]);

  if (loading || !data?.doctor) {
    return null;
  }

  return (
    <>
      {/* ── Top Header Pill Button (Elevated Design) ────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs hover:shadow-sm active:scale-95 ${
          opdStatus === "ACTIVE"
            ? "bg-emerald-50/90 text-emerald-800 border-emerald-300/80 hover:bg-emerald-100"
            : opdStatus === "RUNNING_LATE"
            ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 ring-2 ring-amber-400/20"
            : "bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100"
        }`}
      >
        <span className="relative flex h-2 w-2">
          {opdStatus === "ACTIVE" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          {opdStatus === "RUNNING_LATE" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              opdStatus === "ACTIVE"
                ? "bg-emerald-600"
                : opdStatus === "RUNNING_LATE"
                ? "bg-amber-600"
                : "bg-rose-600"
            }`}
          />
        </span>

        <span className="tracking-tight font-extrabold">
          {opdStatus === "ACTIVE"
            ? "OPD Active"
            : opdStatus === "RUNNING_LATE"
            ? `Delayed (+${currentDelay}m)`
            : opdStatus === "PAUSED"
            ? "OPD Paused"
            : "OPD Cancelled"}
        </span>

        <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline pl-1 border-l border-slate-300/60">
          AI: {todayAiCount}/{maxAiBookings}
        </span>

        <ChevronDown className="w-3 h-3 text-slate-400 -ml-0.5" />
      </button>

      {/* ── Emergency OPD Schedule Modal (Premium Redesign) ────────────────── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden font-sans border-slate-200/90 shadow-2xl bg-white">
          {/* Header Banner */}
          <div className="p-6 bg-slate-900 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                  <Clock className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-white tracking-tight">
                    Live OPD Schedule Controls
                  </DialogTitle>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Real-time schedule management, delay adjustments & emergency controls.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Today&apos;s Bookings</p>
                <p className="text-base font-black text-white mt-0.5">{todayTotalCount} <span className="text-xs font-normal text-slate-300">Patients</span></p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">AI Receptionist Quota</p>
                <p className="text-base font-black text-indigo-300 mt-0.5">{todayAiCount} <span className="text-xs font-normal text-slate-300">/ {maxAiBookings}</span></p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* ── If Currently In a Non-Active State (Highlight Resume) ── */}
            {opdStatus !== "ACTIVE" && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-amber-900">
                      {opdStatus === "RUNNING_LATE"
                        ? `OPD is currently marked as Delayed (+${currentDelay} mins)`
                        : opdStatus === "PAUSED"
                        ? "New WhatsApp bookings are currently paused"
                        : "Today's OPD is marked as Emergency Cancelled"}
                    </h4>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      {doctor.opdStatusNote || "Incoming inquiries will be informed of this schedule update."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAction("RESUME")}
                  disabled={updating}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
                >
                  <PlayCircle className="w-4 h-4" /> Resume Normal OPD Schedule
                </button>
              </div>
            )}

            {/* ── Section 1: Running Late Controls ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>⚡ Running Late? Shift Today&apos;s Slots</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Select delay:</span>
              </div>

              {/* Delay Pill Grid */}
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDelay(mins)}
                    className={`py-2.5 text-xs font-bold rounded-2xl border transition-all duration-150 active:scale-95 ${
                      selectedDelay === mins
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    +{mins}m
                  </button>
                ))}
              </div>

              {/* Dynamic Live Impact Preview Box */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Live Schedule Preview</span>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed pl-6">
                  Today&apos;s consultations will shift forward by <strong>{selectedDelay} minutes</strong> (e.g. next slot starts ~<strong>{previewStartTime}</strong>).
                  {notifyPatients && todayTotalCount > 0 && (
                    <span className="block mt-0.5 text-indigo-900 font-semibold">
                      💬 <strong>{todayTotalCount} booked patient(s)</strong> will receive a courteous WhatsApp delay update.
                    </span>
                  )}
                </p>
              </div>

              {/* WhatsApp Notification Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5 pr-2">
                  <Label htmlFor="notify-switch" className="text-xs font-bold text-slate-900 cursor-pointer">
                    Notify Booked Patients on WhatsApp
                  </Label>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Dispatches personalized WhatsApp delay notifications.
                  </p>
                </div>
                <Switch
                  id="notify-switch"
                  checked={notifyPatients}
                  onCheckedChange={setNotifyPatients}
                />
              </div>

              {/* Apply Delay CTA */}
              <button
                type="button"
                onClick={() => handleAction("DELAY")}
                disabled={updating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md hover:shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-98"
              >
                {updating ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Clock className="w-4 h-4" /> Apply {selectedDelay}-Min Delay & Update Schedule
                  </>
                )}
              </button>
            </div>

            {/* ── Section 2: Emergency Controls ── */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Emergency & Capacity Controls
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAction("PAUSE_TODAY")}
                  disabled={updating}
                  className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all text-center leading-tight active:scale-98"
                >
                  <PauseCircle className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
                  Pause AI Bookings
                </button>

                <button
                  type="button"
                  onClick={() => handleAction("CANCEL_TODAY")}
                  disabled={updating}
                  className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 transition-all text-center leading-tight active:scale-98"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mx-auto mb-1 text-rose-600" />
                  Emergency Cancel
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
