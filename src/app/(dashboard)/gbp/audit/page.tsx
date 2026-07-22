"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  BarChart3,
  MessageSquare,
  X,
  Save,
  Image as ImageIcon
} from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";

export default function RecommendationsPage() {
  const { connected, activeLocation: activeAccount, isLoading: contextLoading } = useLocationContext();
  
  // Modals state
  const [editingModal, setEditingModal] = useState<"description" | "category" | "hours" | "photos" | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const insights = activeAccount?.insights || {};

  const handleUpdate = async (payload: any) => {
    if (!activeAccount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/gbp/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: activeAccount.id,
          ...payload
        })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Audit</h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
            Connect your Google Business Profile to receive a comprehensive audit of your profile completeness and local SEO performance.
          </p>
          <Button onClick={() => window.location.href = '/gbp'} size="lg" className="bg-blue-600 hover:bg-blue-700">
            Connect Profile
          </Button>
        </div>
      </div>
    );
  }

  if (!activeAccount) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Location</h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
            Please select a location from the dropdown in the navigation bar to view its Profile Audit.
          </p>
        </div>
      </div>
    );
  }

  // Calculate completeness based on actual insights data
  const checks = [
    { 
      id: "description", 
      title: "Add a detailed business description", 
      description: "Include your specialty, services, and location keywords. This helps AI search understand your practice.",
      priority: "high",
      completed: !!insights.description && insights.description.length > 50,
      actionLabel: "Update Description",
      onAction: () => {
        setDescription(insights.description || "");
        setEditingModal("description");
      }
    },
    { 
      id: "photos", 
      title: "Upload at least 5 high-quality photos", 
      description: "Profiles with photos get 42% more direction requests. Show your clinic interior, staff, and exterior.",
      priority: "high",
      completed: false, // mock for now
      actionLabel: "Add Photos",
      onAction: () => setEditingModal("photos")
    },
    { 
      id: "category", 
      title: "Select a primary business category", 
      description: "Your primary category tells Google exactly what you do. 'Cardiologist' ranks better than just 'Doctor'.",
      priority: "high",
      completed: !!insights.categories?.primaryCategory,
      actionLabel: "Update Category",
      onAction: () => {
        setCategory(insights.categories?.primaryCategory?.displayName || "");
        setEditingModal("category");
      }
    },
    { 
      id: "hours", 
      title: "Set accurate opening hours", 
      description: "Outdated hours lead to frustrated patients and lower ranking. Update regular and holiday hours.",
      priority: "high",
      completed: !!insights.regularHours,
      actionLabel: "Update Hours",
      onAction: () => setEditingModal("hours")
    },
    { 
      id: "reviews", 
      title: "Respond to all recent reviews", 
      description: "Reply to every review - positive or negative. It shows you care and boosts your local ranking.",
      priority: "medium",
      completed: activeAccount.recentReviews?.every((r) => r.replied),
      actionLabel: "Go to Reviews",
      actionHref: "/reviews"
    }
  ];

  const completedCount = checks.filter(c => c.completed).length;
  const score = Math.round((completedCount / checks.length) * 100);

  const priorityStyle: Record<string, string> = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6 pb-8 relative">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Recommendations</h1>
          <p className="text-sm text-gray-500 mt-1">Improve your Google presence and practice growth</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Profile Health",
            value: `${score}%`,
            icon: Lightbulb,
            color: "text-amber-600",
            bg: "bg-amber-50",
            sub: `${completedCount}/${checks.length} items complete`,
            progress: score,
          },
          {
            label: "Actions Completed",
            value: `${completedCount}/${checks.length}`,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            sub: "Profile checklist items",
          },
          {
            label: "Profile Views",
            value: formatNum(insights.totalViews || 0),
            icon: TrendingUp,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            sub: "Last 30 days",
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className={`${card.bg} p-2.5 rounded-xl`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            {card.progress !== undefined && (
              <Progress value={card.progress} className="mt-2 h-1.5" />
            )}
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="checklist">
        <TabsList className="bg-gray-100 rounded-xl p-1 h-10">
          <TabsTrigger value="checklist" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Checklist</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="mt-4 space-y-3">
          {score === 100 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center shadow-sm">
              <CheckCircle className="h-12 w-12 mx-auto text-emerald-400 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">All caught up!</h3>
              <p className="text-sm text-gray-500 mt-1">Your profile looks great.</p>
            </div>
          ) : (
            checks.map((rec) => (
              <div
                key={rec.id}
                className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-start justify-between gap-4 transition-all hover:shadow-md ${rec.completed ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  {rec.completed ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm text-gray-900">{rec.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${priorityStyle[rec.priority] || "bg-gray-100 text-gray-600"}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-3xl">{rec.description}</p>
                  </div>
                </div>
                {!rec.completed && rec.actionLabel && (
                  <Button
                    onClick={rec.onAction}
                    asChild={!!rec.actionHref}
                    variant="outline"
                    className="flex-shrink-0 text-xs font-medium text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 hover:text-indigo-700 h-8 px-3 rounded-lg"
                  >
                    {rec.actionHref ? (
                      <a href={rec.actionHref}>{rec.actionLabel}</a>
                    ) : (
                      <span>{rec.actionLabel}</span>
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity Snapshot</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Recent Posts", value: "3", icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Review Replies", value: activeAccount.recentReviews?.filter((r) => r.replied).length || 0, icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className={`${item.bg} p-2.5 rounded-xl`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- IN APP EDITING MODALS --- */}
      {editingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editingModal === "description" ? "Edit Business Description" :
                 editingModal === "category" ? "Update Primary Category" :
                 editingModal === "hours" ? "Update Operating Hours" : "Upload Photos"}
              </h3>
              <button onClick={() => setEditingModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5">
              {editingModal === "description" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Write a detailed description of your practice. Include important keywords like your location and specialties.
                  </p>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={750}
                    rows={6}
                    className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Gyrex Dental is a premier family dentistry clinic located in..."
                  />
                  <div className="text-right text-xs font-medium text-gray-400">
                    {description.length}/750
                  </div>
                </div>
              )}

              {editingModal === "category" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Select the most accurate primary category for your business.
                  </p>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a category...</option>
                    <option value="Dentist">Dentist</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="General Practitioner">General Practitioner</option>
                    <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                    <option value="Pediatrician">Pediatrician</option>
                  </select>
                </div>
              )}

              {editingModal === "hours" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Update your regular operating hours.
                  </p>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-24">{day}</span>
                      <select className="flex-1 text-sm p-2 border border-gray-200 rounded-md">
                        <option>09:00 AM</option>
                        <option>10:00 AM</option>
                      </select>
                      <span className="text-sm text-gray-400">to</span>
                      <select className="flex-1 text-sm p-2 border border-gray-200 rounded-md">
                        <option>05:00 PM</option>
                        <option>06:00 PM</option>
                      </select>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 opacity-50">
                    <span className="text-sm font-medium text-gray-700 w-24">Saturday</span>
                    <div className="text-sm text-gray-500 p-2 border border-gray-200 rounded-md flex-1 text-center bg-gray-50">Closed</div>
                  </div>
                  <div className="flex items-center gap-3 opacity-50">
                    <span className="text-sm font-medium text-gray-700 w-24">Sunday</span>
                    <div className="text-sm text-gray-500 p-2 border border-gray-200 rounded-md flex-1 text-center bg-gray-50">Closed</div>
                  </div>
                </div>
              )}

              {editingModal === "photos" && (
                <div className="space-y-4 text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-2 text-indigo-500">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Upload Clinic Photos</h4>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Drag and drop your photos here, or click to browse. Supported formats: JPG, PNG.
                  </p>
                  <Button variant="outline" className="border-indigo-200 text-indigo-700">
                    Browse Files
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 rounded-b-2xl">
              <Button variant="ghost" onClick={() => setEditingModal(null)} disabled={saving} className="text-gray-600">Cancel</Button>
              <Button 
                onClick={() => {
                  if (editingModal === "description") handleUpdate({ description });
                  else if (editingModal === "category") handleUpdate({ category });
                  else if (editingModal === "hours") handleUpdate({ hours: { periods: [] } }); // mock update
                  else if (editingModal === "photos") setEditingModal(null);
                }}
                disabled={saving || (editingModal === "description" && !description) || (editingModal === "category" && !category)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
              >
                {saving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}