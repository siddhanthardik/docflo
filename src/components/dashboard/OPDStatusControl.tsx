"use client";

import { useState, useEffect } from "react";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle, 
  ChevronDown, 
  Sparkles, 
  Activity,
  Send
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  const [customReason, setCustomReason] = useState<string>("");

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
          reason: customReason,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast({
          title: "Schedule Updated",
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

  if (loading || !data?.doctor) {
    return null;
  }

  const { doctor, todayTotalCount, todayAiCount } = data;
  const opdStatus = doctor.opdStatus || "ACTIVE";
  const delayMinutes = doctor.opdDelayMinutes || 0;
  const maxAiBookings = doctor.maxDailyAiBookings ?? "Unlimited";

  return (
    <>
      {/* ── Top Header Pill Button ────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs active:scale-95 ${
          opdStatus === "ACTIVE"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            : opdStatus === "RUNNING_LATE"
            ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse"
            : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            opdStatus === "ACTIVE"
              ? "bg-emerald-500"
              : opdStatus === "RUNNING_LATE"
              ? "bg-amber-500"
              : "bg-rose-500"
          }`}
        />
        <span>
          {opdStatus === "ACTIVE"
            ? "OPD Active"
            : opdStatus === "RUNNING_LATE"
            ? `Delayed (+${delayMinutes}m)`
            : opdStatus === "PAUSED"
            ? "OPD Paused"
            : "OPD Cancelled"}
        </span>
        <span className="text-[10px] opacity-60 font-medium hidden sm:inline">
          (AI Quota: {todayAiCount}/{maxAiBookings})
        </span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* ── Emergency OPD Schedule Modal ────────────────────────────────── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Live OPD Schedule Controls
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Instantly adjust today&apos;s OPD schedule or manage emergency delays.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Quick Status Overview */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Today&apos;s Booked Patients:</span>{" "}
                <strong className="text-slate-900 font-bold">{todayTotalCount} patients</strong>
              </div>
              <div>
                <span className="text-slate-500">AI Bookings:</span>{" "}
                <strong className="text-blue-600 font-bold">{todayAiCount} / {maxAiBookings}</strong>
              </div>
            </div>

            {/* Delay Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                ⚡ Running Late? Shift Today&apos;s Slots
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDelay(mins)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      selectedDelay === mins
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    +{mins} mins
                  </button>
                ))}
              </div>
            </div>

            {/* WhatsApp Notification Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="space-y-0.5">
                <Label htmlFor="notify-switch" className="text-xs font-bold text-slate-900">
                  Notify Booked Patients on WhatsApp
                </Label>
                <p className="text-[11px] text-slate-500">
                  Sends polite delay update message to affected patients.
                </p>
              </div>
              <Switch
                id="notify-switch"
                checked={notifyPatients}
                onCheckedChange={setNotifyPatients}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleAction("DELAY")}
                disabled={updating}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                {updating ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Clock className="w-4 h-4" /> Apply {selectedDelay}-Min Delay to Today&apos;s OPD
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAction("PAUSE_TODAY")}
                  disabled={updating}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Pause New AI Bookings
                </button>

                <button
                  type="button"
                  onClick={() => handleAction("CANCEL_TODAY")}
                  disabled={updating}
                  className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all"
                >
                  Emergency Cancel Today
                </button>
              </div>

              {opdStatus !== "ACTIVE" && (
                <button
                  type="button"
                  onClick={() => handleAction("RESUME")}
                  disabled={updating}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  <PlayCircle className="w-4 h-4" /> Resume Normal OPD Schedule
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
