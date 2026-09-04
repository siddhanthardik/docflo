"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Calendar, MessageSquare, Megaphone, TrendingUp, Power, Settings, RefreshCcw, ShieldAlert, Key, Sliders, CheckCircle2, PhoneCall, Copy, Check, Zap, Sparkles, Stethoscope, Clock, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function AIAgentsHubPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeAgent, setActiveAgent] = useState<any>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState<any>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [correctedReplyDraft, setCorrectedReplyDraft] = useState("");
  const [customRuleDraft, setCustomRuleDraft] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleFeedback = async (log: any, status: "APPROVED" | "CORRECTED") => {
    try {
      setSubmittingFeedback(true);
      const res = await fetch("/api/ai-agents/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: log.conversationId,
          messageId: log.id,
          patientMessage: log.patientMessage,
          aiResponse: log.aiResponse,
          status,
          correctedReply: status === "CORRECTED" ? correctedReplyDraft : null,
          customRuleAdded: status === "CORRECTED" ? customRuleDraft : null,
        }),
      });

      if (res.ok) {
        toast({
          title: status === "APPROVED" ? "Verified Golden Response! 👍" : "AI Retrained Successfully! 🚀",
          description: status === "APPROVED" ? "Response marked as golden training data." : "Custom rule added and deployed to AI agent."
        });
        setActiveFeedbackId(null);
        setCorrectedReplyDraft("");
        setCustomRuleDraft("");
        fetchLogs();
        fetchAgents();
      }
    } catch (e) {
      toast({ title: "Failed to submit feedback", variant: "destructive" });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai-agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load agents", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch("/api/ai-agents/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchLogs();
  }, []);

  const toggleAgent = async (agentType: string, currentStatus: boolean, isAllowed: boolean, requiredPackage: string) => {
    if (!isAllowed) {
      toast({
        title: "🔒 Package Upgrade Required",
        description: `The ${agentType === "APPOINTMENT" ? "AI Receptionist & Booking Assistant" : "selected AI agent"} is available in the ${requiredPackage} package.`,
        variant: "destructive"
      });
      router.push("/subscription");
      return;
    }

    const newStatus = !currentStatus;
    setAgents(agents.map(a => a.agentType === agentType ? { ...a, enabled: newStatus } : a));
    
    try {
      const res = await fetch("/api/ai-agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType, enabled: newStatus }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Update failed");
      }
      toast({ title: newStatus ? "AI Agent Activated 🚀" : "AI Agent Paused" });
    } catch (error: any) {
      setAgents(agents.map(a => a.agentType === agentType ? { ...a, enabled: currentStatus } : a));
      toast({ title: error.message || "Failed to update agent status", variant: "destructive" });
    }
  };

  const openConfig = (agent: any) => {
    if (agent.isAllowed === false) {
      toast({
        title: "🔒 Package Upgrade Required",
        description: `Please upgrade to the ${agent.requiredPackage || "Premium"} package to configure and train this AI agent.`,
        variant: "destructive"
      });
      router.push("/subscription");
      return;
    }
    setActiveAgent(agent);
    setConfigDraft(agent.config || {});
    setIsConfigOpen(true);
  };

  const saveConfig = async () => {
    if (!activeAgent) return;
    setSavingConfig(true);
    try {
      const res = await fetch("/api/ai-agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType: activeAgent.agentType, config: configDraft }),
      });
      if (res.ok) {
        toast({ title: "Agent Training & Config Saved! ✨", description: "Updated prompt instructions deployed to AI engine." });
        setAgents(agents.map(a => a.agentType === activeAgent.agentType ? { ...a, config: configDraft } : a));
        setIsConfigOpen(false);
      } else {
        throw new Error("Save failed");
      }
    } catch (error) {
      toast({ title: "Failed to save configuration", variant: "destructive" });
    } finally {
      setSavingConfig(false);
    }
  };

  const agentDefinitions = [
    {
      type: "APPOINTMENT",
      name: "AI Receptionist & Booking Assistant",
      icon: PhoneCall,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
      desc: (
        <>
          Connects to your WhatsApp to handle patient inquiries 24/7.{" "}
          <strong className="text-indigo-600 font-semibold">Internal Mode:</strong> Doctors can also text the AI directly to instantly book, update, or cancel calendar slots on the go.
        </>
      ),
      metrics: "24/7 Live WhatsApp",
    },
    {
      type: "REVIEW",
      name: "Review Manager Assistant",
      icon: MessageSquare,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
      desc: "Analyzes incoming Google Business Profile reviews and drafts HIPAA-compliant, keyword-rich responses to boost Google Maps rankings.",
      metrics: "Auto-Drafting Reviews",
    },
    {
      type: "POST_CREATION",
      name: "AI Content & Post Creator",
      icon: Megaphone,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-100",
      desc: "Generates engaging Google Business Profile updates and patient education content tailored specifically for your clinic practice.",
      metrics: "Profile Updates",
    },
    {
      type: "LOCAL_SEO_COPILOT",
      name: "Local SEO Optimizer",
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
      desc: "Conducts weekly local search audits and generates prioritized 1-click execution tasks to help your clinic outrank nearby competitors.",
      metrics: "Weekly Rank Audit",
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin text-indigo-600"><RefreshCcw className="h-8 w-8" /></div>
      </div>
    );
  }

  return (
    <div className="pb-12 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Practice Assistants & Automation
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mt-0.5">
              Set up smart digital assistants to handle patient inquiries on WhatsApp, respond to Google reviews, and manage local search visibility.
            </p>
          </div>
        </div>
      </div>

      {/* 2x2 Agents Grid (2 Rows & 2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agentDefinitions.map((def) => {
          const agentData = agents.find(a => a.agentType === def.type) || { enabled: false, config: {}, isAllowed: false, requiredPackage: "PREMIUM" };
          const Icon = def.icon;
          const isAllowed = agentData.isAllowed ?? false;
          
          return (
            <div 
              key={def.type} 
              className={`bg-white rounded-2xl border ${!isAllowed ? 'border-amber-200/80 bg-amber-50/20' : agentData.enabled ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200/80 shadow-2xs'} overflow-hidden transition-all duration-300 flex flex-col justify-between relative`}
            >
              {!isAllowed && (
                <div className="bg-amber-50 border-b border-amber-200/80 text-amber-900 text-xs font-bold px-4 py-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs">🔒 Requires {(agentData.requiredPackage || "PREMIUM").replace(/\s*\/\s*AUTOPILOT/i, "").trim()}</span>
                  <button onClick={() => router.push("/subscription")} className="text-xs text-amber-900 font-black underline hover:text-amber-700">
                    Upgrade Package
                  </button>
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${def.bg} shrink-0`}>
                      <Icon className={`h-5.5 w-5.5 ${def.color}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{def.name}</h3>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{def.metrics}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shrink-0">
                    <span className={`text-xs font-bold ${!isAllowed ? 'text-amber-700' : agentData.enabled ? "text-emerald-700" : "text-slate-400"}`}>
                      {!isAllowed ? "LOCKED" : agentData.enabled ? "ACTIVE" : "PAUSED"}
                    </span>
                    <Switch 
                      checked={agentData.enabled && isAllowed}
                      onCheckedChange={() => toggleAgent(def.type, agentData.enabled, isAllowed, agentData.requiredPackage)}
                      className="data-[state=checked]:bg-emerald-500 scale-90"
                    />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[52px]">
                  {def.desc}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-indigo-100">
                    <Power className="h-3.5 w-3.5 text-indigo-500" /> {def.metrics}
                  </span>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openConfig({ ...agentData, ...def })}
                    className={`gap-1.5 text-xs font-bold ${!isAllowed ? 'text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100' : 'text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200'}`}
                  >
                    <Settings className="h-3.5 w-3.5" /> {!isAllowed ? "Upgrade to Unlock" : "Configure & Train"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Patient Conversation Log */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Live Patient Conversation Log
            </h3>
            <p className="text-xs text-slate-500">Inspect real-time patient messages and automated replies to maintain high patient care standards.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLogs} 
            disabled={loadingLogs}
            className="text-xs font-bold gap-2"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No active AI assistant messages logged yet.</p>
            <p className="text-[11px] text-slate-400">Incoming WhatsApp patient queries will be logged here in real time for audit & prompt tuning.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {logs.map((log) => {
              const isApproved = log.feedbackStatus === "APPROVED";
              const isCorrected = log.feedbackStatus === "CORRECTED";
              const isEditing = activeFeedbackId === log.id;

              return (
                <div key={log.id} className={`p-4 rounded-2xl border transition-all ${
                  isApproved ? "border-emerald-200 bg-emerald-50/20" :
                  isCorrected ? "border-purple-200 bg-purple-50/20" :
                  "border-slate-200/70 bg-slate-50/50"
                } space-y-3 text-xs`}>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="font-bold text-slate-800">
                        {log.patientName} {log.patientPhone ? `(${log.patientPhone})` : ""}
                      </span>
                      {isApproved && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Golden Response
                        </span>
                      )}
                      {isCorrected && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-purple-600" /> Custom Rule Applied
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient Incoming Message:</p>
                      <p className="text-slate-800 font-medium whitespace-pre-wrap">"{log.patientMessage}"</p>
                    </div>

                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                      <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                        Automated Reply:
                      </p>
                      <p className="text-slate-900 font-medium whitespace-pre-wrap">{log.aiResponse}</p>
                    </div>
                  </div>

                  {/* Feedback & Retraining Action Bar */}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isApproved ? "default" : "outline"}
                        size="sm"
                        disabled={submittingFeedback}
                        onClick={() => handleFeedback(log, "APPROVED")}
                        className={`text-xs font-bold gap-1.5 h-8 ${isApproved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isApproved ? "Approved Response" : "👍 Approve Response"}
                      </Button>

                      <Button
                        type="button"
                        variant={isEditing ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isEditing) {
                            setActiveFeedbackId(null);
                          } else {
                            setActiveFeedbackId(log.id);
                            setCorrectedReplyDraft(log.correctedReply || "");
                            setCustomRuleDraft(log.customRuleAdded || "");
                          }
                        }}
                        className={`text-xs font-bold gap-1.5 h-8 ${isEditing ? "bg-purple-600 text-white" : "border-purple-200 text-purple-700 hover:bg-purple-50"}`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        {isEditing ? "Cancel Retraining" : "👎 Modify & Update"}
                      </Button>
                    </div>
                  </div>

                  {/* Inline AI Retraining Drawer */}
                  {isEditing && (
                    <div className="p-4 bg-white rounded-2xl border border-purple-200 space-y-3 mt-2">
                      <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-purple-600" />
                        Update Instructions for Future Patient Queries
                      </h4>

                      <div className="space-y-2">
                        <Label className="text-[11px] font-semibold text-slate-700">What should the assistant have replied instead?</Label>
                        <Textarea
                          placeholder="e.g., Namaste! Dr. Sharma ke paas kal evening OPD mein slots available hain..."
                          value={correctedReplyDraft}
                          onChange={(e) => setCorrectedReplyDraft(e.target.value)}
                          className="text-xs bg-slate-50 resize-none"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] font-semibold text-slate-700">Add a Custom Instruction / Rule</Label>
                        <Input
                          placeholder="e.g., Always ask patient temperature before confirming fever appointment"
                          value={customRuleDraft}
                          onChange={(e) => setCustomRuleDraft(e.target.value)}
                          className="text-xs bg-slate-50"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveFeedbackId(null)}
                          className="text-xs font-bold"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={submittingFeedback}
                          onClick={() => handleFeedback(log, "CORRECTED")}
                          className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Save Instructions
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deep Agent Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[760px] max-h-[92dvh] sm:max-h-[85vh] p-0 gap-0 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl flex flex-col bg-slate-50 overflow-hidden my-auto">
          <DialogHeader className="p-3.5 sm:p-5 border-b border-slate-200/80 bg-white sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100/80 shrink-0">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-sm sm:text-lg font-bold text-slate-900 leading-snug truncate">
                  Configure Agent: {activeAgent?.name}
                </DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-normal line-clamp-1 sm:line-clamp-none">
                  Pre-trained out-of-the-box. Customize optional clinic guidelines, triggers, and operational rules below.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 p-3.5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto bg-slate-50/70 min-h-0">
            {/* 1. WHATSAPP BOOKING AGENT CONFIG */}
            {activeAgent?.type === "APPOINTMENT" && (
              <>
                {/* ℹ️ Centralized Schedule & Profile Sync Notice Banner */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-purple-50/50 rounded-2xl border border-indigo-100/90 shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        OPD Shifts, Fees & AI Capacity Unified
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                        OPD shifts, consultation fees, and AI slot pacing are now centrally managed in Doctor Profiles and Clinic Settings to eliminate duplicate entries and sync across your clinic.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsConfigOpen(false);
                        router.push("/settings/practitioners");
                      }}
                      className="h-8 text-xs font-semibold bg-white hover:bg-slate-50 text-indigo-700 border-indigo-200 shadow-xs flex items-center gap-1.5"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                      Manage Doctor OPD & Fees
                      <ArrowUpRight className="w-3 h-3 text-slate-400" />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsConfigOpen(false);
                        router.push("/settings/clinic");
                      }}
                      className="h-8 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Clinic Hours & Google Sync
                      <ArrowUpRight className="w-3 h-3 text-slate-400" />
                    </Button>
                  </div>
                </div>

                {/* 🤖 1. RECEPTIONIST IDENTITY & PERSONA */}
                <div className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-600 shrink-0" />
                      1. Receptionist Identity & Persona
                    </h4>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      Human Conversational Tone
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-xs font-semibold text-slate-700">Assistant Name</Label>
                      <Input 
                        placeholder="e.g., Riya"
                        value={configDraft.assistantName || ""}
                        onChange={(e) => setConfigDraft({...configDraft, assistantName: e.target.value})}
                        className="h-10 text-xs sm:text-sm bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <p className="text-[10px] text-slate-400">The friendly name your AI receptionist introduces herself as on WhatsApp.</p>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-xs font-semibold text-slate-700">Language Style</Label>
                      <Select 
                        value={configDraft.languagePref || "auto"} 
                        onValueChange={(v) => setConfigDraft({...configDraft, languagePref: v})}
                      >
                        <SelectTrigger className="h-10 bg-white text-xs sm:text-sm border-slate-200 w-full min-w-0">
                          <SelectValue className="truncate" />
                        </SelectTrigger>
                        <SelectContent className="max-w-[calc(100vw-2rem)]">
                          <SelectItem value="auto">Auto-Detect & Match Patient Language (Recommended)</SelectItem>
                          <SelectItem value="hinglish">Natural Indian Hinglish (Namaste / Ji)</SelectItem>
                          <SelectItem value="english">Polite & Warm English</SelectItem>
                          <SelectItem value="hindi">Pure Polite Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-400">Mirrors patient tone while keeping communication polite and medical-grade.</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-semibold text-slate-700">Target Patient Demographics</Label>
                    <Select 
                      value={configDraft.targetDemographics || "all"} 
                      onValueChange={(v) => setConfigDraft({...configDraft, targetDemographics: v})}
                    >
                      <SelectTrigger className="h-10 bg-white text-xs sm:text-sm border-slate-200 w-full min-w-0">
                        <SelectValue className="truncate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Age Groups (General Practice / Polyclinic)</SelectItem>
                        <SelectItem value="pediatric">Pediatric Care Only (0–18 Years)</SelectItem>
                        <SelectItem value="adult">Adult & Geriatric Care (18+ Years)</SelectItem>
                        <SelectItem value="women">Women's Health & Gynae Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400">Helps AI decline mismatched patient demographics politely with gentle referral guidance.</p>
                  </div>
                </div>

                {/* 🌐 2. TELE-CONSULTATION & VIRTUAL CARE */}
                <div className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-w-0">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                        2. Tele-Consultation & Online Video Care
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500">Enable if the doctor offers private online video consultations in addition to in-person clinic visits.</p>
                    </div>
                    <Switch
                      checked={!!configDraft.allowTeleConsultation}
                      onCheckedChange={(checked) => setConfigDraft({ ...configDraft, allowTeleConsultation: checked })}
                      className="shrink-0 mt-0.5 sm:mt-0"
                    />
                  </div>

                  {configDraft.allowTeleConsultation ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1.5 min-w-0">
                        <Label className="text-xs font-semibold text-slate-700">Online Consultation Fee</Label>
                        <Input 
                          placeholder="e.g., ₹700"
                          value={configDraft.teleConsultationFee || ""}
                          onChange={(e) => setConfigDraft({...configDraft, teleConsultationFee: e.target.value})}
                          className="h-10 text-xs sm:text-sm bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <p className="text-[10px] sm:text-[11px] text-slate-400">Shared when patients book private video consultations.</p>
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <Label className="text-xs font-semibold text-slate-700">Tele-Consultation Timing / Note</Label>
                        <Input 
                          placeholder="e.g., Daily 2:00 PM - 4:00 PM (or After OPD)"
                          value={configDraft.teleConsultationHours || ""}
                          onChange={(e) => setConfigDraft({...configDraft, teleConsultationHours: e.target.value})}
                          className="h-10 text-xs sm:text-sm bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <p className="text-[10px] sm:text-[11px] text-slate-400">Available hours for video appointments.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] sm:text-xs"><strong>In-Clinic Only Mode Active</strong>: The AI Receptionist will inform patients that consultations are strictly in-person at the clinic and will decline online calls or remote prescriptions.</span>
                    </div>
                  )}
                </div>

                {/* 💉 3. SERVICES & VACCINATION CATALOG */}
                <div className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    3. Services & Treatment Catalog
                  </h4>

                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-semibold text-slate-700">Services & Treatments Offered</Label>
                    <Input 
                      placeholder="General OPD Consultation, Growth Tracking, Nebulization, In-clinic Procedures"
                      value={configDraft.servicesOffered || ""}
                      onChange={(e) => setConfigDraft({...configDraft, servicesOffered: e.target.value})}
                      className="h-10 text-xs sm:text-sm bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <p className="text-[10px] text-slate-400">Helps AI answer "Do you treat X?" questions accurately based on your actual clinical offerings.</p>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-semibold text-slate-700">Available Vaccinations (Pediatricians Only)</Label>
                    <Input 
                      placeholder="BCG, Polio, Hepatitis B, Rotavirus, DTP, MMR, Flu Shot"
                      value={configDraft.vaccinationsList || ""}
                      onChange={(e) => setConfigDraft({...configDraft, vaccinationsList: e.target.value})}
                      className="h-10 text-xs sm:text-sm bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <p className="text-[10px] text-slate-400">Pediatric clinics will answer vaccination inquiries with these exact vaccines. Non-pediatric clinics will politely inform patients that child vaccines are not provided.</p>
                  </div>
                </div>

                {/* 🛡️ 4. EMERGENCY DESK & SAFETY SHIELD */}
                <div className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    4. Emergency Desk & Safety Shield
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-xs font-semibold text-slate-700">Emergency Escalation Triggers</Label>
                      <Input 
                        placeholder="severe pain, bleeding, chest pain, trauma, emergency"
                        value={configDraft.emergencyTriggers || ""}
                        onChange={(e) => setConfigDraft({...configDraft, emergencyTriggers: e.target.value})}
                        className="h-10 text-xs sm:text-sm bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <p className="text-[10px] text-slate-400">Comma-separated clinical red-flag terms that trigger instant emergency triage guidance.</p>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-xs font-semibold text-slate-700">Emergency Desk / Ambulance Phone</Label>
                      <Input 
                        placeholder="e.g., +91 9876543210 (or 108)"
                        value={configDraft.emergencyPhone || ""}
                        onChange={(e) => setConfigDraft({...configDraft, emergencyPhone: e.target.value})}
                        className="h-10 text-xs sm:text-sm bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <p className="text-[10px] text-slate-400">Immediate helpline shared with patients when critical medical emergencies are detected.</p>
                    </div>
                  </div>
                </div>

                {/* ⚡ 5. CUSTOM GUIDELINES & RULES (HIGH-PRIORITY OVERRIDE) */}
                <div className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 bg-white rounded-2xl border border-indigo-200/90 shadow-xs min-w-0 bg-gradient-to-b from-white to-indigo-50/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                      5. Custom Guidelines & Rules
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-full self-start sm:self-auto">
                      ⚡ Overrides General Settings
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed space-y-1">
                    <p className="font-semibold flex items-center gap-1.5 text-[11px] sm:text-xs">
                      High-Priority Instructions Column
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-amber-800/90">
                      Any operational rules, temporary leave notices, exception timings, or special instructions entered below will <strong>strictly override</strong> general settings in the AI Receptionist prompt.
                    </p>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-semibold text-slate-700">Instructions & Rule Overrides</Label>
                    <Textarea 
                      placeholder="E.g., Dr. Sharma is on emergency leave on Friday 15th. Walk-ins accepted before 4 PM only. Patients requiring stitches or fracture casts should be immediately advised to visit the nearest general emergency hospital."
                      value={configDraft.trainingPrompt || ""}
                      onChange={(e) => setConfigDraft({...configDraft, trainingPrompt: e.target.value})}
                      className="resize-none text-xs sm:text-sm bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-normal"
                      rows={4}
                    />
                    <p className="text-[10px] text-slate-400">Natural language instructions are parsed dynamically by the AI brain on every patient message.</p>
                  </div>
                </div>
              </>
            )}

            {/* 2. REVIEW MANAGER AGENT CONFIG */}
            {activeAgent?.type === "REVIEW" && (
              <div className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                  Review Reply Rules & Keyword Targeting
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-bold text-slate-700">Auto-Publish Threshold</Label>
                    <Select 
                      value={configDraft.autoPublish || "none"} 
                      onValueChange={(v) => setConfigDraft({...configDraft, autoPublish: v})}
                    >
                      <SelectTrigger className="h-10 bg-white text-xs sm:text-sm border-slate-200 w-full min-w-0"><SelectValue className="truncate" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Draft All (Manual approval required)</SelectItem>
                        <SelectItem value="five_star">Auto-Publish 5-Star Reviews Only</SelectItem>
                        <SelectItem value="positive">Auto-Publish 4 & 5-Star Reviews</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] sm:text-xs text-slate-500">Reviews below threshold require manual doctor approval before live publishing.</p>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-bold text-slate-700">Target Keywords for Google Maps SEO</Label>
                    <Input 
                      placeholder="Root Canal, Laser Treatment, Pediatric Care, Orthodontist"
                      value={configDraft.targetKeywords || ""}
                      onChange={(e) => setConfigDraft({...configDraft, targetKeywords: e.target.value})}
                      className="h-10 text-xs sm:text-sm bg-white border-slate-200"
                    />
                    <p className="text-[11px] sm:text-xs text-slate-500">Keywords naturally woven into replies to boost local Google search rankings.</p>
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-bold text-slate-700">Custom Training & Response Guidelines</Label>
                  <Textarea 
                    placeholder="E.g., Always thank the patient by name, mention Gyrex Clinic, and invite negative reviewers to contact support@gyrex.com privately."
                    value={configDraft.instructions || ""}
                    onChange={(e) => setConfigDraft({...configDraft, instructions: e.target.value})}
                    className="resize-none text-xs sm:text-sm bg-white border-slate-200"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* 3. AI CONTENT & POST CREATOR AGENT CONFIG */}
            {(activeAgent?.type === "POST_CREATION" || activeAgent?.type === "PROFILE") && (
              <div className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-purple-600 shrink-0" />
                    Google Post Creation & Clinical Brain Rules
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Google Policy Compliant
                  </span>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-slate-700 text-xs space-y-1">
                  <p className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    Trained Post Brain Guardrails:
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Posts are automatically formatted in 100% clean plain text (no markdown asterisks), with zero phone number stuffing and zero street address repetition to ensure Google Business Profile approval.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-bold text-slate-700">Preferred Action Button</Label>
                    <Select 
                      value={configDraft.ctaType || "CALL"} 
                      onValueChange={(v) => setConfigDraft({...configDraft, ctaType: v})}
                    >
                      <SelectTrigger className="h-10 bg-white text-xs sm:text-sm border-slate-200 w-full min-w-0"><SelectValue className="truncate" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CALL">Call Now (Recommended for clinics)</SelectItem>
                        <SelectItem value="BOOK">Book Online</SelectItem>
                        <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-400">Pre-selected on all AI generated posts to avoid policy issues.</p>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-bold text-slate-700">Posting Frequency</Label>
                    <Select 
                      value={configDraft.frequency || "weekly"} 
                      onValueChange={(v) => setConfigDraft({...configDraft, frequency: v})}
                    >
                      <SelectTrigger className="h-10 bg-white text-xs sm:text-sm border-slate-200 w-full min-w-0"><SelectValue className="truncate" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly (Recommended)</SelectItem>
                        <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-400">Cadence for autonomous draft suggestions.</p>
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-bold text-slate-700">Focus Specialties & Treatments</Label>
                  <Textarea 
                    placeholder="E.g., Spine Rehabilitation, Chronic Back & Neck Pain, Post-Op Joint Rehab, Sports Injury Recovery, Dry Needling"
                    value={configDraft.focusAreas || ""}
                    onChange={(e) => setConfigDraft({...configDraft, focusAreas: e.target.value})}
                    className="resize-none text-xs sm:text-sm bg-white border-slate-200"
                    rows={2}
                  />
                  <p className="text-[11px] sm:text-xs text-slate-500">The agent generates posts emphasizing these specific treatments and patient care benefits.</p>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-bold text-slate-700">Brand Voice & Clinical Persona</Label>
                  <Input 
                    placeholder="E.g., Empathetic, warm, educational healthcare tone; highlight patient mobility and recovery"
                    value={configDraft.brandVoice || ""}
                    onChange={(e) => setConfigDraft({...configDraft, brandVoice: e.target.value})}
                    className="h-10 text-xs sm:text-sm bg-white border-slate-200"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-400">Sets the emotional tone and communication style of your clinic's public posts.</p>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-bold text-slate-700">Doctor Custom Rules & Constraints</Label>
                  <Textarea 
                    placeholder="E.g., Never mention surgery. Emphasize personalized exercise programs. Mention home visit availability for elderly patients."
                    value={configDraft.customRules || configDraft.instructions || ""}
                    onChange={(e) => setConfigDraft({...configDraft, customRules: e.target.value, instructions: e.target.value})}
                    className="resize-none text-xs sm:text-sm bg-white border-slate-200"
                    rows={3}
                  />
                  <p className="text-[11px] sm:text-xs text-slate-500">Custom clinic guidelines the AI must always follow when generating posts.</p>
                </div>
              </div>
            )}

            {/* 4. LOCAL SEO COPILOT AGENT CONFIG */}
            {activeAgent?.type === "LOCAL_SEO_COPILOT" && (
              <div className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                  Local Search Audit Preferences
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-bold text-slate-700">Audit Focus Priority</Label>
                    <Select 
                      value={configDraft.focus || "all"} 
                      onValueChange={(v) => setConfigDraft({...configDraft, focus: v})}
                    >
                      <SelectTrigger className="h-10 bg-white text-xs sm:text-sm border-slate-200 w-full min-w-0"><SelectValue className="truncate" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Balanced (Relevancy, Prominence, Citations)</SelectItem>
                        <SelectItem value="relevancy">Focus on Relevancy & Content</SelectItem>
                        <SelectItem value="prominence">Focus on Prominence & Reviews</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-xs font-bold text-slate-700">Target Search Keywords</Label>
                    <Input 
                      placeholder="E.g., Best dentist near me, root canal, emergency clinic"
                      value={configDraft.keywords || ""}
                      onChange={(e) => setConfigDraft({...configDraft, keywords: e.target.value})}
                      className="h-10 text-xs sm:text-sm bg-white border-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="p-3 sm:px-6 sm:py-4 bg-white border-t border-slate-200/80 sticky bottom-0 z-20 shrink-0 gap-2 sm:gap-3 flex flex-row items-center justify-end">
            <Button variant="outline" onClick={() => setIsConfigOpen(false)} className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-medium border-slate-200 text-slate-700 shrink-0">Cancel</Button>
            <Button onClick={saveConfig} disabled={savingConfig} className="h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 font-bold shadow-md shadow-indigo-600/20 truncate">
              {savingConfig ? (
                <><Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" /> Deploying...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Save & Train Agent</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}