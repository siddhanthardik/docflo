"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle2, PowerOff, FlaskConical, Trash2, Plus, Building2, Phone, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { SettingsTabs } from "@/components/settings/settings-tabs";

interface DiagnosticPartner {
  id: string;
  name: string;
  phone: string;
  createdAt?: string;
}

export default function WhatsAppSettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [whatsappLoading, setWhatsappLoading] = useState(true);
  const [waStatus, setWaStatus] = useState<"CONNECTING" | "SCAN_QR" | "CONNECTED" | "DISCONNECTED">("DISCONNECTED");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);
  const [connectingElapsed, setConnectingElapsed] = useState(0);

  // Diagnostic Lab Whitelist State
  const [partners, setPartners] = useState<DiagnosticPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [submittingPartner, setSubmittingPartner] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerPhone, setNewPartnerPhone] = useState("");
  const [deletingPartnerId, setDeletingPartnerId] = useState<string | null>(null);

  useEffect(() => {
    const role = (session?.user as any)?.role;
    if (role && ["RECEPTIONIST", "STAFF", "NURSE"].includes(role)) {
      router.replace("/settings");
      return;
    }
    // Initial fetch triggers connect if not already connected
    fetchWhatsAppConfig(true);
  }, [session, router]);

  // Track elapsed time when in CONNECTING state
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (waStatus === "CONNECTING") {
      timer = setInterval(() => {
        setConnectingElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setConnectingElapsed(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [waStatus]);

  const fetchWhatsAppConfig = async (initiateIfDisconnected: boolean = false) => {
    try {
      const url = initiateIfDisconnected ? "/api/whatsapp/qr?action=connect" : "/api/whatsapp/qr";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setWaStatus(data.status);
        setRetryCount(data.retryCount || 0);
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

  // Poll status non-destructively: every 5s during setup/connecting, slow down to 25s when connected
  useEffect(() => {
    const pollInterval = waStatus === "CONNECTED" ? 25000 : 4000;
    const interval = setInterval(() => {
      fetchWhatsAppConfig(false);
    }, pollInterval);
    return () => clearInterval(interval);
  }, [waStatus]);

  const handleInitiateConnect = async () => {
    try {
      setWhatsappLoading(true);
      await fetch("/api/whatsapp/qr", { method: "POST" });
      fetchWhatsAppConfig(false);
    } catch (err) {
      console.error("Connect trigger error:", err);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp?")) return;
    try {
      setWhatsappLoading(true);
      await fetch("/api/whatsapp/qr", { method: "DELETE" });
      setWaStatus("DISCONNECTED");
      setQrCodeDataUrl(null);
      toast({ title: "WhatsApp Disconnected" });
      fetchWhatsAppConfig(false);
    } catch (error) {
      console.error(error);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      setLoadingPartners(true);
      const res = await fetch("/api/whatsapp/partners");
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      }
    } catch (err) {
      console.error("Failed to load diagnostic partners", err);
    } finally {
      setLoadingPartners(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) {
      toast({ title: "Name required", description: "Please enter the laboratory or diagnostic partner name", variant: "destructive" });
      return;
    }
    const digits = newPartnerPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast({ title: "Invalid phone", description: "Please enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }

    try {
      setSubmittingPartner(true);
      const res = await fetch("/api/whatsapp/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPartnerName.trim(), phone: newPartnerPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setPartners(data.partners || []);
        setNewPartnerName("");
        setNewPartnerPhone("");
        toast({ title: "Partner Whitelisted", description: `${newPartnerName.trim()} has been added to the silent zero-token whitelist.` });
      } else {
        toast({ title: "Error", description: data.error || "Failed to add partner", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add partner", variant: "destructive" });
    } finally {
      setSubmittingPartner(false);
    }
  };

  const handleDeletePartner = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the diagnostic whitelist?`)) return;
    try {
      setDeletingPartnerId(id);
      const res = await fetch(`/api/whatsapp/partners?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setPartners(data.partners || []);
        toast({ title: "Partner Removed", description: `${name} has been removed from the whitelist.` });
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete partner", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete partner", variant: "destructive" });
    } finally {
      setDeletingPartnerId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your profile, clinic configuration, and integrations</p>
      </div>

      <SettingsTabs />

      <div className="max-w-4xl space-y-6">
        {/* WhatsApp Integration Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
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
              ) : waStatus === "CONNECTING" && !qrCodeDataUrl ? (
                <div className="flex flex-col items-center gap-4 text-center py-6">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">
                    {connectingElapsed > 15 ? "Reconnection Taking Longer..." : "Auto-Connecting to WhatsApp..."}
                  </h4>
                  <p className="text-sm text-gray-500 max-w-md">
                    {connectingElapsed > 15
                      ? "Your phone may be offline or the session has expired. You can generate a fresh QR code right now to link your WhatsApp."
                      : "Restoring your previously linked WhatsApp Business account automatically. Please wait a moment..."}
                  </p>

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={handleDisconnectWhatsApp}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <PowerOff className="h-3.5 w-3.5" /> Unlink & Generate New QR
                    </button>
                  </div>
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

                    {!qrCodeDataUrl && waStatus === "DISCONNECTED" && (
                      <div className="mt-4">
                        <button
                          onClick={handleInitiateConnect}
                          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                        >
                          Generate QR Code / Reconnect
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Diagnostic Lab & Scan Center Whitelist Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    Diagnostic Lab & Partner Whitelist
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Zero-Token Silence
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pathology labs, imaging centers, and diagnostic partner numbers registered here will be completely silenced. The AI Receptionist will never consume tokens or send automated replies to them.
                </p>
              </div>
            </div>
          </div>

          {/* Form to Add Partner */}
          <form onSubmit={handleAddPartner} className="mt-5 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-teal-600" /> Add Diagnostic Partner / Lab
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Lab or Partner Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    placeholder="e.g. Lal PathLabs / Thyrocare"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  WhatsApp / Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={newPartnerPhone}
                    onChange={(e) => setNewPartnerPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={submittingPartner}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm h-[38px]"
                >
                  {submittingPartner ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Add
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              All incoming PDF reports, messages, and dispatch updates from this number will be archived silently without triggering the AI assistant.
            </p>
          </form>

          {/* List of Whitelisted Partners */}
          <div className="mt-5">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Whitelisted Partners ({partners.length})
            </h4>

            {loadingPartners ? (
              <div className="flex items-center justify-center py-6 text-gray-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-teal-600" />
                Loading whitelist...
              </div>
            ) : partners.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <FlaskConical className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-600">No diagnostic partners whitelisted yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5 max-w-sm mx-auto">
                  Add numbers belonging to pathology centers, scan centers, or hospital partner dispatch systems above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-gray-50/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100/80 flex items-center justify-center text-teal-700">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{partner.name}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                            Silenced (0 Tokens)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" /> {partner.phone}
                          </span>
                          {partner.createdAt && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-gray-400">
                                Added {new Date(partner.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePartner(partner.id, partner.name)}
                      disabled={deletingPartnerId === partner.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      title="Remove from whitelist"
                    >
                      {deletingPartnerId === partner.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
