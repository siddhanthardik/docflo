"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocationContext } from "@/contexts/LocationContext";
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
  User,
  ArrowUpRight,
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
  {
    id: "WHATSAPP_AI",
    label: "WhatsApp AI & Bot",
    icon: Smartphone,
    desc: "QR connection, delays, message prompts",
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    id: "APPOINTMENTS",
    label: "Appointments & OPD",
    icon: Calendar,
    desc: "Schedules, slots, booking conflicts",
    color: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    id: "GOOGLE_BUSINESS_SEO",
    label: "Google Profile & SEO",
    icon: Star,
    desc: "Hours sync, rankings, reviews",
    color: "text-amber-600 bg-amber-50 border-amber-100",
  },
  {
    id: "BILLING",
    label: "Billing & Plans",
    icon: FileText,
    desc: "Subscription, invoices, payment receipts",
    color: "text-purple-600 bg-purple-50 border-purple-100",
  },
  {
    id: "WEBSITE",
    label: "Clinic Website",
    icon: Globe,
    desc: "Domain SSL, website content, forms",
    color: "text-indigo-600 bg-indigo-50 border-indigo-100",
  },
  {
    id: "OTHER",
    label: "Technical Assistance",
    icon: Settings,
    desc: "Staff login, account access, general help",
    color: "text-slate-600 bg-slate-50 border-slate-100",
  },
];

