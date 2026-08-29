"use client";

import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, UploadCloud, X, Lock, AlertTriangle, MapPin, Building2, Phone } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { getIndianStates, getCitiesByState, getPincodesByCity, lookupPincode } from "@/lib/location-data";

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
    country: "India",
    pincode: "",
    phone: "",
    image: "", // logo
    currency: "INR",
    invoicePrefix: "INV-",
    taxGstNumber: "",
    invoiceFooter: "",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    firstDayOfWeek: "Monday",
    timezone: "Asia/Kolkata",
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
  });

  const [currencyLocked, setCurrencyLocked] = useState(false);
  const [userRole, setUserRole] = useState<string>("DOCTOR");
  const [currencyChangedWarning, setCurrencyChangedWarning] = useState(false);

  // Cascading location state
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availablePincodes, setAvailablePincodes] = useState<string[]>([]);
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [isCustomPincode, setIsCustomPincode] = useState(false);

  const timezones = [
    "Asia/Kolkata",
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "ar", name: "Arabic" },
  ];

  useEffect(() => {
    fetchClinicProfile();
  }, []);

  // Update available states when country changes
  useEffect(() => {
    if (clinic.country === "India") {
      const states = getIndianStates();
      setAvailableStates(states);
    } else {
      setAvailableStates([]);
    }
  }, [clinic.country]);

  // Update available cities when state changes
  useEffect(() => {
    if (clinic.country === "India" && clinic.state) {
      const cities = getCitiesByState(clinic.state);
      setAvailableCities(cities);
      if (clinic.city && !cities.includes(clinic.city)) {
        setIsCustomCity(true);
      } else {
        setIsCustomCity(false);
      }
    } else {
      setAvailableCities([]);
    }
  }, [clinic.state, clinic.country]);

  // Update available pincodes when city changes
  useEffect(() => {
    if (clinic.country === "India" && clinic.city) {
      const pins = getPincodesByCity(clinic.city, clinic.state);
      setAvailablePincodes(pins);
      if (clinic.pincode && !pins.includes(clinic.pincode)) {
        setIsCustomPincode(true);
      } else {
        setIsCustomPincode(false);
      }
    } else {
      setAvailablePincodes([]);
    }
  }, [clinic.city, clinic.state, clinic.country]);

  const fetchClinicProfile = async () => {
    try {
      setPageLoading(true);
      const response = await fetch("/api/settings/profile");
      if (response.ok) {
        const data = await response.json();
        const initialCountry = data.country || "India";
        const initialState = data.state || "";
        const initialCity = data.city || "";
        const initialPincode = data.pincode || "";

        setClinic((prev) => ({ 
          ...prev, 
          clinicName: data.clinicName || "",
          address: data.address || "",
          city: initialCity,
          state: initialState,
          country: initialCountry,
          pincode: initialPincode,
          phone: data.phone || "",
          image: data.image || "",
          currency: data.currency || "INR",
          invoicePrefix: data.invoicePrefix || "INV-",
          taxGstNumber: data.taxGstNumber || "",
          invoiceFooter: data.invoiceFooter || "",
          language: data.language || "en",
          dateFormat: data.dateFormat || "DD/MM/YYYY",
          firstDayOfWeek: data.firstDayOfWeek || "Monday",
          timezone: data.timezone || "Asia/Kolkata",
          workingHoursStart: data.workingHoursStart || "09:00",
          workingHoursEnd: data.workingHoursEnd || "17:00",
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

  const handleCountryChange = (newCountry: string) => {
    setClinic(prev => ({
      ...prev,
      country: newCountry,
      state: newCountry === "India" ? prev.state : "",
      city: newCountry === "India" ? prev.city : "",
      pincode: newCountry === "India" ? prev.pincode : "",
    }));
  };

  const handleStateChange = (newState: string) => {
    const cities = getCitiesByState(newState);
    setClinic(prev => ({
      ...prev,
      state: newState,
      city: cities.length > 0 ? cities[0] : "",
      pincode: "",
    }));
    setIsCustomCity(false);
    setIsCustomPincode(false);
  };

  const handleCityChange = (newCity: string) => {
    if (newCity === "__CUSTOM__") {
      setIsCustomCity(true);
      setClinic(prev => ({ ...prev, city: "", pincode: "" }));
      return;
    }
    setIsCustomCity(false);
    const pins = getPincodesByCity(newCity, clinic.state);
    setClinic(prev => ({
      ...prev,
      city: newCity,
      pincode: pins.length > 0 ? pins[0] : prev.pincode,
    }));
    setIsCustomPincode(false);
  };

  const handlePincodeChange = (newPin: string) => {
    if (newPin === "__CUSTOM__") {
      setIsCustomPincode(true);
      return;
    }
    setIsCustomPincode(false);
    setClinic(prev => ({ ...prev, pincode: newPin }));
  };

  // Direct Pincode Autocomplete
  const handlePincodeInput = (rawPin: string) => {
    const cleanPin = rawPin.replace(/\D/g, "").slice(0, 6);
    setClinic(prev => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6 && clinic.country === "India") {
      const match = lookupPincode(cleanPin);
      if (match) {
        setClinic(prev => ({
          ...prev,
          state: match.state,
          city: match.city,
          pincode: cleanPin,
        }));
        setIsCustomCity(false);
        setIsCustomPincode(false);
        toast({ title: `Auto-detected ${match.city}, ${match.state}` });
      }
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
        toast({ title: "Clinic details saved successfully" });
        if (data.isCurrencyLocked && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
          setCurrencyLocked(true);
        }
        setCurrencyChangedWarning(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update clinic profile");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1";
  const sectionTitleClass = "text-sm font-bold text-slate-900 border-b border-slate-100 pb-3";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-2xs space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Clinic Profile</h1>
        <p className="text-slate-500 text-xs sm:text-sm">Manage clinic branding, official address, telephone, and billing configuration</p>
      </div>

      <SettingsTabs />

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs max-w-4xl space-y-8">
        {pageLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            
            {/* SECTION: CLINIC BRANDING & ADDRESS */}
            <div className="space-y-6">
              <h3 className={sectionTitleClass}>Clinic Profile &amp; Location</h3>

              {/* Clinic Logo */}
              <div>
                <label className={labelClass}>Clinic Logo</label>
                <div className="flex items-center gap-6 mt-2">
                  {clinic.image ? (
                    <div className="relative border border-slate-200 rounded-2xl p-2 bg-slate-50 flex items-center justify-center w-24 h-24 shadow-2xs">
                      <img src={clinic.image} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setClinic({ ...clinic, image: "" })}
                        className="absolute -top-2 -right-2 bg-white rounded-full border border-slate-200 p-1 text-slate-500 hover:text-red-500 shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-center w-24 h-24 text-slate-400">
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
                      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs"
                    >
                      {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {uploading ? "Uploading..." : "Upload New Logo"}
                    </button>
                    <p className="text-[11px] text-slate-400 mt-1.5">Recommended: 400×400px transparent PNG</p>
                  </div>
                </div>
              </div>

              {/* Clinic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label htmlFor="clinicName" className={labelClass}>Clinic Name *</label>
                  <input
                    id="clinicName"
                    className={inputClass}
                    value={clinic.clinicName}
                    onChange={(e) => setClinic({ ...clinic, clinicName: e.target.value })}
                    placeholder="e.g. Vikas Cardiac Clinic"
                    required
                  />
                </div>

                {/* Country Selector */}
                <div>
                  <label htmlFor="country" className={labelClass}>Country *</label>
                  <Select
                    value={clinic.country}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger className="w-full h-11 border-slate-200 bg-white text-sm rounded-xl">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clinic Phone */}
                <div className="sm:col-span-2">
                  <label htmlFor="clinicPhone" className={labelClass}>Clinic Contact / Admin Phone</label>
                  <input
                    id="clinicPhone"
                    type="tel"
                    className={inputClass}
                    value={clinic.phone}
                    onChange={(e) => setClinic({ ...clinic, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Official clinic contact number displayed on patient invoices, receipts, and clinic notifications.</p>
                </div>

                {/* Street Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClass}>Street Address / Area</label>
                  <input
                    id="address"
                    className={inputClass}
                    value={clinic.address}
                    onChange={(e) => setClinic({ ...clinic, address: e.target.value })}
                    placeholder="e.g. Near Main Market, Jhumri Telaiya"
                  />
                </div>

                {/* State / Province (Cascading) */}
                <div>
                  <label htmlFor="state" className={labelClass}>State / Province *</label>
                  {clinic.country === "India" && availableStates.length > 0 ? (
                    <Select
                      value={clinic.state}
                      onValueChange={handleStateChange}
                    >
                      <SelectTrigger className="w-full h-11 border-slate-200 bg-white text-sm rounded-xl">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableStates.map(st => (
                          <SelectItem key={st} value={st}>{st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      id="state"
                      className={inputClass}
                      value={clinic.state}
                      onChange={(e) => setClinic({ ...clinic, state: e.target.value })}
                      placeholder="e.g. Jharkhand"
                    />
                  )}
                </div>

                {/* City (Cascading based on State) */}
                <div>
                  <label htmlFor="city" className={labelClass}>City / District *</label>
                  {clinic.country === "India" && availableCities.length > 0 && !isCustomCity ? (
                    <div className="space-y-1.5">
                      <Select
                        value={clinic.city}
                        onValueChange={handleCityChange}
                      >
                        <SelectTrigger className="w-full h-11 border-slate-200 bg-white text-sm rounded-xl">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {availableCities.map(ct => (
                            <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                          ))}
                          <SelectItem value="__CUSTOM__" className="text-indigo-600 font-bold">+ Enter other city...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id="city"
                        className={inputClass}
                        value={clinic.city}
                        onChange={(e) => setClinic({ ...clinic, city: e.target.value })}
                        placeholder="e.g. Koderma"
                      />
                      {availableCities.length > 0 && isCustomCity && (
                        <button
                          type="button"
                          onClick={() => setIsCustomCity(false)}
                          className="text-[11px] text-indigo-600 hover:underline font-bold mt-1 block"
                        >
                          ← Choose from list
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* PIN Code / Postal Code (Cascading based on City) */}
                <div className="sm:col-span-2">
                  <label htmlFor="pincode" className={labelClass}>Postal PIN Code *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {clinic.country === "India" && availablePincodes.length > 0 && !isCustomPincode ? (
                      <Select
                        value={clinic.pincode}
                        onValueChange={handlePincodeChange}
                      >
                        <SelectTrigger className="w-full h-11 border-slate-200 bg-white text-sm rounded-xl">
                          <SelectValue placeholder="Select PIN code" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {availablePincodes.map(pin => (
                            <SelectItem key={pin} value={pin}>{pin} ({clinic.city})</SelectItem>
                          ))}
                          <SelectItem value="__CUSTOM__" className="text-indigo-600 font-bold">+ Enter other PIN...</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <input
                        id="pincode"
                        type="text"
                        maxLength={6}
                        className={inputClass}
                        value={clinic.pincode}
                        onChange={(e) => handlePincodeInput(e.target.value)}
                        placeholder="e.g. 825409"
                      />
                    )}

                    {availablePincodes.length > 0 && isCustomPincode ? (
                      <button
                        type="button"
                        onClick={() => setIsCustomPincode(false)}
                        className="text-[11px] text-indigo-600 hover:underline font-bold"
                      >
                        ← Choose from list
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">
                        {clinic.pincode ? `PIN code for ${clinic.city || "your area"}, ${clinic.state || ""}` : "Enter or select 6-digit PIN code."}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Financial Settings */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <h3 className={sectionTitleClass}>Financial &amp; Invoicing Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Currency Selector */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800">Base Billing Currency</label>
                      <p className="text-xs text-slate-500">Selected currency will be used for all patient invoices and payment receipts.</p>
                    </div>
                    {currencyLocked && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>

                  <Select
                    value={clinic.currency}
                    onValueChange={handleCurrencyChange}
                    disabled={currencyLocked}
                  >
                    <SelectTrigger className="w-full bg-white h-11 border-slate-200 text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {SUPPORTED_CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.name} ({curr.code} - {curr.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {currencyChangedWarning && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Currency will be locked to this clinic after first invoice creation.</span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="taxGstNumber" className={labelClass}>Tax / GST Number</label>
                  <input
                    id="taxGstNumber"
                    className={inputClass}
                    value={clinic.taxGstNumber}
                    onChange={(e) => setClinic({ ...clinic, taxGstNumber: e.target.value })}
                    placeholder="e.g. 20AAAAA0000A1Z5"
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
                  <label htmlFor="invoiceFooter" className={labelClass}>Invoice Terms &amp; Footer Notes</label>
                  <textarea
                    id="invoiceFooter"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={clinic.invoiceFooter}
                    onChange={(e) => setClinic({ ...clinic, invoiceFooter: e.target.value })}
                    placeholder="Thank you for visiting our clinic. For queries contact clinic front desk."
                  />
                </div>
              </div>
            </div>

            {/* Localization Settings */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <h3 className={sectionTitleClass}>Localization &amp; Timings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Timezone</label>
                  <Select
                    value={clinic.timezone}
                    onValueChange={(v) => setClinic({ ...clinic, timezone: v })}
                  >
                    <SelectTrigger className="w-full bg-white h-11 border-slate-200 text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={labelClass}>Preferred Language</label>
                  <Select
                    value={clinic.language}
                    onValueChange={(v) => setClinic({ ...clinic, language: v })}
                  >
                    <SelectTrigger className="w-full bg-white h-11 border-slate-200 text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((l) => (
                        <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? "Saving Changes..." : "Save Clinic Profile"}</span>
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
