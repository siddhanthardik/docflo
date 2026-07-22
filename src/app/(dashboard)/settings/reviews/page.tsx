"use client";

import { useState, useEffect } from "react";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ReviewsSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [settings, setSettings] = useState({
    reviewAutomationEnabled: true,
    reviewCooldownDays: 90,
    reviewDelayMinutes: 45,
    reviewSurveyMessage: "",
    reviewGoogleInvitationMessage: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/reviews");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          reviewAutomationEnabled: data.reviewAutomationEnabled ?? true,
          reviewCooldownDays: data.reviewCooldownDays ?? 90,
          reviewDelayMinutes: data.reviewDelayMinutes ?? 45,
          reviewSurveyMessage: data.reviewSurveyMessage || "",
          reviewGoogleInvitationMessage: data.reviewGoogleInvitationMessage || ""
        });
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast({ title: "Success", description: "Review settings saved successfully" });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-900">Clinic Settings</h1>
      <p className="text-gray-500 mb-6">Manage your clinic's automated review requests and reputation workflow.</p>
      
      <SettingsTabs />

      {fetching ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Review Automation</h2>
            <p className="text-sm text-gray-500">Configure how and when your patients are asked for reviews.</p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="space-y-0.5">
                <Label className="text-base font-medium text-gray-900">Enable Automated Review Requests</Label>
                <p className="text-sm text-gray-500">Automatically send review requests after appointments are completed.</p>
              </div>
              <Switch 
                checked={settings.reviewAutomationEnabled} 
                onCheckedChange={(c) => setSettings({ ...settings, reviewAutomationEnabled: c })} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="delay">Send Delay (Minutes)</Label>
                <input 
                  id="delay"
                  type="number"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={settings.reviewDelayMinutes}
                  onChange={(e) => setSettings({ ...settings, reviewDelayMinutes: parseInt(e.target.value) || 0 })}
                  min={0}
                />
                <p className="text-xs text-gray-500">Time to wait after appointment is completed.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cooldown">Cooldown Period (Days)</Label>
                <input 
                  id="cooldown"
                  type="number"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={settings.reviewCooldownDays}
                  onChange={(e) => setSettings({ ...settings, reviewCooldownDays: parseInt(e.target.value) || 0 })}
                  min={0}
                />
                <p className="text-xs text-gray-500">Wait this many days before asking the same patient again.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="surveyMessage">Review Survey Message</Label>
              <textarea 
                id="surveyMessage"
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                value={settings.reviewSurveyMessage}
                placeholder="Thank you for visiting today. We hope you had a good experience. If you're happy with your visit, simply reply YES..."
                onChange={(e) => setSettings({ ...settings, reviewSurveyMessage: e.target.value })}
              />
              <p className="text-xs text-gray-500">Leave blank to use the default message.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invitationMessage">Google Invitation Message</Label>
              <textarea 
                id="invitationMessage"
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                value={settings.reviewGoogleInvitationMessage}
                placeholder="We are so glad to hear that! 🌟 Could you take 60 seconds to leave us a quick review on Google? {link}"
                onChange={(e) => setSettings({ ...settings, reviewGoogleInvitationMessage: e.target.value })}
              />
              <p className="text-xs text-gray-500">Sent when patient replies YES. Must contain {'{link}'} for the review URL. Leave blank for default.</p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Review Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
