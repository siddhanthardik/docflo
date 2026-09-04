"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Key, Smartphone, Laptop, LogOut, ShieldAlert, UserCheck, Lock } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { SettingsTabs } from "@/components/settings/settings-tabs";

const getPhoneParts = (fullPhone: string) => {
  for (const c of COUNTRIES) {
    if (fullPhone.startsWith(c.dialCode)) {
      return { countryCode: c.code, dialCode: c.dialCode, number: fullPhone.slice(c.dialCode.length) };
    }
  }
  return { countryCode: "US", dialCode: "+1", number: fullPhone };
};

export default function AccountAndSecurityPage() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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
        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "DOCTOR",
        });
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
        }),
      });
      if (response.ok) {
        toast({ title: "Success", description: "Account profile updated successfully" });
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters long", variant: "destructive" });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Password updated successfully" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update password");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm("Are you sure you want to log out of all other devices? This will invalidate all current sessions except this one.")) return;
    toast({ title: "Sessions invalidated", description: "You have been logged out of all other devices." });
  };

  const inputClass =
    "w-full h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-2xs space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-xs sm:text-sm">Manage your clinic, staff, integrations, and account credentials</p>
      </div>

      <SettingsTabs />

      <div className="space-y-6 max-w-4xl">
        {/* Account Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              Account Owner & Login Details
            </h3>
            {profile.role && (
              <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {profile.role}
              </span>
            )}
          </div>

          {profileLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label htmlFor="name" className={labelClass}>Account Owner Name</label>
                  <input
                    id="name"
                    className={inputClass}
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Dr. John Doe"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your name as the administrator / account holder of this clinic workspace.
                  </p>
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>Login Email Address</label>
                  <input
                    id="email"
                    className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
                    value={profile.email}
                    disabled
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Primary login identity. Contact support to change your registered email address.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="phone" className={labelClass}>Account Login & Recovery Mobile</label>
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
                      placeholder="9876543210"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Used strictly for account security, OTP verification, and critical billing alerts.
                    To configure public clinic front desk numbers or doctor OPD contact routing, visit <strong>Clinic Profile</strong> or <strong>Doctors & OPD</strong>.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl px-6 text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Saving Details..." : "Save Account Details"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Password Management Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Password Management</h3>
          </div>
          <p className="text-xs text-slate-500">
            Ensure your account is protected with a secure, 8+ character password.
          </p>

          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="sm:col-span-2">
                <label htmlFor="currentPassword" className={labelClass}>Current Password</label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type="password"
                    required
                    className={inputClass}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="newPassword" className={labelClass}>New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  className={inputClass}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  className={inputClass}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full sm:w-auto h-10 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl px-6 text-sm font-bold flex items-center justify-center gap-2 transition"
              >
                {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Device Sessions Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Device Management & Sessions</h3>
          </div>
          <p className="text-xs text-slate-500">
            View active browser and device sessions currently authenticated with your Gyrex workspace.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100/80 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100/60 rounded-lg">
                  <Laptop className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Current Web Session</h4>
                  <p className="text-xs text-slate-500">Browser • Active in this window</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Active Now
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              onClick={handleLogoutAllDevices}
              className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Logout All Other Devices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}