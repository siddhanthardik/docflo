"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, PowerOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function WhatsAppSettingsPage() {
  const [whatsappLoading, setWhatsappLoading] = useState(true);
  const [waStatus, setWaStatus] = useState<"CONNECTING" | "SCAN_QR" | "CONNECTED" | "DISCONNECTED">("DISCONNECTED");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchWhatsAppConfig();
  }, []);

  const fetchWhatsAppConfig = async () => {
    try {
      setWhatsappLoading(true);
      const response = await fetch("/api/whatsapp/qr");
      if (response.ok) {
        const data = await response.json();
        setWaStatus(data.status);
        if (data.status === "SCAN_QR" && data.qr) {
          setQrCodeDataUrl(data.qr);
        } else {
          setQrCodeDataUrl(null);
        }
      }
    } catch (error) {
      console.error("Error fetching WhatsApp status:", error);
    } finally {
      setWhatsappLoading(false);
    }
  };

  // Poll for QR status if it's CONNECTING or SCAN_QR
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (waStatus === "CONNECTING" || waStatus === "SCAN_QR") {
      interval = setInterval(() => {
        fetchWhatsAppConfig();
      }, 5000); // Check every 5s
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [waStatus]);

  const handleDisconnectWhatsApp = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp?")) return;
    try {
      setWhatsappLoading(true);
      await fetch("/api/whatsapp/qr", { method: "DELETE" });
      setWaStatus("DISCONNECTED");
      setQrCodeDataUrl(null);
      toast({ title: "WhatsApp Disconnected" });
      fetchWhatsAppConfig();
    } catch (error) {
      console.error(error);
    } finally {
      setWhatsappLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your profile, clinic configuration, and integrations</p>
      </div>

      <SettingsTabs />

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-4xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 w-full mt-0">
            WhatsApp Integration
          </h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">Connect your WhatsApp Business account easily by scanning the QR Code below.</p>

        {whatsappLoading && !qrCodeDataUrl ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-500">Checking connection status...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8">
            {waStatus === "CONNECTED" ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900">WhatsApp is Connected!</h4>
                <p className="text-sm text-gray-500 max-w-md">Your WhatsApp Business account is successfully linked. AI Agents and automated replies are now active.</p>
                
                <button
                  onClick={handleDisconnectWhatsApp}
                  className="mt-6 flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  <PowerOff className="h-4 w-4" /> Disconnect WhatsApp
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="WhatsApp QR Code" className="w-64 h-64 border-4 border-white rounded-xl shadow-sm" />
                  ) : (
                    <div className="w-64 h-64 flex flex-col items-center justify-center border-4 border-dashed border-gray-200 rounded-xl bg-gray-100/50">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                      <span className="text-sm text-gray-500">Generating secure QR code...</span>
                    </div>
                  )}
                </div>
                
                <div className="max-w-md">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Link your device</h4>
                  <ol className="text-sm text-gray-600 space-y-2 text-left bg-indigo-50/50 p-4 rounded-lg border border-indigo-100/50">
                    <li>1. Open <strong>WhatsApp</strong> on your phone</li>
                    <li>2. Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong></li>
                    <li>3. Tap <strong>Link a Device</strong></li>
                    <li>4. Point your phone to this screen to capture the QR code</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