export default function SupportPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const { activeLocation } = useLocationContext();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");
  const [supportNumber, setSupportNumber] = useState("919717228528");

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

  // Load configured platform support WhatsApp number
  useEffect(() => {
    async function loadSupportNumber() {
      try {
        const res = await fetch("/api/platform/whatsapp-number");
        if (res.ok) {
          const data = await res.json();
          if (data.whatsappNumber) setSupportNumber(data.whatsappNumber);
        }
      } catch (e) {
        // Fallback already set
      }
    }
    loadSupportNumber();
  }, []);

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

  const handleOpenWhatsAppSupport = () => {
    const cleanNumber = supportNumber.replace(/[^\d]/g, "");
    const doctorName = session?.user?.name || "Doctor";
    const clinicName = activeLocation?.locationName || "My Clinic";
    const prefilledText = `Hi Gyrex Support Team, I am ${doctorName} from ${clinicName}. I need quick assistance with my clinic platform.`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(prefilledText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
        title: "🎫 Ticket Raised Successfully",
        description: `Ticket #${data.ticket.ticketNumber} logged. Our technical team has been notified.`,
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

  const filteredTickets = tickets.filter((ticket) => {
    if (activeTab === "ACTIVE") return ticket.status === "OPEN" || ticket.status === "IN_PROGRESS";
    if (activeTab === "RESOLVED") return ticket.status === "RESOLVED" || ticket.status === "CLOSED";
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ── App Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gyrex Support Desk Online
            </span>
            <span className="text-xs text-slate-400 font-medium">Fast Doctor Assistance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Help & Clinic Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quick assistance for your clinic OPD, WhatsApp AI Receptionist, and listings.
          </p>
        </div>

        <Button
          onClick={() => setIsNewTicketOpen(true)}
          className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Raise Support Ticket
        </Button>
      </div>

      {/* ── 1-Tap Fast Help Channels (Native App Theme Cards) ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* WhatsApp Direct Doctor Support Card */}
        <button
          type="button"
          onClick={handleOpenWhatsAppSupport}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-left flex items-start justify-between group cursor-pointer"
        >
          <div className="space-y-1.5 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white mb-2">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <h3 className="text-sm sm:text-base font-bold leading-tight">Chat on WhatsApp</h3>
            <p className="text-xs text-emerald-100 leading-snug">
              Direct priority chat with technical engineers.
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 mt-1" />
        </button>

        {/* Doctor Helpline Card */}
        <a
          href={`tel:+${supportNumber.replace(/\D/g, "")}`}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-left flex items-start justify-between group cursor-pointer"
        >
          <div className="space-y-1.5 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">Doctor Helpline</h3>
            <p className="text-xs text-slate-500 leading-snug">
              Instant voice call for urgent OPD queries.
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 mt-1" />
        </a>

        {/* Create Tracked Ticket Card */}
        <button
          type="button"
          onClick={() => setIsNewTicketOpen(true)}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-left flex items-start justify-between group cursor-pointer"
        >
          <div className="space-y-1.5 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">Tracked Ticket</h3>
            <p className="text-xs text-slate-500 leading-snug">
              Log technical issue with ticket ID & email trail.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
        </button>
      </div>

      {/* ── Segmented Control Filter Tabs (App Theme) ───────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Tickets <span className="ml-1 text-[11px] font-semibold text-slate-400">({tickets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ACTIVE"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active <span className="ml-1 text-[11px] font-semibold text-amber-600">({openCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("RESOLVED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "RESOLVED"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Resolved <span className="ml-1 text-[11px] font-semibold text-emerald-600">({resolvedCount})</span>
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchTickets}
          disabled={loading}
          className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* ── App-Themed Support Tickets Feed ─────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            Loading your support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <LifeBuoy className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeTab === "ACTIVE"
                ? "No Active Tickets"
                : activeTab === "RESOLVED"
                ? "No Resolved Tickets"
                : "No Support Tickets Yet"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {activeTab === "ACTIVE"
                ? "All your support inquiries have been resolved. Need something new?"
                : "Need help with appointments, billing, or WhatsApp bot? Raise a ticket and we'll resolve it swiftly."}
            </p>
            <Button
              onClick={() => setIsNewTicketOpen(true)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-9 px-4"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Raise New Ticket
            </Button>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const cat = CATEGORIES.find((c) => c.id === ticket.category) || CATEGORIES[5];
            const Icon = cat.icon;

            const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
            const isInProgress = ticket.status === "IN_PROGRESS";

            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer space-y-3 active:scale-[0.995] group"
              >
                {/* Card Top: Category Icon + Ticket Number + Status Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      #{ticket.ticketNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 truncate hidden sm:inline">
                      {cat.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isResolved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isInProgress
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isResolved ? "bg-emerald-500" : isInProgress ? "bg-blue-500 animate-pulse" : "bg-amber-500"
                        }`}
                      />
                      {isResolved ? "Resolved" : isInProgress ? "In Progress" : "Open"}
                    </span>

                    {ticket.priority === "URGENT" && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Middle: Subject & Description */}
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                    {ticket.subject}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                    {ticket.description}
                  </p>
                </div>

                {/* Card Bottom: Messages & Timestamp */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">
                      {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── App-Themed Modal: Raise Support Ticket ───────────────────── */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-[calc(100vw-1.5rem)] sm:w-full max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Pinned Modal Header */}
            <div className="shrink-0 bg-slate-900 px-5 py-4 sm:px-6 sm:py-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight">Raise Support Ticket</h2>
                  <p className="text-xs text-slate-400">Logged directly to Gyrex Engineering</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form
              id="new-ticket-form"
              onSubmit={handleCreateTicket}
              className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4"
            >
              {/* Category Selector Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Select Issue Category
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
                            ? "bg-indigo-50/90 border-indigo-500 ring-1 ring-indigo-500 text-indigo-950 shadow-xs"
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

              {/* Priority Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Urgency
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Subject / Summary
                </label>
                <Input
                  placeholder="e.g. WhatsApp QR not refreshing or calendar slots missing"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-10 text-xs sm:text-sm font-medium rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Detailed Explanation
                </label>
                <Textarea
                  placeholder="Please describe what happened, patient or doctor details, and any error message you saw..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="text-xs sm:text-sm font-medium resize-none rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>
            </form>

            {/* Pinned Footer Actions */}
            <div className="shrink-0 px-5 py-3.5 sm:px-6 bg-slate-50/95 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewTicketOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="new-ticket-form"
                disabled={submitting}
                className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                {submitting ? "Dispatching..." : "Submit Ticket"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── App-Themed Modal: View Ticket & Interactive Chat Thread ───── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 px-5 py-4 sm:px-6 sm:py-5 text-white shrink-0 flex items-start justify-between border-b border-slate-800">
              <div className="min-w-0 pr-4 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-md">
                    #{selectedTicket.ticketNumber}
                  </span>
                  <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold">
                    {selectedTicket.status}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">
                    {CATEGORIES.find((c) => c.id === selectedTicket.category)?.label || selectedTicket.category}
                  </span>
                </div>
                <h2 className="text-base font-bold truncate leading-snug">{selectedTicket.subject}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Messages (Chat Bubble Theme) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/60">
              {selectedTicket.messages.map((msg) => {
                const isSupport = msg.senderType === "SUPPORT_ADMIN";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSupport ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1 px-1">
                      {isSupport ? (
                        <span className="flex items-center gap-1 text-indigo-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Gyrex Support Engineer
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-600">
                          <User className="w-3.5 h-3.5 text-slate-400" /> Dr. {msg.senderName}
                        </span>
                      )}
                      <span>&bull;</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                        isSupport
                          ? "bg-white text-slate-800 rounded-tl-none border border-slate-200/90"
                          : "bg-indigo-600 text-white rounded-tr-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-medium">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Bar (Pinned at Bottom) */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shrink-0">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type your reply to the engineering team..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  className="flex-1 text-xs resize-none font-medium rounded-xl border-slate-200 focus:border-indigo-500"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sendingReply}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-auto py-3 px-4 rounded-xl shrink-0"
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
