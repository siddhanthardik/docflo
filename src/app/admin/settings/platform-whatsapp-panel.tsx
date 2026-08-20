"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  PhoneCall,
  QrCode,
  Save,
  CheckCircle2,
  RefreshCcw,
  ShieldCheck,
  PowerOff,
  Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function PlatformWhatsAppPanel() {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  // QR Modal & Live Connection State
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<"LOADING" | "SCAN_QR" | "CONNECTED" | "DISCONNECTED" | "ERROR">("LOADING");
  const [connectionStatus, setConnectionStatus] = useState<"CONNECTED" | "DISCONNECTED" | "CHECKING">("CHECKING");

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Settings & Check Current Connection Status
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings/whatsapp");
      if (res.ok) {
        const data = await res.json();
        setWhatsappNumber(data.whatsappNumber || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkLiveConnection = async () => {
    try {
      const res = await fetch("/api/admin/settings/whatsapp/qr");
      if (res.ok) {
        const data = await res.json();
        if (data.status === "CONNECTED") {
          setConnectionStatus("CONNECTED");
          setQrStatus("CONNECTED");
          setQrCode(null);
        } else if (data.status === "SCAN_QR" && data.qr) {
          setConnectionStatus("DISCONNECTED");
          setQrCode(data.qr);
          setQrStatus("SCAN_QR");
        } else {
          setConnectionStatus("DISCONNECTED");
          setQrStatus("DISCONNECTED");
          setQrCode(null);
        }
      }
    } catch (e) {
      setConnectionStatus("DISCONNECTED");
      setQrStatus("ERROR");
    }
  };

  useEffect(() => {
    fetchSettings();
    checkLiveConnection();
  }, []);

  // Polling loop while QR modal is open
  useEffect(() => {
    if (qrOpen) {
      checkLiveConnection();
      pollTimerRef.current = setInterval(() => {
        checkLiveConnection();
      }, 2000);
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [qrOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber) {
      toast.error("Please enter a WhatsApp number.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber }),
      });
      if (!res.ok) throw new Error("Failed to save WhatsApp number.");
      toast.success("Platform WhatsApp number updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenQR = () => {
    setQrStatus("LOADING");
    setQrOpen(true);
    checkLiveConnection();
  };

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to disconnect SuperAdmin Platform WhatsApp?")) return;
    setUnlinking(true);
    try {
      const res = await fetch("/api/admin/settings/whatsapp/qr", {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("SuperAdmin WhatsApp unlinked successfully.");
        setConnectionStatus("DISCONNECTED");
        setQrStatus("DISCONNECTED");
        setQrCode(null);
      } else {
        throw new Error("Failed to unlink.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to unlink WhatsApp.");
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-gray-900">
                SuperAdmin Platform WhatsApp Connection
              </h3>

              {/* Live Connection Status Badge */}
              {connectionStatus === "CONNECTED" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active & Connected
                </span>
              )}

              {connectionStatus === "DISCONNECTED" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Not Paired
                </span>
              )}

              {connectionStatus === "CHECKING" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                  <RefreshCcw className="w-2.5 h-2.5 animate-spin" /> Checking
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure the official WhatsApp number for automated 60s GBP audits, lead generation, sales, and support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {connectionStatus === "CONNECTED" && (
            <Button
              onClick={handleUnlink}
              disabled={unlinking}
              variant="outline"
              size="sm"
              className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs"
            >
              {unlinking ? (
                <><RefreshCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Unlinking...</>
              ) : (
                <><PowerOff className="h-3.5 w-3.5 mr-1.5" /> Disconnect</>
              )}
            </Button>
          )}

          <Button
            onClick={handleOpenQR}
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {connectionStatus === "CONNECTED" ? "Re-pair WhatsApp QR" : "Pair WhatsApp QR Code"}
          </Button>
        </div>
      </div>

      {/* Number Configuration Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
        <div className="sm:col-span-8 space-y-1.5">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-gray-400" />
            Platform WhatsApp Number (with Country Code e.g. 919717228528)
          </label>
          <Input
            type="text"
            placeholder="919717228528"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            disabled={loading}
            className="font-mono text-xs font-bold"
          />
        </div>

        <div className="sm:col-span-4">
          <Button
            type="submit"
            disabled={saving || loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
          >
            {saving ? (
              <><RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save WhatsApp Number</>
            )}
          </Button>
        </div>
      </form>

      {/* Feature Notification Callout */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Platform WhatsApp Concierge Features:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
          <li><strong>Automated 60-Second GBP Audits:</strong> Users sending clinic names will receive instant Google ranking & review analysis with full diagnostic report links.</li>
          <li><strong>Super Admin Lead Ingestion:</strong> All WhatsApp audit requests and inquiries are automatically logged in <strong>Leads (`/admin/leads`)</strong> with their reports.</li>
          <li><strong>Interactive Menu:</strong> Sending <em>&quot;Hi&quot;</em> delivers choices for 1️⃣ Free Audit, 2️⃣ Sales Demo, 3️⃣ Support Desk, and 4️⃣ Audit Status.</li>
        </ul>
      </div>

      {/* Baileys QR Scan Modal Dialog with Live Polling */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-600" /> Pair Platform WhatsApp Business
            </DialogTitle>
            <DialogDescription className="text-xs">
              Scan this QR code using WhatsApp on your phone (Linked Devices) to pair the official platform account.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            {qrStatus === "LOADING" && (
              <div className="flex flex-col items-center justify-center space-y-2 py-8">
                <RefreshCcw className="h-8 w-8 text-emerald-600 animate-spin" />
                <p className="text-xs text-gray-500 font-medium">Generating SuperAdmin WhatsApp Web QR Code...</p>
              </div>
            )}

            {qrStatus === "SCAN_QR" && qrCode && (
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-md text-center space-y-3">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-800">
                    Open WhatsApp → Settings → Linked Devices → Link a Device
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center justify-center gap-1.5 animate-pulse">
                    <Radio className="w-3 h-3" /> Listening for phone connection...
                  </p>
                </div>
              </div>
            )}

            {qrStatus === "CONNECTED" && (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-3 w-full animate-in fade-in">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-900 text-sm">Platform WhatsApp Connected!</h4>
                  <p className="text-xs text-emerald-700">
                    Your official SuperAdmin WhatsApp account is active and ready to handle audits, leads, sales, and support.
                  </p>
                </div>
                <Button
                  onClick={() => setQrOpen(false)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Done
                </Button>
              </div>
            )}

            {qrStatus === "DISCONNECTED" && (
              <div className="text-center space-y-3 py-4">
                <p className="text-xs text-gray-500">Initializing connection session...</p>
                <Button onClick={checkLiveConnection} variant="outline" size="sm" className="text-xs">
                  <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Refresh QR Code
                </Button>
              </div>
            )}

            {qrStatus === "ERROR" && (
              <div className="text-center space-y-3 py-4">
                <p className="text-xs text-rose-500 font-semibold">Failed to load QR code. Please try again.</p>
                <Button onClick={checkLiveConnection} variant="outline" size="sm" className="text-xs">
                  <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Retry
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
