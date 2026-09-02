"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  RefreshCw,
  HelpCircle,
  Smartphone,
  Calendar,
  Star,
  FileText,
  Globe,
  Settings,
  X,
  ChevronRight,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface SupportMessage {
  id: string;
  senderType: "DOCTOR" | "SUPPORT_ADMIN";
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_ON_DOCTOR" | "RESOLVED" | "CLOSED";
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

const CATEGORIES = [
  { id: "WHATSAPP_AI", label: "WhatsApp AI & Receptionist", icon: Smartphone, desc: "QR scan, message delays, prompt customization" },
  { id: "APPOINTMENTS", label: "Appointments & Calendar", icon: Calendar, desc: "Booking conflicts, doctor schedule, timings" },
  { id: "GOOGLE_BUSINESS_SEO", label: "Google Business & Local SEO", icon: Star, desc: "Post publishing, Google reviews, keyword rank" },
  { id: "BILLING", label: "Billing & Subscription", icon: FileText, desc: "Invoices, renewals, plan upgrades, payments" },
  { id: "WEBSITE", label: "Clinic Website & Domains", icon: Globe, desc: "Custom domain SSL, landing page edits, forms" },
  { id: "OTHER", label: "General & Technical Support", icon: Settings, desc: "Login, team access, feature requests" },
];

export default function SupportPage() {
  const { toast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // New Ticket Modal State
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [priority, setPriority] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Message Reply State
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/support/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (selectedTicket) {
          const updated = (data.tickets || []).find((t: SupportTicket) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast({
        title: "Missing details",
        description: "Please enter a subject and detailed description of the problem.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, priority, subject, description }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ticket.");

      toast({
        title: "🎫 Ticket Raised Successfully!",
        description: `Ticket #${data.ticket.ticketNumber} logged. Our team has been notified via email.`,
      });

      setIsNewTicketOpen(false);
      setSubject("");
      setDescription("");
      setCategory(CATEGORIES[0].id);
      setPriority("MEDIUM");
      fetchTickets();
    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err.message || "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reply.");

      setReplyText("");
      fetchTickets();
      toast({
        title: "Reply Sent",
        description: "Your follow-up has been added to the ticket.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send reply.",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  };

  const openCount = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30 text-xs px-3 py-1 font-semibold mb-3">
            <Headphones className="w-3.5 h-3.5 mr-1.5 inline" /> Priority Clinic Support
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Doctor Help & Support Center
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Need assistance with WhatsApp AI Receptionist, Google Business Profile, Appointments, or Billing? Raise a ticket and our technical team will resolve it swiftly.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Button
            onClick={() => setIsNewTicketOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Raise Support Ticket
          </Button>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Summary Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tickets</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{tickets.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Active / In Progress</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{openCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Resolved Tickets</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{resolvedCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Main Tickets View ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Support Tickets</h2>
            <p className="text-xs text-slate-500">Track real-time status and converse with support engineers</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
            disabled={loading}
            className="text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            Loading your support history...
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto px-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <LifeBuoy className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Support Tickets Yet</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Everything looks smooth! If you ever face an issue or need assistance with clinic features, click &quot;Raise Support Ticket&quot; above.
            </p>
            <Button
              onClick={() => setIsNewTicketOpen(true)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Create First Ticket
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => {
              const statusBadge =
                ticket.status === "OPEN"
                  ? { label: "Open", color: "bg-amber-100 text-amber-800 border-amber-200" }
                  : ticket.status === "IN_PROGRESS"
                  ? { label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200" }
                  : { label: "Resolved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };

              const priorityBadge =
                ticket.priority === "URGENT"
                  ? { label: "Urgent", color: "text-rose-600 bg-rose-50 border-rose-200" }
                  : ticket.priority === "HIGH"
                  ? { label: "High", color: "text-amber-600 bg-amber-50 border-amber-200" }
                  : { label: "Medium", color: "text-slate-600 bg-slate-50 border-slate-200" };

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        #{ticket.ticketNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge.color}`}>
                        {priorityBadge.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ticket.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {ticket.subject}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-slate-400 group-hover:text-slate-700 text-xs font-semibold">
                    <span>{ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Raise New Ticket ────────────────────────────────── */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Raise Support Ticket</h2>
                <p className="text-xs text-slate-400 mt-0.5">Dispatches an instant email to the Gyrex engineering team</p>
              </div>
              <button
                onClick={() => setIsNewTicketOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Issue Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500 text-indigo-950 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{cat.label}</div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{cat.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Urgency / Priority
                </label>
                <div className="flex gap-2">
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        priority === p
                          ? p === "URGENT"
                            ? "bg-rose-500 text-white border-rose-600"
                            : p === "HIGH"
                            ? "bg-amber-500 text-white border-amber-600"
                            : "bg-indigo-600 text-white border-indigo-700"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Subject / Short Summary
                </label>
                <Input
                  placeholder="e.g. WhatsApp QR not refreshing or Google post not syncing"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="text-xs font-medium"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Detailed Explanation
                </label>
                <Textarea
                  placeholder="Please describe what happened, any error message you saw, and what steps we can take to assist you..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="text-xs font-medium resize-none"
                  required
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  {submitting ? "Dispatching..." : "Submit Support Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View Ticket & Conversational Thread ─────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white shrink-0 flex items-start justify-between">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded">
                    #{selectedTicket.ticketNumber}
                  </span>
                  <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold">
                    {selectedTicket.status}
                  </Badge>
                </div>
                <h2 className="text-base font-bold truncate leading-snug">{selectedTicket.subject}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Category: {selectedTicket.category}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {selectedTicket.messages.map((msg) => {
                const isSupport = msg.senderType === "SUPPORT_ADMIN";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSupport ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1">
                      <span>{isSupport ? "🛡️ Gyrex Support Team" : `Dr. ${msg.senderName}`}</span>
                      <span>&bull;</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                        isSupport
                          ? "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                          : "bg-indigo-600 text-white rounded-tr-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type your reply or additional details..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  className="flex-1 text-xs resize-none font-medium"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sendingReply}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-auto py-3 px-4 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
