"use client";

import { useState } from "react";
import { Loader2, Key, Smartphone, Laptop, LogOut, ShieldAlert } from "lucide-react";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { toast } from "@/components/ui/use-toast";

export default function SecurityPage() {
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm("Are you sure you want to log out of all other devices? This will invalidate all current sessions except this one.")) return;
    toast({ title: "Sessions invalidated", description: "You have been logged out of all other devices." });
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your profile, clinic configuration, and integrations</p>
      </div>

      <SettingsTabs />

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-4xl">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4 mt-0 flex items-center gap-2">
            <Key className="h-4 w-4" /> Password Management
          </h3>
          
          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currentPassword" className={labelClass}>Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  required
                  className={inputClass}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
              <div />
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
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-6 py-2 text-sm font-medium flex items-center gap-2 transition"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-4xl">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4 mt-0 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Device Management & Sessions
          </h3>
          <p className="text-sm text-gray-500 mb-6">View and manage the devices currently logged into your Gyrex account.</p>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="flex items-center gap-3">
                <Laptop className="h-5 w-5 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">MacBook Pro (macOS)</h4>
                  <p className="text-xs text-gray-500">Chrome • IP: 192.168.1.1</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full mb-1">Current Session</span>
                <span className="text-xs text-gray-400">Active now</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-400" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">iPhone 13 (iOS 16)</h4>
                  <p className="text-xs text-gray-500">Safari • IP: 172.16.254.1</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400">Last active: 2 hours ago</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 flex justify-end">
            <button
              onClick={handleLogoutAllDevices}
              className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Logout All Other Devices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
