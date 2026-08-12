"use client";

import { useState, useEffect } from "react";
import { MessageSquare, PhoneCall, QrCode, Save, CheckCircle2, RefreshCcw, ShieldCheck } from "lucide-react";
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
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState("LOADING");

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

  const fetchQR = async () => {
    try {
      setQrStatus("LOADING");
      const res = await fetch("/api/whatsapp/qr?doctorId=PLATFORM_SUPERADMIN");
      if (res.ok) {
        const data = await res.json();
        if (data.status === "SCAN_QR" && data.qr) {
          setQrCode(data.qr);
          setQrStatus("SCAN_QR");
        } else if (data.status === "CONNECTED") {
          setQrStatus("CONNECTED");
          setQrCode(null);
        } else {
          setQrStatus("DISCONNECTED");
          setQrCode(null);
        }
      }
    } catch (e) {
      setQrStatus("ERROR");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
    setQrOpen(true);
    fetchQR();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              SuperAdmin Platform WhatsApp Connection
            </h3>
            <p className="text-xs text-gray-500">
              Configure the WhatsApp number used for lead audit dispatches & WhatsApp lead communications.
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenQR}
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs shrink-0"
        >
          <QrCode className="h-4 w-4 mr-2" /> Pair WhatsApp QR Code
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
        <div className="sm:col-span-8 space-y-1.5">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-gray-400" />
            Platform WhatsApp Number (with Country Code e.g. 919876543210)
          </label>
          <Input
            type="text"
            placeholder="919876543210"
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
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            {saving ? (
              <><RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save WhatsApp Number</>
            )}
          </Button>
        </div>
      </form>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="leading-relaxed">
          Leads submitted on <strong>gyrex.in/audit</strong> will automatically receive audit dispatches and launch WhatsApp chats using this configured number.
        </p>
      </div>

      {/* Baileys QR Scan Modal Dialog */}
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
                <p className="text-xs text-gray-500 font-medium">Generating WhatsApp Web QR Code...</p>
              </div>
            )}

            {qrStatus === "SCAN_QR" && qrCode && (
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-md text-center space-y-3">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 mx-auto" />
                <p className="text-xs font-bold text-gray-700">Open WhatsApp → Settings → Linked Devices → Link a Device</p>
              </div>
            )}

            {qrStatus === "CONNECTED" && (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2 w-full">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">Platform WhatsApp Connected!</h4>
                <p className="text-xs text-emerald-700">Your official WhatsApp account is paired and active.</p>
              </div>
            )}

            {qrStatus === "DISCONNECTED" && (
              <div className="text-center space-y-3">
                <p className="text-xs text-gray-500">Session initialization in progress...</p>
                <Button onClick={fetchQR} variant="outline" size="sm" className="text-xs">
                  <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Refresh QR Code
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
