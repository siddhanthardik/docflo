"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Calendar, MessageSquare, Megaphone, TrendingUp, Lock, CheckCircle2, Power, Settings, RefreshCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AIAgentsHubPage() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeAgent, setActiveAgent] = useState<any>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState<any>({});
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai-agents");
      if (res.ok) {
        const data = await res.json();
        setHasAccess(data.hasAccess);
        setAgents(data.agents || []);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load agents", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const toggleAgent = async (agentType: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // Optimistic update
    setAgents(agents.map(a => a.agentType === agentType ? { ...a, enabled: newStatus } : a));
    
    try {
      const res = await fetch("/api/ai-agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType, enabled: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast({ title: newStatus ? "Agent Activated" : "Agent Paused" });
    } catch (error) {
      // Revert on failure
      setAgents(agents.map(a => a.agentType === agentType ? { ...a, enabled: currentStatus } : a));
      toast({ title: "Failed to update status", variant: "destructive" });
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
        toast({ title: "Configuration saved" });
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
      name: "Booking Agent",
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
      desc: "Autonomously handles WhatsApp inquiries to book, reschedule, and cancel appointments.",
      metrics: "Ready to deploy",
    },
    {
      type: "REVIEW",
      name: "Review Manager",
      icon: MessageSquare,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      desc: "Reads incoming Google Reviews and drafts professional, context-aware replies.",
      metrics: "Monitors 24/7",
    },
    {
      type: "PROFILE",
      name: "Profile Updater",
      icon: Megaphone,
      color: "text-purple-600",
      bg: "bg-purple-50",
      desc: "Generates weekly Google Business Profile posts to keep your clinic active and visible.",
      metrics: "Posts on schedule",
    },
    {
      type: "RANKING",
      name: "Ranking Engine",
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-50",
      desc: "Continuously audits competitors and generates actionable SEO tasks to outrank them.",
      metrics: "Weekly analysis",
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin text-indigo-600"><RefreshCcw className="h-8 w-8" /></div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
          <Lock className="h-10 w-10 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">AI Agents Hub</h1>
        <p className="text-gray-500 max-w-lg mb-8 text-lg">
          Unlock the power of autonomous AI employees. Let them handle your bookings, reply to reviews, and manage your SEO while you focus on patients.
        </p>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full mb-8 text-left space-y-4">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Bot className="h-5 w-5 text-indigo-600"/> Pro Features Included:</h3>
           <ul className="space-y-3 text-sm text-gray-600">
             <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Autonomous WhatsApp Booking</li>
             <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Smart Review Replies</li>
             <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automated GBP Updates</li>
             <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Continuous Local SEO Audits</li>
           </ul>
        </div>
        <a href="/billing">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 font-semibold shadow-lg hover:shadow-xl transition-all">
            Upgrade to Pro Plan
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 mb-8 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Coming Soon!</h4>
            <p className="text-indigo-100 text-xs">We are fine-tuning our AI agents. This feature will be available in a future update.</p>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <Bot className="h-8 w-8 text-indigo-600" /> AI Agents Hub
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Your autonomous clinic employees, working 24/7 to grow your practice.</p>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agentDefinitions.map((def) => {
          const agentData = agents.find(a => a.agentType === def.type) || { enabled: false, config: {} };
          const Icon = def.icon;
          
          return (
            <div key={def.type} className={`bg-white rounded-2xl border ${agentData.enabled ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-gray-100 shadow-sm opacity-90'} overflow-hidden transition-all duration-300`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${def.bg}`}>
                    <Icon className={`h-6 w-6 ${def.color}`} />
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <span className="text-xs font-semibold text-gray-600">
                      {agentData.enabled ? "ACTIVE" : "PAUSED"}
                    </span>
                    <Switch 
                      checked={agentData.enabled}
                      onCheckedChange={() => toggleAgent(def.type, agentData.enabled)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{def.name}</h3>
                <p className="text-sm text-gray-500 mb-6 min-h-[40px] leading-relaxed">
                  {def.desc}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <Power className="h-3 w-3" /> {def.metrics}
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openConfig({ ...agentData, ...def })}
                    className="gap-2 text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200"
                  >
                    <Settings className="h-4 w-4" /> Configure
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              Configure {activeAgent?.name}
            </DialogTitle>
            <DialogDescription>
              Adjust how this agent behaves and interacts on your behalf.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {activeAgent?.type === "APPOINTMENT" && (
              <>
                <div className="space-y-2">
                  <Label>Handling Mode</Label>
                  <Select 
                    value={configDraft.mode || "handoff"} 
                    onValueChange={(v) => setConfigDraft({...configDraft, mode: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="handoff">Handoff to Staff (Draft only)</SelectItem>
                      <SelectItem value="autonomous">Fully Autonomous Booking</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Determine if the agent completes the booking or hands it off.</p>
                </div>
                <div className="space-y-2">
                  <Label>Conversational Tone</Label>
                  <Select 
                    value={configDraft.tone || "professional"} 
                    onValueChange={(v) => setConfigDraft({...configDraft, tone: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional & Medical</SelectItem>
                      <SelectItem value="friendly">Warm & Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {activeAgent?.type === "REVIEW" && (
              <>
                <div className="space-y-2">
                  <Label>Auto-Publish Replies</Label>
                  <Select 
                    value={configDraft.autoPublish || "none"} 
                    onValueChange={(v) => setConfigDraft({...configDraft, autoPublish: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Never (Draft all replies)</SelectItem>
                      <SelectItem value="five_star">Only for 5-Star Reviews</SelectItem>
                      <SelectItem value="positive">For 4 & 5-Star Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Negative reviews will always be drafted for manual approval.</p>
                </div>
                <div className="space-y-2">
                  <Label>Custom Instructions</Label>
                  <Textarea 
                    placeholder="E.g., Always mention our clinic name and thank them for choosing us."
                    value={configDraft.instructions || ""}
                    onChange={(e) => setConfigDraft({...configDraft, instructions: e.target.value})}
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </>
            )}

            {activeAgent?.type === "PROFILE" && (
              <>
                <div className="space-y-2">
                  <Label>Posting Frequency</Label>
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
                  <Label>Focus Areas / Services</Label>
                  <Textarea 
                    placeholder="E.g., Dental Implants, Teeth Whitening, Pediatric Care"
                    value={configDraft.focusAreas || ""}
                    onChange={(e) => setConfigDraft({...configDraft, focusAreas: e.target.value})}
                    className="resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">The agent will generate posts emphasizing these topics.</p>
                </div>
              </>
            )}

            {activeAgent?.type === "RANKING" && (
              <>
                <div className="space-y-2">
                  <Label>Target Keywords</Label>
                  <Textarea 
                    placeholder="E.g., Best dentist near me, root canal specialist"
                    value={configDraft.keywords || ""}
                    onChange={(e) => setConfigDraft({...configDraft, keywords: e.target.value})}
                    className="resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">Comma-separated keywords to monitor against competitors.</p>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancel</Button>
            <Button onClick={saveConfig} disabled={savingConfig} className="bg-indigo-600 hover:bg-indigo-700">
              {savingConfig ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}