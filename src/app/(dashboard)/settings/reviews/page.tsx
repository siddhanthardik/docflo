"use client";

import { useState, useEffect } from "react";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { toast } from "@/components/ui/use-toast";
import { 
  Loader2, 
  Calendar, 
  Star, 
  CreditCard, 
  Bot, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  Info,
  Send,
  Eye,
  FileText
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ReviewsAndMessagingSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activePreviewTab, setActivePreviewTab] = useState<"survey" | "reminder" | "confirmation" | "invoice">("survey");

  const [settings, setSettings] = useState({
    // Master Switch
    reviewAutomationEnabled: true,
    
    // Category 1: Appointment Notifications & Reminders
    enableBookingConfirmation: true,
    enable24hReminder: true,
    enable2hReminder: false,

    // Category 2: Post-Consultation Reviews & Surveys
    enableGoogleReviewAutoDispatch: true,
    reviewCooldownDays: 90,
    reviewDelayMinutes: 45,
    reviewSurveyMessage: "",
    reviewGoogleInvitationMessage: "",

    // Category 3: Invoices & Receipts
    enableInvoiceMessages: true,
    enablePaymentReceipts: true,

    // Category 4: AI Auto-Responder
    enableAIAutoResponder: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const res = await fetch("/api/settings/reviews");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          reviewAutomationEnabled: data.reviewAutomationEnabled ?? true,
          reviewCooldownDays: data.reviewCooldownDays ?? 90,
          reviewDelayMinutes: data.reviewDelayMinutes ?? 45,
          reviewSurveyMessage: data.reviewSurveyMessage || "",
          reviewGoogleInvitationMessage: data.reviewGoogleInvitationMessage || "",
          enableBookingConfirmation: data.enableBookingConfirmation ?? true,
          enable24hReminder: data.enable24hReminder ?? true,
          enable2hReminder: data.enable2hReminder ?? false,
          enableGoogleReviewAutoDispatch: data.enableGoogleReviewAutoDispatch ?? true,
          enableInvoiceMessages: data.enableInvoiceMessages ?? true,
          enablePaymentReceipts: data.enablePaymentReceipts ?? true,
          enableAIAutoResponder: data.enableAIAutoResponder ?? true,
        });
      }
    } catch (error) {
      console.error("Failed to load messaging settings", error);
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast({ title: "Settings Saved", description: "All automated message controls updated successfully." });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeTogglesCount = [
    settings.enableBookingConfirmation,
    settings.enable24hReminder,
    settings.enable2hReminder,
    settings.reviewAutomationEnabled,
    settings.enableGoogleReviewAutoDispatch,
    settings.enableInvoiceMessages,
    settings.enablePaymentReceipts,
    settings.enableAIAutoResponder,
  ].filter(Boolean).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clinic Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure automated WhatsApp messages, reminders, invoices, and review surveys.</p>
      </div>

      <SettingsTabs />

      {fetching ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium text-gray-500">Loading communication controls...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Master Control Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white shadow-md">
            <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    Automated Communication Hub
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    {activeTogglesCount} / 8 Message Triggers Active
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">Master Messaging Engine</h2>
                <p className="text-sm text-indigo-100 max-w-xl">
                  Turn automated WhatsApp messaging on or off across your clinic. You can also customize individual triggers below.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider">Master Status</p>
                  <p className="text-sm font-bold">{settings.reviewAutomationEnabled ? "Active & Running" : "Paused"}</p>
                </div>
                <Switch
                  checked={settings.reviewAutomationEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, reviewAutomationEnabled: checked })}
                  className="data-[state=checked]:bg-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Grid Layout: Controls (Left) & WhatsApp Live Preview (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Toggle Cards */}
            <div className="lg:col-span-8 space-y-6">

              {/* Card 1: Appointment Notifications & Reminders */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Appointment Reminders & Confirmations</h3>
                    <p className="text-xs text-gray-500">Automatically notify patients when bookings are confirmed or coming up.</p>
                  </div>
                </div>

                <div className="p-5 space-y-5 divide-y divide-gray-100">
                  {/* Toggle 1: Booking Confirmation */}
                  <div className="flex items-center justify-between pt-3 first:pt-0">
                    <div className="space-y-0.5 max-w-md">
                      <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        Instant Booking Confirmation
                        {settings.enableBookingConfirmation && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">ON</span>
                        )}
                      </Label>
                      <p className="text-xs text-gray-500">Sends WhatsApp booking details immediately when an appointment is scheduled or confirmed.</p>
                    </div>
                    <Switch
                      checked={settings.enableBookingConfirmation}
                      onCheckedChange={(c) => setSettings({ ...settings, enableBookingConfirmation: c })}
                    />
                  </div>

                  {/* Toggle 2: 24h Reminder */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-0.5 max-w-md">
                      <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        24-Hour Appointment Reminder
                        {settings.enable24hReminder && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">ON</span>
                        )}
                      </Label>
                      <p className="text-xs text-gray-500">Sends a friendly WhatsApp reminder 24 hours prior to the patient's appointment time.</p>
                    </div>
                    <Switch
                      checked={settings.enable24hReminder}
                      onCheckedChange={(c) => setSettings({ ...settings, enable24hReminder: c })}
                    />
                  </div>

                  {/* Toggle 3: 2h Reminder */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-0.5 max-w-md">
                      <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        Same-Day / 2-Hour Prior Reminder
                        {settings.enable2hReminder && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">ON</span>
                        )}
                      </Label>
                      <p className="text-xs text-gray-500">Sends a final WhatsApp reminder 2 hours before consultation to minimize no-shows.</p>
                    </div>
                    <Switch
                      checked={settings.enable2hReminder}
                      onCheckedChange={(c) => setSettings({ ...settings, enable2hReminder: c })}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Post-Consultation Reviews & Surveys */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Post-Consultation Reviews & Surveys</h3>
                    <p className="text-xs text-gray-500">Collect private patient feedback and boost your Google Maps clinic reviews.</p>
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  {/* Toggle 4: Review Survey */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-amber-100 bg-amber-50/30">
                    <div className="space-y-0.5 max-w-md">
                      <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        Automated Feedback Survey Request
                      </Label>
                      <p className="text-xs text-gray-600">Sends a warm feedback survey after consultation asking if the patient was satisfied.</p>
                    </div>
                    <Switch
                      checked={settings.reviewAutomationEnabled}
                      onCheckedChange={(c) => setSettings({ ...settings, reviewAutomationEnabled: c })}
                    />
                  </div>

                  {/* Toggle 5: Google Review Auto-Dispatch */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="space-y-0.5 max-w-md">
                      <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        Auto-Dispatch Direct Google Review Link
                      </Label>
                      <p className="text-xs text-gray-500">When a patient replies YES to the survey, automatically send your direct Google Review URL.</p>
                    </div>
                    <Switch
                      checked={settings.enableGoogleReviewAutoDispatch}
                      onCheckedChange={(c) => setSettings({ ...settings, enableGoogleReviewAutoDispatch: c })}
                    />
                  </div>

                  {/* Delay & Cooldown Rules */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="delay" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        Send Delay (Minutes)
                      </Label>
                      <input
                        id="delay"
                        type="number"
                        min={0}
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        value={settings.reviewDelayMinutes}
                        onChange={(e) => setSettings({ ...settings, reviewDelayMinutes: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-[11px] text-gray-400">Time to wait after appointment is marked Completed.</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cooldown" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                        Cooldown Period (Days)
                      </Label>
                      <input
                        id="cooldown"
                        type="number"
                        min={0}
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        value={settings.reviewCooldownDays}
                        onChange={(e) => setSettings({ ...settings, reviewCooldownDays: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-[11px] text-gray-400">Prevents asking the same patient again within this timeframe.</p>
                    </div>
                  </div>

                  {/* Custom Survey Text */}
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="surveyMessage" className="text-xs font-semibold text-gray-700">Custom Survey Message</Label>
                    <textarea
                      id="surveyMessage"
                      rows={3}
                      className="flex w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      placeholder="Hi {firstName}, thank you for trusting our clinic. We truly care about your well-being and hope you are feeling better after your visit. Were you happy with your care? Simply reply YES..."
                      value={settings.reviewSurveyMessage}
                      onChange={(e) => setSettings({ ...settings, reviewSurveyMessage: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-400">Leave blank to use the default warm empathetic message.</p>
                  </div>

                  {/* Custom Google Invitation Text */}
                  <div className="space-y-2">
                    <Label htmlFor="invitationMessage" className="text-xs font-semibold text-gray-700">Custom Google Review Invitation</Label>
                    <textarea
                      id="invitationMessage"
                      rows={3}
                      className="flex w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      placeholder="We are so thrilled to hear that! 🌟 Could you take 60 seconds to share your experience on Google? {link}"
                      value={settings.reviewGoogleInvitationMessage}
                      onChange={(e) => setSettings({ ...settings, reviewGoogleInvitationMessage: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-400">Must include <code className="text-indigo-600 font-bold">{`{link}`}</code> where the Google Review URL should be inserted.</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Invoices & Receipts */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Invoices & Payment Receipts</h3>
                    <p className="text-xs text-gray-500">Deliver digital invoices and payment confirmations directly to patient WhatsApp.</p>
                  </div>
                </div>

                <div className="p-5 space-y-5 divide-y divide-gray-100">
                  {/* Toggle 6: Invoice Messages */}
                  <div className="flex items-center justify-between pt-3 first:pt-0">
                    <div className="space-y-0.5 max-w-md">
                      <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        WhatsApp PDF Invoice Sharing
                      </Label>
                      <p className="text-xs text-gray-500">Sends PDF invoice attachments with patient summaries over WhatsApp when created.</p>
                    </div>
                    <Switch
                      checked={settings.enableInvoiceMessages}
                      onCheckedChange={(c) => setSettings({ ...settings, enableInvoiceMessages: c })}
                    />
                  </div>

                  {/* Toggle 7: Payment Receipts */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-0.5 max-w-md">
                      <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        Automated Payment Receipt Notice
                      </Label>
                      <p className="text-xs text-gray-500">Sends instant WhatsApp payment confirmation receipts when invoices are marked PAID.</p>
                    </div>
                    <Switch
                      checked={settings.enablePaymentReceipts}
                      onCheckedChange={(c) => setSettings({ ...settings, enablePaymentReceipts: c })}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: AI Auto-Responder */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">AI Booking Assistant & Auto-Responder</h3>
                    <p className="text-xs text-gray-500">Autonomous WhatsApp assistant for handling patient inquiries and appointments 24/7.</p>
                  </div>
                </div>

                <div className="p-5 flex items-center justify-between">
                  <div className="space-y-0.5 max-w-md">
                    <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      Enable AI WhatsApp Receptionist
                    </Label>
                    <p className="text-xs text-gray-500">Allows AI agents to answer clinic hours, doctor availability, and assist with bookings on WhatsApp.</p>
                  </div>
                  <Switch
                    checked={settings.enableAIAutoResponder}
                    onCheckedChange={(c) => setSettings({ ...settings, enableAIAutoResponder: c })}
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Live WhatsApp Message Preview Phone Mockup */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-indigo-600" />
                      Live WhatsApp Preview
                    </h4>
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">Patient View</span>
                  </div>

                  {/* Tabs to select which message to preview */}
                  <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl mb-4 text-xs font-medium text-gray-600">
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab("survey")}
                      className={`py-1.5 rounded-lg transition-all ${activePreviewTab === "survey" ? "bg-white text-gray-900 font-bold shadow-sm" : "hover:text-gray-900"}`}
                    >
                      Survey
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab("reminder")}
                      className={`py-1.5 rounded-lg transition-all ${activePreviewTab === "reminder" ? "bg-white text-gray-900 font-bold shadow-sm" : "hover:text-gray-900"}`}
                    >
                      Reminder
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab("confirmation")}
                      className={`py-1.5 rounded-lg transition-all ${activePreviewTab === "confirmation" ? "bg-white text-gray-900 font-bold shadow-sm" : "hover:text-gray-900"}`}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab("invoice")}
                      className={`py-1.5 rounded-lg transition-all ${activePreviewTab === "invoice" ? "bg-white text-gray-900 font-bold shadow-sm" : "hover:text-gray-900"}`}
                    >
                      Invoice
                    </button>
                  </div>

                  {/* Phone Shell */}
                  <div className="mx-auto max-w-[280px] rounded-[32px] border-[6px] border-gray-900 bg-emerald-900/10 p-3 shadow-xl relative overflow-hidden">
                    {/* Header bar inside phone */}
                    <div className="bg-emerald-800 text-white p-3 -mx-3 -mt-3 mb-3 flex items-center gap-2 shadow-sm">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                        C
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">Clinic Care WhatsApp</p>
                        <p className="text-[10px] text-emerald-200">Official Business</p>
                      </div>
                    </div>

                    {/* Chat Bubble */}
                    <div className="space-y-3 min-h-[220px] flex flex-col justify-end">
                      <div className="bg-white rounded-2xl rounded-tl-xs p-3 text-xs text-gray-800 shadow-sm border border-emerald-100 relative space-y-2">
                        {activePreviewTab === "survey" && (
                          <p className="leading-relaxed">
                            {settings.reviewSurveyMessage || "Hi Siddhant, thank you for trusting our clinic. We truly care about your well-being and hope you are feeling better after your visit.\n\nWere you happy with your care? Simply reply *YES*.\nIf there is anything we could have done better, please reply *NO* so we can improve your care."}
                          </p>
                        )}
                        {activePreviewTab === "reminder" && (
                          <p className="leading-relaxed">
                            Hi Siddhant, this is a friendly reminder for your upcoming consultation with Dr. Vinay tomorrow at 10:30 AM.\n\nPlease reply *1* to confirm or *2* to reschedule.
                          </p>
                        )}
                        {activePreviewTab === "confirmation" && (
                          <p className="leading-relaxed">
                            Hi Siddhant, your appointment has been confirmed! 🎉\n\n🗓️ Date: Tomorrow\n⏰ Time: 10:30 AM\n👨‍⚕️ Doctor: Dr. Vinay Kumar Rai\n📍 Location: Main Clinic Branch
                          </p>
                        )}
                        {activePreviewTab === "invoice" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                              <FileText className="h-5 w-5 text-red-500 shrink-0" />
                              <div className="truncate">
                                <p className="text-[11px] font-bold text-gray-900 truncate">Invoice_INV-2026-0016.pdf</p>
                                <p className="text-[10px] text-gray-400">1 Page • PDF Document</p>
                              </div>
                            </div>
                            <p className="leading-relaxed">Hi Siddhant, attached is your billing receipt from Coocon Clinic. Thank you!</p>
                          </div>
                        )}
                        <span className="text-[9px] text-gray-400 block text-right">10:32 AM ✓✓</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                    <p className="text-xs text-gray-500">
                      Messages are normalized and dispatched using your connected WhatsApp Business device.
                    </p>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Settings...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Save Communication Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      )}
    </div>
  );
}
