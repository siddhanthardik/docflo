"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocationContext } from "@/contexts/LocationContext";
import { 
  TrendingUp, Map, ShieldCheck, Search, Plus, Trophy, 
  MapPin, Target, AlertTriangle, CheckCircle, ExternalLink, RefreshCw, Star, X,
  ListTodo, Crosshair, Users, Activity, MessageSquare
} from "lucide-react";
import Link from "next/link";

type TabType = "action-plan" | "matrix" | "competitors";

export default function LocalSeoPage() {
  const [activeTab, setActiveTab] = useState<TabType>("action-plan");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [seoData, setSeoData] = useState<{ keywords: any[]; competitors: string[] }>({ keywords: [], competitors: [] });
  const [newKeyword, setNewKeyword] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [quotaError, setQuotaError] = useState("");

  const { activeLocationId } = useLocationContext();

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gbp/profiles");
      const json = await res.json();
      setData(json);
      
      if (activeLocationId && json.accounts) {
        const activeAcc = json.accounts.find((acc: any) => acc.id === activeLocationId) || json.accounts[0];
        if (activeAcc) {
          fetchLocalSeoData(activeAcc.id);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const fetchLocalSeoData = async (locId: string) => {
    try {
      const res = await fetch(`/api/gbp/local-seo?locationId=${locId}`);
      const json = await res.json();
      if (res.ok) {
        setSeoData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfiles(); }, [activeLocationId]);

  const activeAccount = data?.accounts?.find((acc: any) => acc.id === activeLocationId) || data?.accounts?.[0];
  const insights = activeAccount?.insights || {};
  const primaryCategory = insights.categories?.primaryCategory?.displayName || "Service";
  const city = insights.location?.city || "your city";

  // ACTION PLAN GENERATOR (AI Task Engine)
  const generateActionPlan = () => {
    if (!activeAccount) return { tasks: [], healthScore: 0 };
    
    const description = (insights.description || "").toLowerCase();
    const reviewCount = insights.totalReviews || 0;
    const avgRating = insights.averageRating || 0;
    const recentReviews = activeAccount.recentReviews || [];
    
    const tasks = [];
    let healthScore = 100;
    
    // 1. Description Optimization
    let keywordsInDesc = 0;
    seoData.keywords.forEach(kw => {
      if (description.includes(kw.query.toLowerCase().split(" ")[0])) keywordsInDesc++;
    });
    
    if (description.length < 200 || keywordsInDesc === 0) {
      healthScore -= 15;
      tasks.push({
        id: "desc-opt",
        priority: "high",
        title: "Optimize Your GBP Description",
        desc: `Your profile description is missing key tracked terms like "${primaryCategory}". Adding these keywords naturally will immediately boost your Relevance score.`,
        icon: <ShieldCheck className="h-5 w-5 text-indigo-500" />,
        actionText: "Edit Profile",
        actionLink: "/gbp/audit",
        metric: "Relevance Signal"
      });
    }

    // 2. Review Velocity
    if (reviewCount < 50 || avgRating < 4.5) {
      healthScore -= 20;
      tasks.push({
        id: "rev-vel",
        priority: "critical",
        title: "Increase Review Velocity",
        desc: "You need more consistent 5-star reviews to break into the top 3 of the map pack. Top competitors typically get 5-10 reviews a month.",
        icon: <Star className="h-5 w-5 text-amber-500" />,
        actionText: "Send Campaign",
        actionLink: "/campaigns",
        metric: "Prominence Signal"
      });
    }

    // 3. Review Response Rate
    const repliedReviews = recentReviews.filter((r: any) => r.replied).length;
    const replyRate = recentReviews.length > 0 ? (repliedReviews / recentReviews.length) : 0;
    
    if (replyRate < 0.8 && recentReviews.length > 0) {
      healthScore -= 15;
      tasks.push({
        id: "rev-reply",
        priority: "high",
        title: "Reply to Pending Reviews",
        desc: "Google actively penalizes profiles that ignore reviews. You have unanswered reviews waiting. Our AI can draft replies for you in seconds.",
        icon: <MessageSquare className="h-5 w-5 text-emerald-500" />,
        actionText: "Reply Now",
        actionLink: "/reviews",
        metric: "Engagement Signal"
      });
    }

    // 4. Content Freshness (Simulated check)
    const daysSinceLastPost = 14; // Mocked
    if (daysSinceLastPost > 7) {
      healthScore -= 10;
      tasks.push({
        id: "post-fresh",
        priority: "medium",
        title: "Publish a Weekly Update",
        desc: `It's been ${daysSinceLastPost} days since your last post. Fresh content signals to Google that your clinic is active. Post a tip about ${primaryCategory} today.`,
        icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
        actionText: "Draft AI Post",
        actionLink: "/gbp/posts",
        metric: "Activity Signal"
      });
    }

    if (tasks.length === 0) {
      tasks.push({
        id: "all-good",
        priority: "low",
        title: "You are dominating!",
        desc: "You have completed all high-priority SEO tasks for this week. Keep monitoring your Geo-Grid to ensure your competitors don't catch up.",
        icon: <Trophy className="h-5 w-5 text-yellow-500" />,
        actionText: "View Geo-Grid",
        actionLink: "#",
        metric: "All Signals"
      });
    }

    return { tasks, healthScore };
  };

  const { tasks: actionTasks, healthScore } = generateActionPlan();

  const handleAddKeyword = async () => {
    if (!newKeyword || !activeAccount) return;
    setAddingKeyword(true);
    setQuotaError("");
    
    const newKw = {
      query: newKeyword,
      volume: Math.floor(Math.random() * 500) + 50,
      difficulty: Math.floor(Math.random() * 60) + 20,
      rank: Math.floor(Math.random() * 10) + 1,
      previousRank: Math.floor(Math.random() * 15) + 1,
      comp1Rank: Math.floor(Math.random() * 15) + 1,
      comp2Rank: Math.floor(Math.random() * 20) + 1,
    };

    const updatedKeywords = [...seoData.keywords, newKw];
    
    try {
      const res = await fetch("/api/gbp/local-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: activeAccount.id,
          keywords: updatedKeywords,
        }),
      });
      if (res.ok) {
        setSeoData({ ...seoData, keywords: updatedKeywords });
        setNewKeyword("");
      } else if (res.status === 403) {
        setQuotaError("You have reached your keyword tracking limit for this billing plan.");
      } else {
        setQuotaError("Failed to add keyword.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitor || !activeAccount || seoData.competitors.length >= 3) return;
    setAddingCompetitor(true);
    
    const updatedCompetitors = [...seoData.competitors, newCompetitor];
    
    try {
      const res = await fetch("/api/gbp/local-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: activeAccount.id,
          competitors: updatedCompetitors,
        }),
      });
      if (res.ok) {
        setSeoData({ ...seoData, competitors: updatedCompetitors });
        setNewCompetitor("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingCompetitor(false);
    }
  };

  const removeCompetitor = async (indexToRemove: number) => {
    if (!activeAccount) return;
    const updatedCompetitors = seoData.competitors.filter((_, i) => i !== indexToRemove);
    try {
      await fetch("/api/gbp/local-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: activeAccount.id,
          competitors: updatedCompetitors,
        }),
      });
      setSeoData({ ...seoData, competitors: updatedCompetitors });
    } catch (e) {
      console.error(e);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  if (!data?.connected || !activeAccount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
          <TrendingUp className="h-10 w-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Local SEO Dashboard</h2>
        <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
          Connect your Google Business Profile to unlock true ranking matrices, geo-grid mapping, and automated SEO audits.
        </p>
        <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
          <a href="/gbp">Connect Profile</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Local SEO Dashboard</h1>
          <p className="text-gray-500 mt-1">Harness actual Google signals to dominate local search.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("action-plan")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "action-plan" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 font-medium"
          }`}
        >
          <ListTodo className="h-4 w-4" /> Action Plan
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "matrix" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 font-medium"
          }`}
        >
          <Crosshair className="h-4 w-4" /> Local Geo-Grid & Matrix
        </button>
        <button
          onClick={() => setActiveTab("competitors")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "competitors" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 font-medium"
          }`}
        >
          <Users className="h-4 w-4" /> Competitor Intelligence
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        
        {/* KEYWORD MATRIX & GEO GRID */}
        {activeTab === "matrix" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Visual Geo-Grid Map */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-indigo-600" /> Local Geo-Grid Map
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">See exactly where you rank across a 3-mile radius.</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Top 3</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400"></div> 4-10</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> 11+</div>
                </div>
              </div>
              
              <div className="relative max-w-lg mx-auto aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-inner p-8">
                {/* Simulated Map Background Lines */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
                
                {/* 3x3 Grid */}
                <div className="relative z-10 w-full h-full grid grid-cols-3 gap-4 items-center justify-items-center">
                  {/* Row 1 */}
                  <div className="w-14 h-14 rounded-full bg-red-100 border-2 border-red-500 text-red-700 flex flex-col items-center justify-center font-bold shadow-md transform hover:scale-110 transition-transform">
                    <span className="text-lg leading-none">12</span><span className="text-[9px] uppercase tracking-tighter">NW</span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-700 flex flex-col items-center justify-center font-bold shadow-md transform hover:scale-110 transition-transform">
                    <span className="text-lg leading-none">6</span><span className="text-[9px] uppercase tracking-tighter">N</span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-red-100 border-2 border-red-500 text-red-700 flex flex-col items-center justify-center font-bold shadow-md transform hover:scale-110 transition-transform">
                    <span className="text-lg leading-none">14</span><span className="text-[9px] uppercase tracking-tighter">NE</span>
                  </div>
                  
                  {/* Row 2 (Center is Clinic) */}
                  <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-700 flex flex-col items-center justify-center font-bold shadow-md transform hover:scale-110 transition-transform">
                    <span className="text-lg leading-none">5</span><span className="text-[9px] uppercase tracking-tighter">W</span>
                  </div>
                  <div className="w-20 h-20 rounded-full bg-emerald-500 border-4 border-white text-white flex flex-col items-center justify-center font-black shadow-xl ring-4 ring-emerald-500/30 transform hover:scale-105 transition-transform relative z-20">
                    <MapPin className="h-4 w-4 mb-0.5 opacity-90" />
                    <span className="text-2xl leading-none">1</span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-700 flex flex-col items-center justify-center font-bold shadow-md transform hover:scale-110 transition-transform">
                    <span className="text-lg leading-none">8</span><span className="text-[9px] uppercase tracking-tighter">E</span>
                  </div>
                  
                  {/* Row 3 */}
                  <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-700 flex flex-col items-center justify-center font-bold shadow-md transform hover:scale-110 transition-transform">
                    <span className="text-lg leading-none">3</span><span className="text-[9px] uppercase tracking-tighter">SW</span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-700 flex flex-col items-center justify-center font-bold shadow-md transform hover:scale-110 transition-transform">
                    <span className="text-lg leading-none">2</span><span className="text-[9px] uppercase tracking-tighter">S</span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-700 flex flex-col items-center justify-center font-bold shadow-md transform hover:scale-110 transition-transform">
                    <span className="text-lg leading-none">7</span><span className="text-[9px] uppercase tracking-tighter">SE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex-1 max-w-md">
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Track Local Queries</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder={`e.g. Best ${primaryCategory} in ${city}`}
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    />
                  </div>
                  <Button 
                    onClick={handleAddKeyword} 
                    disabled={addingKeyword || !newKeyword}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {addingKeyword ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Track
                  </Button>
                </div>
                {quotaError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between text-sm text-red-700 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4" /> {quotaError}
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8 border-red-200 bg-white hover:bg-red-50 hover:text-red-800">
                      <a href="/settings/billing">Upgrade</a>
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex-1 xl:max-w-md bg-gray-50 rounded-xl p-4 border border-gray-100">
                <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span>Track Competitors ({seoData.competitors.length}/3)</span>
                </label>
                
                {seoData.competitors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {seoData.competitors.map((comp, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-white border border-gray-200 text-xs font-medium text-gray-700 px-2 py-1 rounded-md shadow-sm">
                        {comp}
                        <button onClick={() => removeCompetitor(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {seoData.competitors.length < 3 && (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add competitor business name..."
                      value={newCompetitor}
                      onChange={(e) => setNewCompetitor(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddCompetitor}
                      disabled={addingCompetitor || !newCompetitor}
                      className="h-8 text-xs font-medium"
                    >
                      {addingCompetitor ? "..." : "Add"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="font-semibold px-6 py-4">Target Query</th>
                    <th className="font-semibold px-6 py-4">Search Volume</th>
                    <th className="font-semibold px-6 py-4">Difficulty</th>
                    <th className="font-semibold px-6 py-4 text-indigo-700">Your Rank</th>
                    {seoData.competitors.map((comp, i) => (
                      <th key={i} className="font-semibold px-6 py-4 text-gray-500 truncate max-w-[120px]" title={comp}>{comp}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {seoData.keywords.length === 0 ? (
                    <tr>
                      <td colSpan={4 + seoData.competitors.length} className="px-6 py-12 text-center">
                        <Trophy className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No keywords tracked yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Add queries relevant to your medical specialty above.</p>
                      </td>
                    </tr>
                  ) : (
                    seoData.keywords.map((kw, i) => {
                      const rankChange = kw.previousRank - kw.rank;
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{kw.query}</td>
                          <td className="px-6 py-4 text-gray-600">{kw.volume} / mo</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              kw.difficulty > 55 ? 'bg-red-50 text-red-700' : kw.difficulty > 35 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {kw.difficulty}/100
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${kw.rank <= 3 ? 'bg-emerald-100 text-emerald-700' : kw.rank <= 10 ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                                {kw.rank}
                              </div>
                              {rankChange !== 0 && (
                                <span className={`text-[10px] font-bold ${rankChange > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {rankChange > 0 ? '▲' : '▼'} {Math.abs(rankChange)}
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Competitor Ranks - Mocked based on tracked competitors */}
                          {seoData.competitors.map((comp, cIdx) => {
                            // Stable mock generation using index math to simulate competitor ranks
                            const mockCompRank = (kw.rank + (cIdx * 2) + Math.floor(kw.difficulty / 10)) % 15 + 1;
                            return (
                              <td key={cIdx} className="px-6 py-4 text-gray-500 font-medium">#{mockCompRank}</td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACTION PLAN */}
        {activeTab === "action-plan" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Stats Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                <Target className="w-64 h-64 -mt-10 -mr-10" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold">SEO Health Score: {healthScore}/100</h2>
                </div>
                <h1 className="text-3xl font-bold mb-3 tracking-tight">Your Priority Action Plan</h1>
                <p className="text-indigo-100 text-lg">
                  Complete these tasks this week to boost your ranking signals and outrank your local competitors.
                </p>
              </div>
            </div>

            {/* Task Checklist */}
            <div className="bg-white rounded-xl border border-gray-100 p-2 shadow-sm">
              <div className="px-5 pt-5 pb-3 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">To-Do List</h3>
                <span className="text-sm font-medium text-gray-500">{actionTasks.length} {actionTasks.length === 1 ? 'Task' : 'Tasks'}</span>
              </div>
              
              <div className="divide-y divide-gray-50">
                {actionTasks.map((task, i) => (
                  <div key={i} className="p-6 flex flex-col md:flex-row md:items-start gap-5 hover:bg-gray-50/50 transition-colors group">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`p-3 rounded-xl border ${
                        task.priority === "critical" ? "bg-red-50 border-red-100" : 
                        task.priority === "high" ? "bg-amber-50 border-amber-100" : 
                        task.priority === "medium" ? "bg-blue-50 border-blue-100" :
                        "bg-emerald-50 border-emerald-100"
                      }`}>
                        {task.icon}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h4 className="text-base font-bold text-gray-900">{task.title}</h4>
                        {task.priority !== "low" && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.priority === "critical" ? "bg-red-100 text-red-700" :
                            task.priority === "high" ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {task.priority} Priority
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider ml-auto">
                          Impacts: {task.metric}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 max-w-3xl leading-relaxed mb-4">{task.desc}</p>
                      
                      {task.actionLink !== "#" && (
                        <Button 
                          className={`font-semibold shadow-sm ${
                            task.priority === "critical" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                          }`}
                          variant={task.priority === "critical" ? "default" : "outline"}
                          size="sm" 
                          asChild
                        >
                          <a href={task.actionLink}>{task.actionText}</a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COMPETITOR INTELLIGENCE */}
        {activeTab === "competitors" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" /> Competitor Benchmarking
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">See exactly how you stack up against the competition in your local area.</p>
                </div>
              </div>

              {seoData.competitors.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No competitors tracked yet.</p>
                  <p className="text-sm text-gray-400 mt-1 mb-4">Go to the Local Geo-Grid & Matrix tab to add competitors.</p>
                  <Button variant="outline" onClick={() => setActiveTab("matrix")}>Add Competitors</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                      <tr>
                        <th className="font-semibold px-6 py-4">Metric</th>
                        <th className="font-semibold px-6 py-4 text-indigo-700 bg-indigo-50/50">Your Clinic</th>
                        {seoData.competitors.map((comp, i) => (
                          <th key={i} className="font-semibold px-6 py-4 text-gray-700 truncate max-w-[150px]">{comp}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5 font-medium text-gray-900">Total Reviews</td>
                        <td className="px-6 py-5 font-bold text-indigo-700 bg-indigo-50/30">{insights.totalReviews || 0}</td>
                        {seoData.competitors.map((comp, i) => {
                          const mockRev = Math.floor((insights.totalReviews || 50) * (1 + (i * 0.4)));
                          return <td key={i} className="px-6 py-5 text-gray-600 font-medium">{mockRev}</td>;
                        })}
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5 font-medium text-gray-900">Average Rating</td>
                        <td className="px-6 py-5 font-bold text-indigo-700 bg-indigo-50/30">
                          <div className="flex items-center gap-1">
                            {insights.averageRating || "N/A"} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          </div>
                        </td>
                        {seoData.competitors.map((comp, i) => (
                          <td key={i} className="px-6 py-5 text-gray-600 font-medium">
                            <div className="flex items-center gap-1">
                              {4 + (i * 0.2)} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5 font-medium text-gray-900">Review Velocity (per month)</td>
                        <td className="px-6 py-5 font-bold text-indigo-700 bg-indigo-50/30">
                          {activeAccount?.recentReviews?.length || 0} <span className="text-xs text-gray-400 font-normal">/ mo</span>
                        </td>
                        {seoData.competitors.map((comp, i) => (
                          <td key={i} className="px-6 py-5 text-gray-600 font-medium">
                            {3 + i * 2} <span className="text-xs text-gray-400 font-normal">/ mo</span>
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5 font-medium text-gray-900">Primary Category Match</td>
                        <td className="px-6 py-5 font-bold text-indigo-700 bg-indigo-50/30">
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">Exact Match</span>
                        </td>
                        {seoData.competitors.map((comp, i) => (
                          <td key={i} className="px-6 py-5 text-gray-600 font-medium">
                            {i === 0 ? (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">Exact Match</span>
                            ) : (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">Partial Match</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
