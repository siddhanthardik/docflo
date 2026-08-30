"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Clock, 
  AlertCircle, 
  PlayCircle, 
  ChevronDown, 
  Activity,
  PauseCircle,
  ShieldAlert,
  CheckCircle2,
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
  const [showAdjustDelay, setShowAdjustDelay] = useState<boolean>(false);
  const [confirmingAction, setConfirmingAction] = useState<"PAUSE" | "CANCEL" | "DELAY" | null>(null);

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
        setShowAdjustDelay(false);
        setConfirmingAction(null);
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
      {/* ── Top Header Pill Button ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => {
          setShowAdjustDelay(false);
          setConfirmingAction(null);
          setIsOpen(true);
        }}
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

      {/* ── Main Dialog ─────────────────────────────────────────────────── */}
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setConfirmingAction(null);
        }}
      >
        <DialogContent className="sm:max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl p-5 font-sans border-slate-200 bg-white shadow-xl">
          
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── CONFIRMATION MODAL: APPLY DELAY ───────────────────────────── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {confirmingAction === "DELAY" && (
            <div className="space-y-4 py-1">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Apply {selectedDelay}-Minute Delay to OPD?
                  </DialogTitle>
                  <p className="text-xs text-slate-500">Confirm schedule shift and patient updates</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-950 space-y-2 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <Info className="w-4 h-4 text-indigo-600" />
                  What happens when delayed:
                </p>
                <ul className="list-disc pl-4 space-y-1.5 text-indigo-900/90 text-[11px]">
                  <li>Today&apos;s upcoming appointments will shift forward by <strong>{selectedDelay} minutes</strong>.</li>
                  <li>Next consultation is estimated to begin at ~<strong>{previewStartTime}</strong>.</li>
                  <li>New inquiries on WhatsApp will automatically receive slots aligned with this delayed timing.</li>
                </ul>
              </div>

              {/* WhatsApp Notification Toggle */}
              {todayTotalCount > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="space-y-0.5">
                    <Label htmlFor="delay-notify-switch" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      Notify {todayTotalCount} patient(s) on WhatsApp
                    </Label>
                    <p className="text-[10px] text-slate-400">
                      Sends polite delay update message to affected patients.
                    </p>
                  </div>
                  <Switch
                    id="delay-notify-switch"
                    checked={notifyPatients}
                    onCheckedChange={setNotifyPatients}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingAction(null)}
                  disabled={updating}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("DELAY")}
                  disabled={updating}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  {updating ? <Activity className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                  Confirm {selectedDelay}m Delay
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── CONFIRMATION MODAL: PAUSE NEW BOOKINGS ────────────────────── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {confirmingAction === "PAUSE" && (
            <div className="space-y-4 py-1">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Pause New WhatsApp Bookings?
                  </DialogTitle>
                  <p className="text-xs text-slate-500">Confirm temporary booking pause for today</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-2 leading-relaxed">
                <p>
                  <strong>What happens when paused:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1 text-amber-800 text-[11px]">
                  <li>New patient booking requests on WhatsApp will be paused for today.</li>
                  <li>Inquiring patients will be guided to tomorrow&apos;s slots or direct clinic walk-in tokens.</li>
                  <li><strong>Existing booked appointments ({todayTotalCount}) remain untouched and valid.</strong></li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingAction(null)}
                  disabled={updating}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel (Keep Active)
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("PAUSE_TODAY")}
                  disabled={updating}
                  className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  {updating ? <Activity className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                  Confirm Pause
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── CONFIRMATION MODAL: EMERGENCY CANCEL OPD ──────────────────── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {confirmingAction === "CANCEL" && (
            <div className="space-y-4 py-1">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Emergency Cancel Today&apos;s OPD?
                  </DialogTitle>
                  <p className="text-xs text-slate-500">Immediate schedule disruption alert</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 space-y-2 leading-relaxed">
                <p className="font-bold text-rose-950">
                  ⚠️ This will cancel all {todayTotalCount} scheduled consultation(s) for today.
                </p>
                <p className="text-rose-800 text-[11px]">
                  All appointments will be marked as Cancelled in Docflo and new WhatsApp bookings will be stopped for today.
                </p>
              </div>

              {/* WhatsApp notification toggle */}
              {todayTotalCount > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="space-y-0.5">
                    <Label htmlFor="cancel-notify-switch" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      Notify {todayTotalCount} patient(s) on WhatsApp
                    </Label>
                    <p className="text-[10px] text-slate-400">
                      Sends polite apology notice & reschedule instructions.
                    </p>
                  </div>
                  <Switch
                    id="cancel-notify-switch"
                    checked={notifyPatients}
                    onCheckedChange={setNotifyPatients}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingAction(null)}
                  disabled={updating}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("CANCEL_TODAY")}
                  disabled={updating}
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  {updating ? <Activity className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                  Yes, Cancel OPD
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── STANDARD CONTROL VIEW (WHEN NOT CONFIRMING) ───────────────── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {!confirmingAction && (
            <>
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

                {/* ── STATE: PAUSED ── */}
                {opdStatus === "PAUSED" && (
                  <div className="space-y-3.5 pt-1">
                    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <PauseCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Online WhatsApp Bookings are Paused for Today</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed pl-6">
                        Existing appointments remain intact. Inquiring patients on WhatsApp are politely guided to tomorrow&apos;s slots or direct walk-in tokens.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAction("RESUME")}
                      disabled={updating}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
                    >
                      {updating ? <Activity className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                      Resume Online Bookings (Normal Schedule)
                    </button>

                    <div className="pt-2 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => setConfirmingAction("CANCEL")}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Emergency Cancel All Today&apos;s Appointments
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STATE: CANCELLED ── */}
                {opdStatus === "CANCELLED" && (
                  <div className="space-y-3.5 pt-1">
                    <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-rose-900">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Today&apos;s OPD is Marked as Emergency Cancelled</span>
                      </div>
                      <p className="text-[11px] text-rose-800 leading-relaxed pl-6">
                        All today&apos;s appointments are cancelled and new bookings are stopped.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAction("RESUME")}
                      disabled={updating}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
                    >
                      {updating ? <Activity className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                      Reopen & Resume Normal OPD Schedule
                    </button>
                  </div>
                )}

                {/* ── STATE: RUNNING LATE ── */}
                {opdStatus === "RUNNING_LATE" && (
                  <div className="space-y-3.5 pt-1">
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>OPD is currently Delayed by +{currentDelay} Minutes</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed pl-6">
                        Appointments for today were shifted forward by {currentDelay} minutes.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAction("RESUME")}
                      disabled={updating}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
                    >
                      {updating ? <Activity className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Reset Delay & Resume Normal Schedule
                    </button>

                    {!showAdjustDelay ? (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setShowAdjustDelay(true)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          ✏️ Change Delay Duration
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingAction("CANCEL")}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                        >
                          Emergency Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Adjust Delay Time:</span>
                          <button
                            type="button"
                            onClick={() => setShowAdjustDelay(false)}
                            className="text-[10px] text-slate-400 hover:text-slate-600"
                          >
                            Cancel
                          </button>
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

                        <button
                          type="button"
                          onClick={() => setConfirmingAction("DELAY")}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                        >
                          Review & Apply {selectedDelay}-Min Delay
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STATE: ACTIVE ── */}
                {opdStatus === "ACTIVE" && (
                  <div className="space-y-4">
                    {/* Delay Selector */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Running Late? Shift Slots</span>
                        <span className="text-[11px] text-slate-400">Select delay:</span>
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

                    {/* Primary Action Button (Triggers Confirmation) */}
                    <button
                      type="button"
                      onClick={() => setConfirmingAction("DELAY")}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Clock className="w-4 h-4" /> Apply {selectedDelay}-Min Delay
                    </button>

                    {/* Emergency Controls (Opens Confirmation Dialog) */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmingAction("PAUSE")}
                          disabled={updating}
                          className="py-2 px-2 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-[11px] rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1 active:scale-98"
                        >
                          <PauseCircle className="w-3.5 h-3.5 text-slate-400" />
                          Pause New Bookings
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmingAction("CANCEL")}
                          disabled={updating}
                          className="py-2 px-2 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-[11px] rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1 active:scale-98"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          Emergency Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
