"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Calendar, MessageSquare, Megaphone, TrendingUp, Power, Settings, RefreshCcw, Sparkles, ShieldAlert, Key, Sliders, CheckCircle2, PhoneCall, Copy } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function AIAgentsHubPage() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeAgent, setActiveAgent] = useState<any>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState<any>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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

  const toggleAgent = async (agentType: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setAgents(agents.map(a => a.agentType === agentType ? { ...a, enabled: newStatus } : a));
    
    try {
      const res = await fetch("/api/ai-agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType, enabled: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast({ title: newStatus ? "AI Agent Activated 🚀" : "AI Agent Paused" });
    } catch (error) {
      setAgents(agents.map(a => a.agentType === agentType ? { ...a, enabled: currentStatus } : a));
      toast({ title: "Failed to update agent status", variant: "destructive" });
    }
  };

  const openConfig = (agent: any) => {
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
        toast({ title: "Agent Training & Config Saved! ✨", description: "Updated prompt instructions deployed to Gemini 3.5 Flash engine." });
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

  const copyDoctorTemplate = () => {
    const template = `📋 GYREX CLINIC AI ASSISTANT SETUP TEMPLATE
(Fill in your clinic details below and reply via WhatsApp)

🏥 Clinic Name: [e.g. City Pediatrics & Child Care]
👨‍⚕️ Doctor Name(s): [e.g. Dr. R. K. Sharma]
🩺 Specialty: [e.g. Pediatrician & Child Specialist]

🕒 Clinic Timings & Days:
• Mon - Sat: 10:00 AM - 1:30 PM | 5:00 PM - 8:30 PM
• Sunday: Closed / Emergency Only

💰 Consultation Fee:
• ₹500 (First Visit) | ₹300 (Follow-up)

💉 Vaccinations Available (Pediatrics Only):
• BCG, Polio, Hepatitis B, Rotavirus, DTP, MMR, Flu Shot

🏥 Services Offered:
• Newborn Care, Growth Tracking, Child Consultation, Nebulization

📞 Emergency Contact: [+91 98765 43210]`;

    navigator.clipboard.writeText(template);
    toast({ title: "WhatsApp Template Copied! 📋", description: "Forward this template to doctors via WhatsApp to collect their clinic variables." });
  };

  const agentDefinitions = [
    {
      type: "APPOINTMENT",
      name: "WhatsApp AI Booking Assistant",
      icon: PhoneCall,
      color: "text-blue-600",
      bg: "bg-blue-50",
      desc: "Connects to your clinic WhatsApp Business number to handle after-hours inquiries, answer slot questions, and share booking links 24/7.",
      metrics: "Gemini 3.5 Flash · 24/7 Live",
    },
    {
      type: "REVIEW",
      name: "Review Manager",
      icon: MessageSquare,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      desc: "Analyzes incoming Google Business Profile reviews and drafts HIPAA-compliant, keyword-rich responses to boost Maps ranking.",
      metrics: "Gemini 3.5 Flash · Auto-Drafting",
    },
    {
      type: "PROFILE",
      name: "Profile Updater",
      icon: Megaphone,
      color: "text-purple-600",
      bg: "bg-purple-50",
      desc: "Generates engaging Google Updates and service highlights on your configured schedule to maintain Google Maps freshness.",
      metrics: "Gemini 3.5 Flash · Scheduled",
    },
    {
      type: "LOCAL_SEO_COPILOT",
      name: "Local SEO Copilot",
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
      desc: "Conducts weekly competitive keyword audits and generates prioritized 1-click execution tasks to outrank local competitors.",
      metrics: "Gemini 3.5 Flash · Algorithmic",
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Powered by Gemini 3.5 Flash
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Bot className="h-8 w-8 text-indigo-400" /> Autonomous AI Agents Hub
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Configure and train your autonomous clinic AI employees to handle WhatsApp bookings, Google reviews, and local search optimization 24/7.
          </p>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agentDefinitions.map((def) => {
          const agentData = agents.find(a => a.agentType === def.type) || { enabled: false, config: {} };
          const Icon = def.icon;
          
          return (
            <div key={def.type} className={`bg-white rounded-2xl border ${agentData.enabled ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-gray-100 shadow-sm opacity-90'} overflow-hidden transition-all duration-300 flex flex-col justify-between`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${def.bg}`}>
                    <Icon className={`h-6 w-6 ${def.color}`} />
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <span className={`text-xs font-bold ${agentData.enabled ? "text-emerald-700" : "text-gray-400"}`}>
                      {agentData.enabled ? "ACTIVE" : "PAUSED"}
                    </span>
                    <Switch 
                      checked={agentData.enabled}
                      onCheckedChange={() => toggleAgent(def.type, agentData.enabled)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{def.name}</h3>
                <p className="text-xs text-gray-500 mb-6 min-h-[40px] leading-relaxed">
                  {def.desc}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-indigo-100">
                    <Power className="h-3 w-3 text-indigo-500" /> {def.metrics}
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openConfig({ ...agentData, ...def })}
                    className="gap-2 text-xs font-bold text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200"
                  >
                    <Settings className="h-4 w-4" /> Configure & Train
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Live AI Conversation Training Log */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              Live AI Conversation Training & Audit Log
            </h3>
            <p className="text-xs text-slate-500">Inspect real-time patient messages, AI assistant replies, and conversation turns to continuously audit and train your AI employee.</p>
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
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl border border-slate-200/70 bg-slate-50/50 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {log.patientName} {log.patientPhone ? `(${log.patientPhone})` : ""}
                  </span>
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
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      AI Assistant Reply:
                    </p>
                    <p className="text-slate-900 font-medium whitespace-pre-wrap">{log.aiResponse}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deep Agent Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Settings className="h-5 w-5 text-indigo-600" />
              Configure & Train: {activeAgent?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Train this Gemini 3.5 Flash AI agent with custom clinic guidelines, system prompts, and operational rules.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-5">
            {/* 1. WHATSAPP BOOKING AGENT CONFIG */}
            {activeAgent?.type === "APPOINTMENT" && (
              <>
                {/* 1-Click WhatsApp Setup Template Button for Doctors */}
                <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Doctor Setup WhatsApp Template
                    </h4>
                    <p className="text-[11px] text-slate-600">Forward this pre-formatted template to doctors via WhatsApp to collect their clinic variables.</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={copyDoctorTemplate}
                    className="shrink-0 text-xs font-bold border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Template
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Conversational Handling Mode</Label>
                  <Select 
                    value={configDraft.mode || "handoff"} 
                    onValueChange={(v) => setConfigDraft({...configDraft, mode: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="handoff">Handoff Mode (Draft replies for staff review)</SelectItem>
                      <SelectItem value="autonomous">Autonomous Mode (Auto-reply on WhatsApp 24/7)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-gray-500">Autonomous mode provides 24/7 booking link delivery to after-hours WhatsApp inquiries.</p>
                </div>

                {/* 🕒 OPD SHIFTS & SCHEDULE */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    1. OPD Shifts & Schedule (Critical)
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-slate-700">Morning OPD Hours</Label>
                      <Input 
                        placeholder="10:00 AM - 1:30 PM (or Leave empty if closed)"
                        value={configDraft.morningOpdHours || ""}
                        onChange={(e) => setConfigDraft({...configDraft, morningOpdHours: e.target.value})}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-slate-700">Evening OPD Hours</Label>
                      <Input 
                        placeholder="5:00 PM - 8:30 PM"
                        value={configDraft.eveningOpdHours || ""}
                        onChange={(e) => setConfigDraft({...configDraft, eveningOpdHours: e.target.value})}
                        className="text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-slate-700">Hospital Visit / Round Hours</Label>
                      <Input 
                        placeholder="e.g., Morning 9 AM - 1 PM Hospital Rounds"
                        value={configDraft.hospitalHours || ""}
                        onChange={(e) => setConfigDraft({...configDraft, hospitalHours: e.target.value})}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-slate-700">Sunday OPD Policy</Label>
                      <Input 
                        placeholder="e.g., Closed / Emergency Only"
                        value={configDraft.sundayRule || ""}
                        onChange={(e) => setConfigDraft({...configDraft, sundayRule: e.target.value})}
                        className="text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 💰 FEES & FOLLOW-UP POLICY */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    2. Fees & Follow-up Policy
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-slate-700">First Visit Fee</Label>
                      <Input 
                        placeholder="e.g., ₹500"
                        value={configDraft.consultationFee || ""}
                        onChange={(e) => setConfigDraft({...configDraft, consultationFee: e.target.value})}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-slate-700">Follow-up Fee</Label>
                      <Input 
                        placeholder="e.g., ₹300"
                        value={configDraft.followUpFee || ""}
                        onChange={(e) => setConfigDraft({...configDraft, followUpFee: e.target.value})}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-slate-700">Follow-up Validity</Label>
                      <Input 
                        placeholder="e.g., Within 7 Days"
                        value={configDraft.followUpDays || ""}
                        onChange={(e) => setConfigDraft({...configDraft, followUpDays: e.target.value})}
                        className="text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 💉 SERVICES & VACCINATIONS */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    3. Services & Vaccination Catalog
                  </h4>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">Available Vaccinations (Pediatricians Only)</Label>
                    <Input 
                      placeholder="BCG, Polio, Hepatitis B, Rotavirus, DTP, MMR, Flu Shot"
                      value={configDraft.vaccinationsList || ""}
                      onChange={(e) => setConfigDraft({...configDraft, vaccinationsList: e.target.value})}
                      className="text-xs bg-white"
                    />
                    <p className="text-[11px] text-gray-500">Pediatric clinics will answer vaccination inquiries with these exact vaccines. Non-pediatricians will politely inform patients that child vaccines are not provided.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">Services & Treatments Offered</Label>
                    <Input 
                      placeholder="General OPD Consultation, Growth Tracking, Nebulization, In-clinic Procedures"
                      value={configDraft.servicesOffered || ""}
                      onChange={(e) => setConfigDraft({...configDraft, servicesOffered: e.target.value})}
                      className="text-xs bg-white"
                    />
                  </div>
                </div>

                {/* 🤖 PERSONA & INSTRUCTIONS */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    4. Receptionist Persona & Language
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-slate-700">Assistant Name</Label>
                      <Input 
                        placeholder="e.g., Riya"
                        value={configDraft.assistantName || ""}
                        onChange={(e) => setConfigDraft({...configDraft, assistantName: e.target.value})}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-slate-700">Language Style</Label>
                      <Select 
                        value={configDraft.languagePref || "auto"} 
                        onValueChange={(v) => setConfigDraft({...configDraft, languagePref: v})}
                      >
                        <SelectTrigger className="bg-white text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-Detect & Match Patient Language (Recommended)</SelectItem>
                          <SelectItem value="hinglish">Natural Indian Hinglish (Namaste / Ji)</SelectItem>
                          <SelectItem value="english">Polite & Warm English</SelectItem>
                          <SelectItem value="hindi">Pure Polite Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-700">Emergency Escalation Triggers</Label>
                    <Input 
                      placeholder="severe pain, bleeding, chest pain, trauma, emergency"
                      value={configDraft.emergencyTriggers || ""}
                      onChange={(e) => setConfigDraft({...configDraft, emergencyTriggers: e.target.value})}
                      className="text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-700">Doctor Custom Guidelines & Rules</Label>
                    <Textarea 
                      placeholder="E.g., Sunday OPD closed. Walk-ins accepted before 4 PM. Please bring past medical reports."
                      value={configDraft.trainingPrompt || ""}
                      onChange={(e) => setConfigDraft({...configDraft, trainingPrompt: e.target.value})}
                      className="resize-none text-xs bg-white"
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}

            {/* 2. REVIEW MANAGER AGENT CONFIG */}
            {activeAgent?.type === "REVIEW" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Auto-Publish Threshold</Label>
                  <Select 
                    value={configDraft.autoPublish || "none"} 
                    onValueChange={(v) => setConfigDraft({...configDraft, autoPublish: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Draft All (Manual approval required)</SelectItem>
                      <SelectItem value="five_star">Auto-Publish 5-Star Reviews Only</SelectItem>
                      <SelectItem value="positive">Auto-Publish 4 & 5-Star Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-gray-500">Reviews below the threshold will always be drafted for manual review before publishing.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Target Keywords to Weave in Replies</Label>
                  <Input 
                    placeholder="Root Canal, Laser Treatment, Pediatric Care, Orthodontist"
                    value={configDraft.targetKeywords || ""}
                    onChange={(e) => setConfigDraft({...configDraft, targetKeywords: e.target.value})}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-gray-500">The AI naturally incorporates these keywords in review responses to boost Google Maps rankings.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Custom Training & Response Guidelines</Label>
                  <Textarea 
                    placeholder="E.g., Always thank the patient by name, mention Gyrex Clinic, and invite negative reviewers to contact support@gyrex.com privately."
                    value={configDraft.instructions || ""}
                    onChange={(e) => setConfigDraft({...configDraft, instructions: e.target.value})}
                    className="resize-none text-xs"
                    rows={4}
                  />
                </div>
              </>
            )}

            {/* 3. PROFILE UPDATER AGENT CONFIG */}
            {activeAgent?.type === "PROFILE" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Posting Frequency</Label>
                  <Select 
                    value={configDraft.frequency || "weekly"} 
                    onValueChange={(v) => setConfigDraft({...configDraft, frequency: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly (Recommended)</SelectItem>
                      <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Focus Specialties & Treatments</Label>
                  <Textarea 
                    placeholder="E.g., Dental Implants, Teeth Whitening, Emergency Dental Care, Invisalign"
                    value={configDraft.focusAreas || ""}
                    onChange={(e) => setConfigDraft({...configDraft, focusAreas: e.target.value})}
                    className="resize-none text-xs"
                    rows={3}
                  />
                  <p className="text-[11px] text-gray-500">The agent generates posts highlighting these specific treatments.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Call To Action (CTA) Preference</Label>
                  <Select 
                    value={configDraft.ctaType || "LEARN_MORE"} 
                    onValueChange={(v) => setConfigDraft({...configDraft, ctaType: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                      <SelectItem value="BOOK">Book Online</SelectItem>
                      <SelectItem value="CALL">Call Now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Brand Style Guidelines</Label>
                  <Input 
                    placeholder="Informative healthcare tone, max 2 emojis, end with booking phone number."
                    value={configDraft.brandVoice || ""}
                    onChange={(e) => setConfigDraft({...configDraft, brandVoice: e.target.value})}
                    className="text-xs"
                  />
                </div>
              </>
            )}

            {/* 4. LOCAL SEO COPILOT AGENT CONFIG */}
            {activeAgent?.type === "LOCAL_SEO_COPILOT" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Target Search Keywords</Label>
                  <Textarea 
                    placeholder="E.g., Best dentist near me, root canal specialist, emergency clinic"
                    value={configDraft.keywords || ""}
                    onChange={(e) => setConfigDraft({...configDraft, keywords: e.target.value})}
                    className="resize-none text-xs"
                    rows={3}
                  />
                  <p className="text-[11px] text-gray-500">Comma-separated target keywords to monitor against competitors in weekly scans.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Audit Focus Priority</Label>
                  <Select 
                    value={configDraft.focus || "all"} 
                    onValueChange={(v) => setConfigDraft({...configDraft, focus: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Balanced (Relevancy, Prominence, Citations)</SelectItem>
                      <SelectItem value="relevancy">Focus on Relevancy & Content</SelectItem>
                      <SelectItem value="prominence">Focus on Prominence & Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancel</Button>
            <Button onClick={saveConfig} disabled={savingConfig} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
              {savingConfig ? "Deploying Prompt..." : "Save & Train Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}