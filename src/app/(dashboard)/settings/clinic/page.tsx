"use client";

import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, UploadCloud, X, Lock, AlertTriangle } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export default function SettingsClinicPage() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [clinic, setClinic] = useState({
    clinicName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    image: "", // logo
    currency: "USD",
    invoicePrefix: "INV-",
    taxGstNumber: "",
    invoiceFooter: "",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    firstDayOfWeek: "Monday",
    timezone: "UTC",
  });

  const [currencyLocked, setCurrencyLocked] = useState(false);
  const [userRole, setUserRole] = useState<string>("DOCTOR");
  const [currencyChangedWarning, setCurrencyChangedWarning] = useState(false);

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

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "ar", name: "Arabic" },
  ];

  useEffect(() => {
    fetchClinicProfile();
  }, []);

  const fetchClinicProfile = async () => {
    try {
      setPageLoading(true);
      const response = await fetch("/api/settings/profile");
      if (response.ok) {
        const data = await response.json();
        setClinic((prev) => ({ 
          ...prev, 
          clinicName: data.clinicName || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          image: data.image || "",
          currency: data.currency || "USD",
          invoicePrefix: data.invoicePrefix || "INV-",
          taxGstNumber: data.taxGstNumber || "",
          invoiceFooter: data.invoiceFooter || "",
          language: data.language || "en",
          dateFormat: data.dateFormat || "MM/DD/YYYY",
          firstDayOfWeek: data.firstDayOfWeek || "Monday",
          timezone: data.timezone || "UTC",
        }));
        
        setUserRole(data.role || "DOCTOR");

        const isAdmin = data.role === "ADMIN" || data.role === "SUPERADMIN";
        if (data.isCurrencyLocked && !isAdmin) {
          setCurrencyLocked(true);
        } else {
          setCurrencyLocked(false);
        }
      }
    } catch (error) {
      console.error("Error fetching clinic profile:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setClinic(prev => ({ ...prev, image: data.url }));
      toast({ title: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setClinic(prev => ({ ...prev, currency: newCurrency }));
    setCurrencyChangedWarning(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinic),
      });
      if (response.ok) {
        const data = await response.json();
        toast({ title: "Success", description: "Clinic settings updated" });
        setCurrencyChangedWarning(false);
        const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";
        if (data.isCurrencyLocked && !isAdmin) {
          setCurrencyLocked(true);
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update clinic settings");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionTitleClass = "text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4 mt-8";

  const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your profile, clinic configuration, and integrations</p>
      </div>

      <SettingsTabs />

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-4xl">
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4 mt-0">
          Clinic Profile
        </h3>
        {pageLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            {/* Clinic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Clinic Logo</label>
                <div className="flex items-center gap-6 mt-2">
                  {clinic.image ? (
                    <div className="relative border border-gray-200 rounded-lg p-2 bg-gray-50 flex items-center justify-center w-24 h-24">
                      <img src={clinic.image} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setClinic({ ...clinic, image: "" })}
                        className="absolute -top-2 -right-2 bg-white rounded-full border border-gray-200 p-1 text-gray-500 hover:text-red-500 shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center w-24 h-24 text-gray-400">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                  )}
                  
                  <div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                    >
                      {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {uploading ? "Uploading..." : "Upload New Logo"}
                    </button>
                    <p className="text-xs text-gray-400 mt-2">Recommended: 400x400px transparent PNG</p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="clinicName" className={labelClass}>Clinic Name</label>
                <input
                  id="clinicName"
                  className={inputClass}
                  value={clinic.clinicName}
                  onChange={(e) => setClinic({ ...clinic, clinicName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="country" className={labelClass}>Country</label>
                <Select
                  value={clinic.country}
                  onValueChange={(v) => setClinic({ ...clinic, country: v })}
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
              <div className="sm:col-span-2">
                <label htmlFor="address" className={labelClass}>Address</label>
                <input
                  id="address"
                  className={inputClass}
                  value={clinic.address}
                  onChange={(e) => setClinic({ ...clinic, address: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>City</label>
                <input
                  id="city"
                  className={inputClass}
                  value={clinic.city}
                  onChange={(e) => setClinic({ ...clinic, city: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>State/Province</label>
                <input
                  id="state"
                  className={inputClass}
                  value={clinic.state}
                  onChange={(e) => setClinic({ ...clinic, state: e.target.value })}
                />
              </div>
            </div>

            {/* Financial Settings */}
            <h3 className={sectionTitleClass}>Financial Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Currency Selector */}
              <div className="sm:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    Base Billing Currency
                    {currencyLocked && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </label>
                </div>

                <Select
                  value={clinic.currency}
                  onValueChange={handleCurrencyChange}
                  disabled={currencyLocked}
                >
                  <SelectTrigger className="w-full border-gray-300 bg-white h-11 text-sm font-medium">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Warning message when selecting / modifying currency */}
                {!currencyLocked && (
                  <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Important Warning:</span> Once confirmed and saved, your billing currency will be locked for patient invoicing and accounting consistency. It can only be changed by a System Administrator.
                    </div>
                  </div>
                )}

                {currencyLocked && !isAdmin && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    Currency selection is confirmed and locked. Contact System Support to request currency changes.
                  </p>
                )}

                {currencyLocked && isAdmin && (
                  <p className="text-xs text-indigo-600 font-semibold mt-2">
                    🛡️ Admin Override Active: You have permission to modify locked currency.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="taxGstNumber" className={labelClass}>Tax / GST Number</label>
                <input
                  id="taxGstNumber"
                  className={inputClass}
                  value={clinic.taxGstNumber}
                  onChange={(e) => setClinic({ ...clinic, taxGstNumber: e.target.value })}
                  placeholder="e.g. GSTIN123456"
                />
              </div>
              <div>
                <label htmlFor="invoicePrefix" className={labelClass}>Invoice Prefix</label>
                <input
                  id="invoicePrefix"
                  className={inputClass}
                  value={clinic.invoicePrefix}
                  onChange={(e) => setClinic({ ...clinic, invoicePrefix: e.target.value })}
                  placeholder="e.g. INV-"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="invoiceFooter" className={labelClass}>Invoice Footer Notes</label>
                <input
                  id="invoiceFooter"
                  className={inputClass}
                  value={clinic.invoiceFooter}
                  onChange={(e) => setClinic({ ...clinic, invoiceFooter: e.target.value })}
                  placeholder="Thank you for visiting our clinic!"
                />
              </div>
            </div>

            {/* Preferences */}
            <h3 className={sectionTitleClass}>Localization & Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="language" className={labelClass}>Language</label>
                <Select
                  value={clinic.language}
                  onValueChange={(v) => setClinic({ ...clinic, language: v })}
                >
                  <SelectTrigger className="w-full border-gray-200 bg-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(l => (
                      <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="timezone" className={labelClass}>Timezone</label>
                <Select
                  value={clinic.timezone}
                  onValueChange={(v) => setClinic({ ...clinic, timezone: v })}
                >
                  <SelectTrigger className="w-full border-gray-200 bg-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
