"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { User, MessageCircle, Globe, Key, Loader2, CheckCircle2, QrCode, PowerOff } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

const specialtiesList = [
  "General Medicine",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Neurology",
  "Psychiatry",
  "Oncology",
  "Gastroenterology",
  "Endocrinology",
  "Ophthalmology",
  "ENT (Otolaryngology)",
  "Urology",
  "Gynecology & Obstetrics",
  "Dentistry",
  "Other"
];

const getPhoneParts = (fullPhone: string) => {
  for (const c of COUNTRIES) {
    if (fullPhone.startsWith(c.dialCode)) {
      return { countryCode: c.code, dialCode: c.dialCode, number: fullPhone.slice(c.dialCode.length) };
    }
  }
  return { countryCode: "US", dialCode: "+1", number: fullPhone };
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [whatsappLoading, setWhatsappLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "clinic" | "whatsapp">("profile");

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    clinicName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // WhatsApp state
  const [waStatus, setWaStatus] = useState<"CONNECTING" | "SCAN_QR" | "CONNECTED" | "DISCONNECTED">("DISCONNECTED");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // Clinic settings
  const [clinicSettings, setClinicSettings] = useState({
    timezone: "UTC",
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
    daysOff: [] as string[],
  });

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Kolkata",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    fetchProfile();
    fetchWhatsAppConfig();
    fetchClinicSettings();
  }, []);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch("/api/settings/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile((prev) => ({ 
          ...prev, 
          ...data,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          specialty: data.specialty || "",
          clinicName: data.clinicName || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

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

  const handleDisconnectWhatsApp = async () => {
    try {
      setWhatsappLoading(true);
      await fetch("/api/whatsapp/qr", { method: "DELETE" });
      setWaStatus("DISCONNECTED");
      setQrCodeDataUrl(null);
      toast({ title: "WhatsApp Disconnected" });
    } catch (error) {
      console.error(error);
    } finally {
      setWhatsappLoading(false);
    }
  };

  // Poll for QR status if it's CONNECTING or SCAN_QR
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === "whatsapp" && (waStatus === "CONNECTING" || waStatus === "SCAN_QR")) {
      interval = setInterval(() => {
        fetchWhatsAppConfig();
      }, 5000); // Check every 5s
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [activeTab, waStatus]);

  const fetchClinicSettings = async () => {
    try {
      const res = await fetch("/api/settings/clinic");
      if (res.ok) {
        const data = await res.json();
        setClinicSettings({
          timezone: data.timezone || "UTC",
          workingHoursStart: data.workingHoursStart || "09:00",
          workingHoursEnd: data.workingHoursEnd || "17:00",
          daysOff: data.daysOff || [],
        });
      }
    } catch (error) {
      console.error("Error fetching clinic settings:", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          specialty: profile.specialty,
          clinicName: profile.clinicName,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          currentPassword: profile.currentPassword || undefined,
          newPassword: profile.newPassword || undefined,
        }),
      });
      if (response.ok) {
        toast({ title: "Success", description: "Profile updated successfully" });
        setProfile((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };



  const handleClinicSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicSettings),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Clinic settings updated" });
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to save clinic settings");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleDayOff = (day: string) => {
    setClinicSettings((prev) => {
      const newDays = prev.daysOff.includes(day)
        ? prev.daysOff.filter((d) => d !== day)
        : [...prev.daysOff, day];
      return { ...prev, daysOff: newDays };
    });
  };

  const tabs = [
    { key: "profile" as const, label: "Profile", icon: User },
    { key: "clinic" as const, label: "Clinic Settings", icon: Globe },
    { key: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
  ];

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your profile, clinic configuration, and integrations</p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-3xl">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
            Personal Information
          </h3>
          {profileLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Subscription Plan Overview */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900">Current Plan: <span className="uppercase font-bold tracking-wider">{profile.subscriptionPlan || "FREE"}</span></h4>
                  <p className="text-sm text-indigo-700 mt-1">Manage your subscription to unlock more keywords and features.</p>
                </div>
                <a 
                  href="/settings/billing" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap text-center"
                >
                  Manage Billing
                </a>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className={labelClass}>Full Name</label>
                  <input
                    id="name"
                    className={inputClass}
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>Email</label>
                  <input
                    id="email"
                    className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}
                    value={profile.email}
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone</label>
                  <div className="flex gap-2">
                    <Select
                      value={getPhoneParts(profile.phone).countryCode}
                      onValueChange={(v) => {
                        const newDialCode = COUNTRIES.find(c => c.code === v)?.dialCode || "+1";
                        setProfile({ ...profile, phone: newDialCode + getPhoneParts(profile.phone).number });
                      }}
                    >
                      <SelectTrigger className="w-[140px] border-gray-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.code} ({c.dialCode})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      id="phone"
                      type="tel"
                      className={inputClass}
                      value={getPhoneParts(profile.phone).number}
                      onChange={(e) => setProfile({ ...profile, phone: getPhoneParts(profile.phone).dialCode + e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="specialty" className={labelClass}>Specialty</label>
                  <Select
                    value={profile.specialty}
                    onValueChange={(v) => setProfile({ ...profile, specialty: v })}
                  >
                    <SelectTrigger className="w-full border-gray-200 bg-white">
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialtiesList.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="city" className={labelClass}>City</label>
                  <input
                    id="city"
                    className={inputClass}
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="country" className={labelClass}>Country</label>
                  <Select
                    value={profile.country}
                    onValueChange={(v) => setProfile({ ...profile, country: v })}
                  >
                    <SelectTrigger className="w-full border-gray-200 bg-white">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-400" /> Change Password
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="currentPassword" className={labelClass}>Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      className={inputClass}
                      value={profile.currentPassword}
                      onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                    />
                  </div>
                  <div />
                  <div>
                    <label htmlFor="newPassword" className={labelClass}>New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      className={inputClass}
                      value={profile.newPassword}
                      onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className={labelClass}>Confirm New Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      className={inputClass}
                      value={profile.confirmPassword}
                      onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
            </div>
          )}
        </div>
      )}

      {/* Clinic Tab */}
      {activeTab === "clinic" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-3xl">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
            Clinic Configuration
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Set your timezone, working hours, and days off for accurate appointment scheduling.
          </p>
          <form onSubmit={handleClinicSettingsSave} className="space-y-5">
            <div>
              <label className={labelClass}>Timezone</label>
              <Select
                value={clinicSettings.timezone}
                onValueChange={(v) => setClinicSettings({ ...clinicSettings, timezone: v })}
              >
                <SelectTrigger className="w-full border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="workingHoursStart" className={labelClass}>Working Hours Start</label>
                <input
                  id="workingHoursStart"
                  type="time"
                  className={inputClass}
                  value={clinicSettings.workingHoursStart}
                  onChange={(e) => setClinicSettings({ ...clinicSettings, workingHoursStart: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="workingHoursEnd" className={labelClass}>Working Hours End</label>
                <input
                  id="workingHoursEnd"
                  type="time"
                  className={inputClass}
                  value={clinicSettings.workingHoursEnd}
                  onChange={(e) => setClinicSettings({ ...clinicSettings, workingHoursEnd: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Days Off</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                {daysOfWeek.map((day) => (
                  <label
                    key={day}
                    htmlFor={day}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition text-sm ${
                      clinicSettings.daysOff.includes(day)
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Checkbox
                      id={day}
                      checked={clinicSettings.daysOff.includes(day)}
                      onCheckedChange={() => toggleDayOff(day)}
                      className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Saving..." : "Save Clinic Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WhatsApp Tab */}
      {activeTab === "whatsapp" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-3xl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 w-full">
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
      )}
    </div>
  );
}