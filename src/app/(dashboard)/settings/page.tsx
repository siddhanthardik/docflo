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
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your profile, clinic configuration, and integrations</p>
      </div>

      <SettingsTabs />

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
    </div>
  );
}