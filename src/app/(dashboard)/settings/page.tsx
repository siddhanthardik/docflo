"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { SettingsTabs } from "@/components/settings/settings-tabs";

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

export default function SettingsProfilePage() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
  });

  useEffect(() => {
    fetchProfile();
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
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          specialty: profile.specialty,
        }),
      });
      if (response.ok) {
        toast({ title: "Success", description: "Profile updated successfully" });
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

  const inputClass =
    "w-full h-10 sm:h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-2xs space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-xs sm:text-sm">Manage your profile, clinic configuration, and integrations</p>
      </div>

      <SettingsTabs />

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs max-w-4xl space-y-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Personal Information
        </h3>
        {profileLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
                <label htmlFor="email" className={labelClass}>Email Address</label>
                <input
                  id="email"
                  className={`${inputClass} bg-slate-50 text-slate-400 cursor-not-allowed`}
                  value={profile.email}
                  disabled
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Admin / Account Phone Number</label>
                <div className="flex gap-2">
                  <Select
                    value={getPhoneParts(profile.phone).countryCode}
                    onValueChange={(v) => {
                      const newDialCode = COUNTRIES.find(c => c.code === v)?.dialCode || "+1";
                      setProfile({ ...profile, phone: newDialCode + getPhoneParts(profile.phone).number });
                    }}
                  >
                    <SelectTrigger className="w-[120px] sm:w-[140px] h-10 border-slate-200 bg-white text-xs sm:text-sm">
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
                <p className="text-[11px] text-slate-500 mt-1">Used for account security &amp; admin alerts. To manage doctor practicing phone numbers, configure the <strong>Doctors</strong> tab.</p>
              </div>
              <div>
                <label htmlFor="specialty" className={labelClass}>Medical Specialty</label>
                <Select
                  value={profile.specialty}
                  onValueChange={(v) => setProfile({ ...profile, specialty: v })}
                >
                  <SelectTrigger className="w-full h-10 border-slate-200 bg-white text-xs sm:text-sm">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialtiesList.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl px-6 text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Saving Profile..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}