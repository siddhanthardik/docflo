"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Send, Megaphone, Users, Clock } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    SENT: { bg: "bg-green-50", text: "text-green-700", label: "Sent" },
    DRAFT: { bg: "bg-amber-50", text: "text-amber-700", label: "Draft" },
    SENDING: { bg: "bg-blue-50", text: "text-blue-700", label: "Sending" },
    FAILED: { bg: "bg-red-50", text: "text-red-700", label: "Failed" },
  };
  const style = map[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return (
    <span
      className={`inline-flex items-center ${style.bg} ${style.text} text-xs font-medium px-2.5 py-0.5 rounded-full`}
    >
      {style.label}
    </span>
  );
}

export default function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    message: "",
    segmentType: "all",
    segmentValue: "",
  });
  const [loading, setLoading] = useState(false);

  const fetchCampaigns = async () => {
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns || []);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Campaign created" });
        setShowForm(false);
        setForm({ name: "", message: "", segmentType: "all", segmentValue: "" });
        fetchCampaigns();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
    if (res.ok) {
      toast({ title: "Campaign sending started" });
      fetchCampaigns();
    } else {
      toast({ title: "Error", description: "Failed to send campaign", variant: "destructive" });
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Patient Announcements</h1>
          <p className="text-gray-500 mt-1">Send bulk WhatsApp announcements to patient segments</p>
        </div>
        <button
          id="new-campaign-btn"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </button>
      </div>

      {/* Anti-Spam Warning */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700 font-medium">
              Important Meta/WhatsApp Policy Warning
            </p>
            <p className="text-sm text-amber-600 mt-1">
              To prevent your clinic's WhatsApp number from being blocked or banned by Meta, <strong>only send announcements to patients who have explicitly opted in</strong>. Sending promotional spam to cold contacts violates WhatsApp's anti-spam policy.
            </p>
          </div>
        </div>
      </div>

      {/* Create Campaign Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Create Announcement</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Announcement Name</label>
              <input
                id="campaign-name-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Monthly Checkup Reminder"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message Template</label>
              <textarea
                id="campaign-message-input"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Hi {{firstName}}, it's time for your checkup..."
                rows={4}
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Use <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">{"{{firstName}}"}</code> to personalize messages.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Segment Type</label>
                <Select
                  value={form.segmentType}
                  onValueChange={(v) => setForm({ ...form, segmentType: v })}
                >
                  <SelectTrigger
                    id="segment-type-select"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition h-auto"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    <SelectItem value="tag">By Tag</SelectItem>
                    <SelectItem value="last_visit_before">Last Visit Before (months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.segmentType !== "all" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Value</label>
                  <input
                    id="segment-value-input"
                    value={form.segmentValue}
                    onChange={(e) => setForm({ ...form, segmentValue: e.target.value })}
                    placeholder={form.segmentType === "tag" ? "e.g. diabetic" : "e.g. 6"}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                id="save-campaign-btn"
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {loading ? "Saving…" : "Save Campaign"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">All Campaigns</h2>
            <p className="text-xs text-gray-500">
              {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Megaphone className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">No campaigns yet</p>
            <p className="text-xs text-gray-400 mb-5">Create your first campaign to reach patients at scale</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create your first campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Segment
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{c.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span>
                          {c.segmentType === "all"
                            ? "All Patients"
                            : `${c.segmentType}: ${c.segmentValue}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.status === "DRAFT" && (
                        <button
                          id={`send-campaign-${c.id}`}
                          onClick={() => handleSend(c.id)}
                          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send Now
                        </button>
                      )}
                      {c.status === "SENT" && (
                        <div className="flex items-center justify-end gap-1 text-green-600 text-xs font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          Delivered
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}