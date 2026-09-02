"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronRight,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Building2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface AdminTicket {
  id: string;
  ticketNumber: string;
  doctorId: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_ON_DOCTOR" | "RESOLVED" | "CLOSED";
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  doctor: {
    id: string;
    name: string;
    clinicName: string | null;
    email: string;
    phone: string | null;
    package?: { name: string } | null;
  };
  messages: Array<{
    id: string;
    senderType: string;
    senderName: string;
    senderEmail: string;
    message: string;
    createdAt: string;
  }>;
}

export default function AdminTicketsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [counts, setCounts] = useState({ all: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);

  // Reply State
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState<"IN_PROGRESS" | "RESOLVED">("IN_PROGRESS");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const url = statusFilter === "ALL" ? "/api/admin/support/tickets" : `/api/admin/support/tickets?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.counts) setCounts(data.counts);
        if (selectedTicket) {
          const updated = (data.tickets || []).find((t: AdminTicket) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load admin tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim(), status: replyStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reply.");

      toast({
        title: "Reply Dispatched",
        description: `Message sent and doctor notified at ${selectedTicket.doctor.email}.`,
      });

      setReplyText("");
      fetchTickets();
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

  const handleQuickStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast({ title: "Status Updated", description: `Ticket marked as ${newStatus}.` });
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticketNumber.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.doctor.name.toLowerCase().includes(q) ||
      t.doctor.email.toLowerCase().includes(q) ||
      (t.doctor.clinicName && t.doctor.clinicName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-7 h-7 text-indigo-600" /> Clinic Support Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage incoming doctor inquiries, troubleshoot clinic issues, and dispatch instant email resolutions.
          </p>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "ALL" ? "bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500 shadow-xs" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-bold text-slate-500 uppercase">All Tickets</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{counts.all}</p>
        </button>

        <button
          onClick={() => setStatusFilter("OPEN")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "OPEN" ? "bg-amber-50/80 border-amber-500 ring-1 ring-amber-500 shadow-xs" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-bold text-amber-600 uppercase">Open / New</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{counts.open}</p>
        </button>

        <button
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "IN_PROGRESS" ? "bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 shadow-xs" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-bold text-blue-600 uppercase">In Progress</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{counts.inProgress}</p>
        </button>

        <button
          onClick={() => setStatusFilter("RESOLVED")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "RESOLVED" ? "bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500 shadow-xs" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-bold text-emerald-600 uppercase">Resolved</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{counts.resolved}</p>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search by ticket #, doctor name, clinic, email, or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-xs bg-white"
        />
      </div>

      {/* Ticket List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            Loading support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No support tickets match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
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
                  className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
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
                      <span className="text-xs font-semibold text-slate-700">
                        {ticket.doctor.name} ({ticket.doctor.clinicName || "Clinic"})
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

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right text-[11px] text-slate-500 hidden sm:block">
                      <p className="font-medium text-slate-700">{ticket.doctor.email}</p>
                      <p>{ticket.doctor.phone || "No phone"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Ticket Details & Admin Reply ─────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white shrink-0 flex items-start justify-between">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded">
                    #{selectedTicket.ticketNumber}
                  </span>
                  <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold">
                    {selectedTicket.status}
                  </Badge>
                  <Badge className="bg-amber-500/30 text-amber-200 border-0 text-[10px] font-bold">
                    {selectedTicket.priority} Priority
                  </Badge>
                </div>
                <h2 className="text-base font-bold truncate leading-snug">{selectedTicket.subject}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Doctor: {selectedTicket.doctor.name} &bull; {selectedTicket.doctor.email} &bull; {selectedTicket.doctor.phone || "N/A"}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Quick Change Status:</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedTicket.status === "OPEN" ? "default" : "outline"}
                  onClick={() => handleQuickStatusChange(selectedTicket.id, "OPEN")}
                  className="text-[11px] h-7"
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant={selectedTicket.status === "IN_PROGRESS" ? "default" : "outline"}
                  onClick={() => handleQuickStatusChange(selectedTicket.id, "IN_PROGRESS")}
                  className="text-[11px] h-7"
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant={selectedTicket.status === "RESOLVED" ? "default" : "outline"}
                  onClick={() => handleQuickStatusChange(selectedTicket.id, "RESOLVED")}
                  className="text-[11px] h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Mark Resolved
                </Button>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {selectedTicket.messages.map((msg) => {
                const isSupport = msg.senderType === "SUPPORT_ADMIN";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSupport ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1">
                      <span>{isSupport ? "🛡️ Gyrex Support (You)" : `Dr. ${msg.senderName}`}</span>
                      <span>&bull;</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                        isSupport
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Reply & Email Doctor:</span>
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-slate-500 font-medium">After reply set to:</label>
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value as any)}
                    className="text-xs border rounded-md px-2 py-1 bg-slate-50 font-bold text-slate-700"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type official response (this will be emailed directly to the doctor)..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  className="flex-1 text-xs resize-none font-medium"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sendingReply}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-auto py-3 px-5 shrink-0"
                >
                  <Send className="w-4 h-4 mr-1.5" /> {sendingReply ? "Sending..." : "Send & Email"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
