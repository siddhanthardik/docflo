"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Clock, 
  AlertCircle, 
  PlayCircle, 
  ChevronDown, 
  Activity,
  PauseCircle,
  ShieldAlert
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
          title: action === "RESUME" ? "Schedule Restored" : "Schedule Updated",
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
      {/* ── Top Header Pill Button (Clean, Native System Design) ────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-2xs hover:shadow-xs active:scale-95 ${
          opdStatus === "ACTIVE"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80"
            : opdStatus === "RUNNING_LATE"
            ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/80"
            : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/80"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            opdStatus === "ACTIVE"
              ? "bg-emerald-500"
              : opdStatus === "RUNNING_LATE"
              ? "bg-amber-500 animate-pulse"
              : "bg-rose-500"
          }`}
        />

        <span className="font-bold">
          {opdStatus === "ACTIVE"
            ? "OPD Active"
            : opdStatus === "RUNNING_LATE"
            ? `Delayed (+${currentDelay}m)`
            : opdStatus === "PAUSED"
            ? "OPD Paused"
            : "OPD Cancelled"}
        </span>

        <span className="text-[11px] text-slate-400 font-normal hidden md:inline">
          • AI: {todayAiCount}/{maxAiBookings}
        </span>

        <ChevronDown className="w-3 h-3 text-slate-400 -ml-0.5" />
      </button>

      {/* ── Mobile-First Light Dialog (Fits 100% On Screen) ──────────────── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl p-5 font-sans border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <DialogHeader className="space-y-1 pb-3 border-b border-slate-100 text-left">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                opdStatus === "ACTIVE" ? "bg-emerald-500" : opdStatus === "RUNNING_LATE" ? "bg-amber-500" : "bg-rose-500"
              }`} />
              <DialogTitle className="text-base font-bold text-slate-900">
                Live OPD Schedule
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Manage today&apos;s OPD hours, delays, and online booking limits.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Quick Stats Strip */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="text-slate-400 font-medium">Today&apos;s OPD:</span>
                <strong className="text-slate-900 font-bold">{todayTotalCount} Booked</strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="text-slate-400 font-medium">AI Quota:</span>
                <strong className="text-indigo-600 font-bold">{todayAiCount} / {maxAiBookings}</strong>
              </div>
            </div>

            {/* Non-Active State (Resume Action) */}
            {opdStatus !== "ACTIVE" && (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">
                      {opdStatus === "RUNNING_LATE"
                        ? `OPD is currently running ${currentDelay} minutes late.`
                        : opdStatus === "PAUSED"
                        ? "New online WhatsApp bookings are paused for today."
                        : "Today's OPD is marked as emergency cancelled."}
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      {doctor.opdStatusNote || "Inquiring patients will be guided accordingly."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAction("RESUME")}
                  disabled={updating}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <PlayCircle className="w-4 h-4" /> Resume Normal Schedule
                </button>
              </div>
            )}

            {/* Delay Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Running Late? Shift Slots</span>
                <span className="text-[11px] text-slate-400">Select delay time:</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDelay(mins)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      selectedDelay === mins
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    +{mins}m
                  </button>
                ))}
              </div>

              {/* Dynamic 1-Line Preview */}
              <p className="text-[11px] text-slate-500 bg-indigo-50/60 border border-indigo-100/80 p-2.5 rounded-xl leading-relaxed">
                Shifts today&apos;s slots by <strong>{selectedDelay} mins</strong> (next slot starts ~<strong>{previewStartTime}</strong>).
                {notifyPatients && todayTotalCount > 0 && (
                  <span className="block mt-0.5 text-indigo-700 font-semibold">
                    • <strong>{todayTotalCount} booked patient(s)</strong> will receive a polite WhatsApp delay notice.
                  </span>
                )}
              </p>
            </div>

            {/* WhatsApp Notification Switch */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="space-y-0.5">
                <Label htmlFor="notify-switch" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Notify Patients on WhatsApp
                </Label>
                <p className="text-[10px] text-slate-400">
                  Sends courteous delay message to affected patients.
                </p>
              </div>
              <Switch
                id="notify-switch"
                checked={notifyPatients}
                onCheckedChange={setNotifyPatients}
              />
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleAction("DELAY")}
              disabled={updating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
            >
              {updating ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Clock className="w-4 h-4" /> Apply {selectedDelay}-Min Delay
                </>
              )}
            </button>

            {/* Emergency Controls (Subtle & Compact) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAction("PAUSE_TODAY")}
                  disabled={updating}
                  className="py-2 px-2 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-[11px] rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1"
                >
                  <PauseCircle className="w-3.5 h-3.5 text-slate-400" />
                  Pause New Bookings
                </button>

                <button
                  type="button"
                  onClick={() => handleAction("CANCEL_TODAY")}
                  disabled={updating}
                  className="py-2 px-2 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-[11px] rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
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
