"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, CheckCircle, Clock, Search, ExternalLink, Bot, ThumbsUp, Send } from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";
import { toast } from "sonner";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-pink-500",
    "bg-indigo-500", "bg-emerald-500", "bg-orange-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Just now (Synced)";
  if (days === 1) return "1 Day ago";
  if (days < 30) return `${days} Days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 Month ago" : `${months} Months ago`;
}

export default function ReviewsPage() {
  const { connected, activeLocation, activeLocationId, isLoading: contextLoading } = useLocationContext();
  const [reviews, setReviews] = useState<any[]>(null as any);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "needs_reply" | "replied">("all");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [draftingReplyFor, setDraftingReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [pipelineMetrics, setPipelineMetrics] = useState<any>(null);

  const fetchReviews = async () => {
    if (contextLoading) return;
    
    if (!connected || !activeLocationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [reviewsRes, metricsRes] = await Promise.all([
        fetch(`/api/gbp/reviews?locationId=${activeLocationId}`),
        fetch("/api/reviews/metrics")
      ]);
      const reviewsData = await reviewsRes.json();
      const metricsData = await metricsRes.json();
      
      if (reviewsRes.ok) {
        setReviews(reviewsData.reviews || []);
        setStats(reviewsData.stats);
      }
      if (metricsRes.ok) {
        setPipelineMetrics(metricsData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [connected, activeLocationId, contextLoading]);

  if (contextLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <Star className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Google Reviews</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
          Connect your Google Business Profile to view, track, and respond to your patient reviews directly from Gyrex.
        </p>
        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
          <a href="/gbp">Connect Profile</a>
        </Button>
      </div>
    );
  }

  if (!activeLocationId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Select a Location</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
          Please select a location from the dropdown in the navigation bar to manage its reviews.
        </p>
      </div>
    );
  }

  const insights = activeLocation?.insights || {};

  // Sort by newest first
  const sortedReviews = reviews ? [...reviews].sort((a: any, b: any) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()) : [];

  const totalReviews = sortedReviews.length;
  const repliedCount = sortedReviews.filter((r: any) => r.replied).length;
  const needsReplyCount = totalReviews - repliedCount;
  const responseRate = totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 100) : 0;
  
  // Calculate average rating strictly from fetched reviews
  const avgRating = totalReviews > 0 ? (sortedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / totalReviews).toFixed(1) : "0.0";
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: sortedReviews.filter((r: any) => r.rating === stars).length,
    percentage: totalReviews > 0 ? Math.round((sortedReviews.filter((r: any) => r.rating === stars).length / totalReviews) * 100) : 0
  }));

  // Apply filters
  let filteredReviews = sortedReviews;
  if (filter === "needs_reply") filteredReviews = filteredReviews.filter((r: any) => !r.replied);
  if (filter === "replied") filteredReviews = filteredReviews.filter((r: any) => r.replied);
  if (starFilter) filteredReviews = filteredReviews.filter((r: any) => r.rating === starFilter);

  const handleDraftAI = (review: any) => {
    setDraftingReplyFor(review.id);
    setReplyText("Analyzing review and generating contextual reply...");
    
    setTimeout(() => {
      // 1. Dynamic Keyword Extraction
      let availableKeywords: string[] = [];
      
      if (insights.searchKeywords && insights.searchKeywords.length > 0) {
        availableKeywords = insights.searchKeywords.map((k) => typeof k === "string" ? k : k.keyword);
      } 
      
      if (insights.categories) {
        if (insights.categories.primaryCategory?.displayName) {
          availableKeywords.push(insights.categories.primaryCategory.displayName);
        }
        if (Array.isArray(insights.categories.additionalCategories)) {
          insights.categories.additionalCategories.forEach(c => {
            if (c.displayName) availableKeywords.push(c.displayName);
          });
        }
      }

      // Smart Fallback if no insights data is available
      if (availableKeywords.length === 0) {
        const nameLower = (insights.name || "").toLowerCase();
        if (nameLower.includes("physio")) availableKeywords.push("physiotherapy care");
        else if (nameLower.includes("dental") || nameLower.includes("dentist")) availableKeywords.push("dental services");
        else if (nameLower.includes("cardio")) availableKeywords.push("cardiology care");
        else if (nameLower.includes("derma")) availableKeywords.push("dermatology treatments");
        else if (nameLower.includes("ortho")) availableKeywords.push("orthopedic care");
        else availableKeywords.push("medical care", "healthcare services", "patient care");
      }

      // Add a couple of generic positive terms to mix it up
      availableKeywords.push("professional service", "excellent care");
      
      const kw = availableKeywords[Math.floor(Math.random() * availableKeywords.length)].toLowerCase();
      const clinicName = insights.name || "our clinic";
      const author = review.author_name || "there";
      
      let draft = "";
      
      if (review.rating >= 4) {
        // Diverse Positive Templates with high human sentiment
        const positiveTemplates = [
          `Hi ${author},\n\nThis completely made our day! It means so much to our entire team when we hear that our patients feel genuinely cared for. We pour our hearts into providing the best ${kw} possible, and it’s wonderful to know we hit the mark for you. Hope you're doing well, and thanks again for trusting ${clinicName}!\n\nWarmly,\nThe team at ${clinicName}`,
          
          `Dear ${author},\n\nThank you from the bottom of our hearts for taking the time to write this. Knowing that you felt comfortable and happy with the ${kw} you received is exactly why we do what we do every single day. We're always here for you whenever you need us!\n\nBest regards,\n${clinicName}`,
          
          `Hello ${author}! What a lovely review to read. The team was smiling from ear to ear when we saw this today. We truly love taking care of our patients and ensuring your experience with our ${kw} is as stress-free as possible. Stay healthy and we hope to see you next time!\n\nSincerely,\n${clinicName} Team`,
          
          `Hi ${author},\n\nThank you so much for your incredibly kind words. It’s such a privilege to look after wonderful patients like you. Our whole staff is passionate about delivering compassionate ${kw}, and your feedback validates all our hard work. We appreciate you choosing ${clinicName}!\n\nBest,\n${clinicName}`,
          
          `Dear ${author},\n\nWe were absolutely thrilled to read your review! Sometimes going to a clinic can be daunting, so we try really hard to make sure our ${kw} makes you feel right at home. Thank you for noticing and for being such a great patient. \n\nTake care,\n${clinicName}`
        ];
        draft = positiveTemplates[Math.floor(Math.random() * positiveTemplates.length)];
      } else if (review.rating === 3) {
        // Neutral Template
        draft = `Hi ${author},\n\nThank you honestly for your feedback. We genuinely care about how our patients feel, and while we're glad you visited, we'd love to know how we could have turned this into a 5-star experience. We are always looking for ways to improve our ${kw}. If you're open to it, please reach out to our front desk—we’d love to hear your thoughts.\n\nWarmly,\n${clinicName} Management`;
      } else {
        // Diverse Negative Templates with empathy
        const negativeTemplates = [
          `Hi ${author},\n\nI am so sorry to hear that you felt let down during your recent visit. This absolutely isn't the standard of care we want our patients to experience. We care deeply about providing excellent ${kw}, and it breaks our hearts to know we missed the mark for you. I would truly appreciate the chance to speak with you personally to understand exactly what happened and make things right. Please call our office when you have a moment.\n\nSincerely,\nClinic Management`,
          
          `Dear ${author},\n\nThank you for being completely honest with us. I want to sincerely apologize that your experience caused frustration. We treat our patients like family, so hearing that our ${kw} wasn't up to par is very upsetting to our team. We’d love the opportunity to listen to your concerns directly and find a way to resolve this. Please reach out to us at your earliest convenience.\n\nBest regards,\n${clinicName} Team`
        ];
        draft = negativeTemplates[Math.floor(Math.random() * negativeTemplates.length)];
      }
      
      setReplyText(draft);
    }, 800);
  };

  const handleSubmitReply = async (reviewId: string) => {
    if (!replyText) return;
    setSubmittingReply(true);
    try {
      const res = await fetch("/api/gbp/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: reviewId,
          replyText: replyText,
          locationId: activeLocationId,
        })
      });
      if (res.ok) {
        toast.success("Reply posted successfully to Google!");
        setDraftingReplyFor(null);
        setReplyText("");
        window.location.reload(); // Reload to reflect changes
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(`Failed to post: ${errorData?.error || res.statusText}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Error submitting reply: ${e.message}`);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reviews Manager</h1>
          <p className="text-gray-500 mt-1">Manage patient feedback and boost Local SEO with keyword-rich replies.</p>
        </div>
        {insights.newReviewUri && (
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
            <a href={insights.newReviewUri} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Get Review Link
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOP PANEL - WHATSAPP PIPELINE METRICS */}
        {pipelineMetrics && (
          <div className="col-span-1 lg:col-span-3 bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              Automated Review Request Pipeline
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 font-medium mb-1">Surveys Sent</p>
                <p className="text-xl font-bold text-gray-900">{pipelineMetrics.surveySent}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                <p className="text-xs text-emerald-600 font-medium mb-1">Positive Replies</p>
                <p className="text-xl font-bold text-emerald-700">{pipelineMetrics.positiveResponses}</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-3 text-center border border-rose-100">
                <p className="text-xs text-rose-600 font-medium mb-1">Negative Replies</p>
                <p className="text-xl font-bold text-rose-700">{pipelineMetrics.negativeResponses}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-100">
                <p className="text-xs text-indigo-600 font-medium mb-1">Google Links Sent</p>
                <p className="text-xl font-bold text-indigo-700">{pipelineMetrics.linkSent}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
                <p className="text-xs text-amber-600 font-medium mb-1">Cooldown Skipped</p>
                <p className="text-xl font-bold text-amber-700">{pipelineMetrics.cooldownSkipped}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* LEFT PANEL - STATS & FILTERS */}
        <div className="space-y-6">
          {/* Stats Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-6 mb-6">
              <div className="text-center">
                <h2 className="text-5xl font-extrabold text-gray-900">{avgRating}</h2>
                <div className="flex justify-center mt-2 mb-1">
                  <StarRating rating={Math.round(Number(avgRating))} />
                </div>
                <p className="text-xs text-gray-500">{totalReviews} Total Reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {ratingDistribution.map((rd) => (
                  <div key={rd.stars} className="flex items-center gap-2 cursor-pointer group" onClick={() => setStarFilter(starFilter === rd.stars ? null : rd.stars)}>
                    <span className={`text-xs font-medium w-3 ${starFilter === rd.stars ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-900'}`}>{rd.stars}</span>
                    <Star className={`h-3 w-3 ${starFilter === rd.stars ? 'fill-indigo-500 text-indigo-500' : 'fill-gray-300 text-gray-300'}`} />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${starFilter === rd.stars ? 'bg-indigo-500' : 'bg-amber-400'}`} style={{ width: `${rd.percentage}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right">{rd.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-xs text-emerald-600 font-medium mb-1">Response Rate</p>
                <p className="text-xl font-bold text-emerald-700">{responseRate}%</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center cursor-pointer" onClick={() => setFilter(filter === "needs_reply" ? "all" : "needs_reply")}>
                <p className="text-xs text-amber-600 font-medium mb-1">Needs Reply</p>
                <p className="text-xl font-bold text-amber-700">{needsReplyCount}</p>
              </div>
            </div>
          </div>

          {/* AI Auditor Tip */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 p-5">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-indigo-900 mb-1">Local SEO Tip</h3>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Google rewards active profiles. Replying to reviews with relevant local keywords (e.g. "dental implant specialist in Bandra") helps your clinic rank higher in Maps.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - REVIEWS FEED */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-2 shadow-sm">
            <div className="flex gap-1">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-gray-100 text-gray-900 hover:bg-gray-200" : "text-gray-500"}
              >
                All Reviews
              </Button>
              <Button
                variant={filter === "needs_reply" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("needs_reply")}
                className={filter === "needs_reply" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "text-gray-500"}
              >
                Needs Reply
              </Button>
              <Button
                variant={filter === "replied" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("replied")}
                className={filter === "replied" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "text-gray-500"}
              >
                Replied
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search reviews..." 
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters.</p>
              </div>
            ) : (
              filteredReviews.map((review: any, idx: number) => (
                <div key={review.id || idx} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(review.author_name || "A")}`}>
                        {getInitials(review.author_name || "?")}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.author_name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating rating={review.rating} />
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(review.createTime || review.relative_time_description)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {review.text && (
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">{review.text}</p>
                  )}

                  {/* AI Reply Section */}
                  {draftingReplyFor === review.id ? (
                    <div className="bg-indigo-50/50 rounded-lg border border-indigo-100 p-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-indigo-700 font-medium text-sm">
                          <Bot className="h-4 w-4" />
                          AI Keyword-Rich Reply
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setDraftingReplyFor(null)} className="h-7 text-xs text-gray-500">Cancel</Button>
                      </div>
                      <textarea 
                        className="w-full text-sm p-3 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        rows={5}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="flex justify-end mt-3">
                        <Button 
                          onClick={() => handleSubmitReply(review.id)}
                          disabled={submittingReply || !replyText}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {submittingReply ? "Publishing..." : "Publish to Google"}
                        </Button>
                      </div>
                    </div>
                  ) : review.replied ? (
                    <div className="bg-gray-50 rounded-lg p-4 mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-gray-900">Replied from Business</span>
                      </div>
                      <p className="text-sm text-gray-600">{review.replyText || "Thanks for your feedback!"}</p>
                    </div>
                  ) : (
                    <div className="flex justify-end mt-2 border-t border-gray-50 pt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDraftAI(review)}
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-medium"
                      >
                        <Bot className="h-4 w-4 mr-1.5" />
                        Draft AI Reply
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
