"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Image as ImageIcon, Calendar, Send, Upload, Globe, MoreVertical, X, Clock, CheckCircle2, Eye, Sparkles, Bot, AlertTriangle, AlertCircle, Phone, Copy, Check, ExternalLink, ShieldCheck } from "lucide-react"
import { format } from "date-fns"

export function PostScheduler() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [form, setForm] = useState({
    title: "",
    content: "",
    postType: "STANDARD",
    scheduledDate: "",
    imageUrl: "",
    ctaType: "NONE",
    ctaLink: "",
  })

  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeAccount, setActiveAccount] = useState<any>(null)
  const [postHistory, setPostHistory] = useState<any[]>([])

  // Live Preview & Animation State
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const [publishedPostData, setPublishedPostData] = useState<any>(null)
  const [overlayMessage, setOverlayMessage] = useState("")

  // Error & Policy Guidance State
  const [publishingError, setPublishingError] = useState<{
    friendlyMessage: string;
    suggestedFix: string;
    policyViolationType?: string;
    field?: string;
  } | null>(null)
  const [copiedFallback, setCopiedFallback] = useState(false)

  // AI Generation State
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiTone, setAiTone] = useState("Professional")
  const [isGenerating, setIsGenerating] = useState(false)
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null)

  const handleGenerateAI = async (overrideTopic?: string, overrideImageUrl?: string, overrideKeywords?: string[]) => {
    const topicToUse = overrideTopic || aiTopic.trim();
    const imageToUse = overrideImageUrl || form.imageUrl;
    const keywordsToUse = overrideKeywords || [];

    if (!topicToUse && !imageToUse) {
      toast({ title: "Topic required", description: "Please enter a topic or upload an image.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/gbp/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicToUse,
          imageUrl: imageToUse || undefined,
          tone: aiTone,
          targetKeywords: keywordsToUse
        })
      });

      const data = await res.json();

      if (res.ok) {
        const autoCta = data.suggestedCtaType || "CALL";
        const autoBookingUrl = activeAccount?.insightsData?.websiteUri || "";
        setForm(prev => ({ 
          ...prev, 
          content: data.content,
          ctaType: autoCta,
          ctaLink: (autoCta === "BOOK" || autoCta === "LEARN_MORE") && !prev.ctaLink ? autoBookingUrl : prev.ctaLink
        }));
        setPublishingError(null);
        toast({ 
          title: "Update drafted with AI! ✨", 
          description: `Content generated and button set to "${autoCta === "CALL" ? "Call now" : autoCta === "BOOK" ? "Book" : "Learn more"}".` 
        });
        setShowAIDialog(false);
        setAiTopic("");
      } else {
        if (res.status === 402) {
          toast({ title: "Insufficient AI Credits", description: "You have run out of AI credits for this month. Please upgrade your plan or wait until next month.", variant: "destructive" });
        } else if (res.status === 403) {
          toast({ title: "Upgrade Required", description: data.error || "Your subscription plan does not include AI features.", variant: "destructive" });
        } else {
          toast({ title: "Generation failed", description: data.error || "An error occurred while generating the post.", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Generation failed", description: "Network error occurred.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Check for draftKeyword search parameter
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const kw = params.get("draftKeyword");
      if (kw) {
        // Clean URL to prevent re-triggering on reload
        window.history.replaceState({}, document.title, window.location.pathname);
        toast({
          title: "Drafting Update with AI ✨",
          description: `Google Updates Assistant is crafting a targeted clinical update for "${kw}"...`,
        });
        handleGenerateAI(`Specialized patient care and guidance regarding ${kw}`, undefined, [kw]);
      }
    }

    // Fetch account info for the preview header
    fetch("/api/gbp/insights")
      .then(res => res.json())
      .then(data => setActiveAccount(data.account))
      .catch(console.error)

    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/gbp/posts")
      if (res.ok) {
        setPostHistory(await res.json())
      }
    } catch(e) {
      console.error(e)
    }
  }

  // Real-time phone number detection for Google Policy anti-spam compliance
  const phonePatternWithLabels = /(?:📞|☎️|📱|Tel|Phone|Call|Mobile|Contact)(?:\s*(?:us|today|now)?)?(?:\s*(?:at|on|:))?\s*(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/gi;
  const rawPhonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}/g;

  const detectedPhones = form.content.match(rawPhonePattern) || [];
  const hasPhoneInContent = phonePatternWithLabels.test(form.content) || detectedPhones.some(m => m.replace(/\D/g, "").length >= 10);
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const hasUrlInContent = urlPattern.test(form.content);

  const handleMovePhoneToCallButton = () => {
    const cleaned = form.content
      .replace(phonePatternWithLabels, "")
      .replace(rawPhonePattern, "")
      .replace(/[ \t]+/g, " ")
      .trim();

    setForm(prev => ({
      ...prev,
      content: cleaned,
      ctaType: "CALL",
    }));

    if (publishingError?.policyViolationType === "PHONE") {
      setPublishingError(null);
    }

    toast({
      title: "Updated for Google Policy ✨",
      description: "Phone number removed from description and 'Call now' button activated."
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPublishingError(null)

    // Google Business Profile strictly requires JPG or PNG
    const validTypes = ["image/jpeg", "image/png", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Google Requires JPG or PNG",
        description: "Google Business Profile only accepts JPG or PNG photos. Please select a JPG or PNG image.",
        variant: "destructive"
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image Exceeds 5MB Limit",
        description: "Google Business Profile requires photos to be under 5MB for optimal quality.",
        variant: "destructive"
      })
      return
    }

    // Check dimensions in browser before uploading
    const objectUrl = URL.createObjectURL(file)
    const imgTest = new window.Image()
    imgTest.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (imgTest.width < 250 || imgTest.height < 250) {
        toast({
          title: "Resolution Notice",
          description: "Google recommends images at least 250×250 px (optimal: 1200×900 px). This image may appear small or blurry on Google Maps.",
        })
      }
    }
    imgTest.src = objectUrl

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "gbp") // Ensures backend outputs progressive Google-compliant JPEG

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setForm({ ...form, imageUrl: data.url })
        toast({ title: "Google-ready photo uploaded!", description: "Formatted as progressive high-quality JPEG." })
      } else {
        throw new Error("No URL returned")
      }
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (isScheduled: boolean) => {
    if (!form.content.trim()) {
      toast({ title: "Content is required", variant: "destructive" })
      return
    }

    if (form.ctaType !== "NONE" && form.ctaType !== "CALL" && !form.ctaLink?.trim()) {
      const missingLinkErr = {
        friendlyMessage: `Link required for "${getCtaLabel(form.ctaType)}" button`,
        suggestedFix: `Google requires a valid website address (starting with https://) when you add an action button. Please enter your link or switch button to "None".`,
        policyViolationType: "URL",
        field: "ctaLink"
      }
      setPublishingError(missingLinkErr)
      toast({
        title: "Action Button Link Missing",
        description: missingLinkErr.suggestedFix,
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    setPublishingError(null)

    try {
      const payload: any = { ...form }
      if (!isScheduled) {
        delete payload.scheduledDate
      }

      const res = await fetch("/api/gbp/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (res.ok) {
        const msg = isScheduled ? "Post Scheduled Successfully!" : "Live on Google Search & Maps"
        toast({ title: isScheduled ? "Post Scheduled!" : "Post Published to Google!" })
        
        // Trigger Success Overlay on the Mobile Preview
        setPublishedPostData({ ...form })
        setOverlayMessage(msg)
        setShowSuccessOverlay(true)

        // Clear Composer
        setForm({
          title: "", content: "", postType: "STANDARD", scheduledDate: "", imageUrl: "", ctaType: "NONE", ctaLink: ""
        })
        fetchHistory()

        // Reset overlay after 3s
        setTimeout(() => {
          setShowSuccessOverlay(false)
          setTimeout(() => setPublishedPostData(null), 300)
        }, 3000)
      } else {
        const data = await res.json().catch(() => ({}))
        const errObj = {
          friendlyMessage: data.friendlyMessage || data.error || data.message || "An error occurred while communicating with Google.",
          suggestedFix: data.suggestedFix || "Please review your post text and settings, then try again.",
          policyViolationType: data.policyViolationType || "GENERAL",
          field: data.field || "general"
        }
        setPublishingError(errObj)
        toast({ 
          title: isScheduled ? "Failed to schedule post" : "Google Rejected Update", 
          description: errObj.friendlyMessage, 
          variant: "destructive" 
        })
      }
    } catch (error) {
      const fallbackErr = {
        friendlyMessage: "Failed to communicate with publishing service.",
        suggestedFix: "Please check your network connection and try again.",
        policyViolationType: "GENERAL",
      }
      setPublishingError(fallbackErr)
      toast({ title: "Failed to publish", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCtaLabel = (type: string) => {
    const map: any = {
      LEARN_MORE: "Learn more",
      BOOK: "Book",
      CALL: "Call now",
      SIGN_UP: "Sign up",
      ORDER: "Order online"
    }
    return map[type] || "Learn more"
  }

  const handleDraftClick = () => {
    if (form.imageUrl || form.content.trim()) {
      handleGenerateAI(form.content.trim(), form.imageUrl);
    } else {
      setShowAIDialog(true);
    }
  };

  const handlePublishDraft = async (postId: string) => {
    setPublishingDraftId(postId);
    setPublishingError(null);
    try {
      const res = await fetch(`/api/gbp/posts/${postId}/publish`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast({ title: "Post Published to Google Live! 🚀", description: "Your post is now live on Google Search & Maps." });
        fetchHistory();
      } else {
        const errObj = {
          friendlyMessage: data.friendlyMessage || data.error || data.message || "Could not publish draft post to Google.",
          suggestedFix: data.suggestedFix || "Please check your post text and images against Google policy and try again.",
          policyViolationType: data.policyViolationType || "GENERAL",
          field: data.field || "general"
        };
        setPublishingError(errObj);
        toast({
          title: "Publishing Failed",
          description: errObj.friendlyMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Publishing Failed", description: "Network error occurred.", variant: "destructive" });
    } finally {
      setPublishingDraftId(null);
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* FULL SCREEN SUCCESS MODAL */}
      {showSuccessOverlay && (
        <>
          <style>{`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center transform animate-in zoom-in-90 duration-500 max-w-[450px] w-full text-center border-t-8 border-t-emerald-500 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
            
            <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/50 shadow-inner">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 drop-shadow-sm" />
            </div>
            
            <h3 className="font-extrabold text-gray-900 text-3xl tracking-tight relative z-10 mb-3 leading-tight">
              {overlayMessage.includes('Scheduled') ? 'Post Scheduled!' : 'Posted on Google!'}
            </h3>
            
            <p className="text-base text-gray-500 font-medium relative z-10">
              {overlayMessage.includes('Scheduled') 
                ? 'Your post has been successfully scheduled and will go live automatically.' 
                : 'Your post is now live and visible to patients on Google Search and Maps.'}
            </p>
            
            <div className="mt-8 relative z-10 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full origin-left animate-[shrink_3s_linear_forwards]"></div>
            </div>
          </div>
        </div>
        </>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
        {/* COMPOSER (LEFT) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-full ring-1 ring-black/5">
          <div className="px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-xl flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              Create Google Update
            </h2>
            <div className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              {form.content.length} / 1500
            </div>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Post Type */}
            <div>
              <Label className="text-gray-700 font-semibold mb-2 block">Post Type</Label>
              <Select value={form.postType} onValueChange={(v) => setForm({...form, postType: v})}>
                <SelectTrigger className="w-full sm:w-1/2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Update</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="OFFER">Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Media Upload */}
            <div>
              <Label className="text-gray-700 font-semibold mb-2 block">Media (Optional)</Label>
              {!form.imageUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-all duration-300 group shadow-sm"
                >
                  <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
                    <Upload className="h-6 w-6 text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Click to upload high-quality media</p>
                  <p className="text-xs text-gray-500">JPG or PNG. Max 5MB for best results.</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/jpeg, image/png"
                    onChange={handleImageUpload}
                  />
                  {isUploading && <p className="text-xs text-indigo-600 font-bold mt-3 flex items-center justify-center gap-1"><Sparkles className="h-3 w-3 animate-spin"/> Uploading...</p>}
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 w-full sm:w-1/2 group">
                  <img src={form.imageUrl} alt="Upload preview" className="w-full h-32 object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Google Format (JPG)
                  </div>
                  <button 
                    onClick={() => {
                      setForm({...form, imageUrl: ""});
                      if (publishingError?.policyViolationType === "MEDIA") setPublishingError(null);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Content Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-700 font-semibold block">Post Content <span className="text-red-500">*</span></Label>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isGenerating}
                  onClick={handleDraftClick}
                  className="h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                >
                  {isGenerating ? (
                    <><Sparkles className="w-4 h-4 mr-2 animate-spin text-indigo-600" /> Generating Update...</>
                  ) : (
                    <><Bot className="w-4 h-4 mr-2" /> Draft with AI</>
                  )}
                </Button>
              </div>
              <Textarea 
                value={form.content} 
                onChange={(e) => {
                  setForm({...form, content: e.target.value.substring(0, 1500)});
                  if (publishingError?.field === "content") setPublishingError(null);
                }} 
                rows={5} 
                placeholder={isGenerating ? "Google Updates Assistant is crafting your update..." : "What's new at your clinic?"}
                className="resize-none focus:ring-indigo-500"
              />
            </div>

            {/* Real-time Policy Auditor */}
            {hasPhoneInContent && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-xs animate-in fade-in duration-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-bold text-amber-900 text-sm">Google Policy Alert: Phone Number Detected in Text</h5>
                  <p className="mt-1 text-amber-800 leading-relaxed">
                    Google strictly forbids phone numbers in post descriptions (to prevent spam). If published with a phone number in the body, Google will reject the post. Phone numbers should be offered via the <strong>&quot;Call now&quot;</strong> button instead.
                  </p>
                  <div className="mt-2.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleMovePhoneToCallButton}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8 rounded-lg shadow-xs"
                    >
                      <Phone className="h-3.5 w-3.5 mr-1.5" /> Auto-Move to &quot;Call Now&quot; Button
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {hasUrlInContent && (
              <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">Google Policy Tip: </span>
                  Web links in body text are not clickable on Google Search or Maps. We recommend placing your link in the Action Button below (e.g. &quot;Book&quot; or &quot;Learn more&quot;) for the best patient conversion.
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold mb-2 block">Button (Optional)</Label>
                <Select
                  value={form.ctaType}
                  onValueChange={(v) => {
                    const clinicUrl = activeAccount?.insightsData?.websiteUri || "";
                    setForm(prev => ({
                      ...prev,
                      ctaType: v,
                      ctaLink: (v === "BOOK" || v === "LEARN_MORE") && !prev.ctaLink ? clinicUrl : prev.ctaLink
                    }));
                    if (publishingError?.policyViolationType === "URL") {
                      setPublishingError(null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="LEARN_MORE">Learn more</SelectItem>
                    <SelectItem value="BOOK">Book</SelectItem>
                    <SelectItem value="CALL">Call now</SelectItem>
                    <SelectItem value="SIGN_UP">Sign up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {form.ctaType !== "NONE" && form.ctaType !== "CALL" && (
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">
                    Link for your button <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    placeholder="https://yourclinic.com/booking"
                    value={form.ctaLink} 
                    onChange={(e) => {
                      setForm({...form, ctaLink: e.target.value});
                      if (publishingError?.policyViolationType === "URL") setPublishingError(null);
                    }} 
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Must start with https:// for Google compliance</p>
                </div>
              )}
              {form.ctaType === "CALL" && (
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">Action</Label>
                  <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <span>Patients will call your Google-verified clinic phone directly.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Scheduler */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
              <div className="flex-1 w-full relative">
                <Label className="text-gray-900 font-bold mb-2 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" /> Schedule (Optional)
                </Label>
                <p className="text-xs text-gray-500 mb-3">Set a future date to automatically publish this post.</p>
                <Input 
                  type="datetime-local" 
                  value={form.scheduledDate} 
                  onChange={(e) => setForm({...form, scheduledDate: e.target.value})} 
                  className="bg-white border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl px-4 py-6 font-medium text-gray-700 w-full hover:border-gray-300 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* IN-PAGE ACTIONABLE ERROR BANNER */}
          {publishingError && (
            <div className="mx-6 mb-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-xs text-red-900 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-900 text-sm">{publishingError.friendlyMessage}</h4>
                    <p className="mt-1 text-red-700 leading-relaxed font-medium text-xs">{publishingError.suggestedFix}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setPublishingError(null)}
                  className="text-red-400 hover:text-red-600 p-1 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-3 pt-3 border-t border-red-100 flex flex-wrap items-center gap-2">
                {publishingError.policyViolationType === "PHONE" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleMovePhoneToCallButton}
                    className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs font-semibold rounded-lg shadow-xs"
                  >
                    <Phone className="h-3 w-3 mr-1" /> Fix: Move Phone to &quot;Call Now&quot;
                  </Button>
                )}
                {publishingError.policyViolationType === "MEDIA" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm(prev => ({ ...prev, imageUrl: "" }));
                      setPublishingError(null);
                      toast({ title: "Photo removed", description: "You can now publish as a text update." });
                    }}
                    className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-100/50 bg-white shadow-xs font-semibold"
                  >
                    Remove Photo & Post as Text
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(form.content);
                    setCopiedFallback(true);
                    setTimeout(() => setCopiedFallback(false), 3000);
                    toast({ title: "Text copied to clipboard!", description: "Opening Google Business Profile manager..." });
                    window.open("https://business.google.com/locations", "_blank");
                  }}
                  className="h-8 text-xs border-red-200 text-red-800 hover:bg-white bg-white shadow-xs font-medium"
                >
                  {copiedFallback ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1 text-red-600" />}
                  {copiedFallback ? "Copied! Opening Google..." : "Copy Post & Open Google Profile"}
                  <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                </Button>
              </div>
            </div>
          )}

          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-end gap-4">
            {form.scheduledDate ? (
              <Button 
                onClick={() => handleSubmit(true)} 
                disabled={isSubmitting || !form.content}
                className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto shadow-lg rounded-full px-8 py-6 text-base font-bold transition-all hover:shadow-xl hover:scale-105"
              >
                <Calendar className="h-5 w-5 mr-2" /> Schedule for Later
              </Button>
            ) : (
              <Button 
                onClick={() => handleSubmit(false)} 
                disabled={isSubmitting || !form.content}
                className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto shadow-lg font-bold rounded-full px-8 py-6 text-base transition-all hover:shadow-xl hover:scale-105"
              >
                <Globe className="h-5 w-5 mr-2" /> Publish Now to Google
              </Button>
            )}
          </div>
        </div>

        {/* LIVE PREVIEW (RIGHT) */}
        <div className="sticky top-6 flex flex-col items-center">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-xl bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100">
            <Eye className="h-5 w-5 text-indigo-500" /> Live Mobile Preview
          </h3>
          
          <div className="bg-white rounded-[2.5rem] border-[8px] border-gray-900 shadow-2xl overflow-hidden w-full max-w-[375px] mx-auto relative h-[700px] flex flex-col ring-4 ring-gray-100">
            
            {/* SUCCESS OVERLAY */}
            {/* Fake Mobile Header */}
            <div className="bg-gray-100 px-6 pt-3 pb-2 flex justify-between items-center text-[10px] font-medium text-gray-900 sticky top-0 z-20">
              <span>9:41</span>
              <div className="flex gap-1.5 items-center">
                <div className="w-4 h-2.5 bg-black rounded-sm"></div>
                <div className="w-3.5 h-3.5 bg-black rounded-full"></div>
              </div>
            </div>

            {/* Fake Google Search Bar */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 shadow-sm sticky top-[28px] z-10 flex items-center justify-between">
               <span className="font-bold text-gray-900 truncate pr-4 text-sm">{activeAccount?.accountName || "Your Clinic Name"}</span>
               <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">C</div>
            </div>

            {/* Scrollable Post Feed */}
            <div className="flex-1 overflow-y-auto bg-gray-100">
              <div className="p-3">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
                  {/* Post Header */}
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                      {activeAccount?.accountName?.charAt(0) || "C"}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 truncate leading-tight">{activeAccount?.accountName || "Your Clinic Name"}</h4>
                      <p className="text-xs text-gray-500">Just now</p>
                    </div>
                    <MoreVertical className="h-4 w-4 text-gray-400 ml-auto" />
                  </div>

                  {/* Post Image */}
                  {(publishedPostData || form).imageUrl ? (
                    <img src={(publishedPostData || form).imageUrl} alt="Post image" className="w-full h-[220px] object-cover" />
                  ) : (
                    <div className="w-full h-[220px] bg-gray-50 flex items-center justify-center border-y border-gray-100">
                      <ImageIcon className="h-10 w-10 text-gray-300" />
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="p-4">
                    {(publishedPostData || form).postType === "OFFER" && (
                      <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase rounded-full mb-3 tracking-wide">Offer</span>
                    )}
                    {(publishedPostData || form).postType === "EVENT" && (
                      <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase rounded-full mb-3 tracking-wide">Event</span>
                    )}
                    <p className="text-[15px] text-gray-800 whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {(publishedPostData || form).content || "Your post description will appear here. Start typing to see the preview..."}
                    </p>
                    
                    {(publishedPostData || form).content.length > 120 && (
                      <button className="text-indigo-600 text-sm font-semibold mt-1">Read more</button>
                    )}

                    {/* CTA Button */}
                    {(publishedPostData || form).ctaType !== "NONE" && (
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <div className="w-full py-2.5 px-4 rounded-full border border-blue-600 text-blue-600 font-bold text-sm text-center flex items-center justify-center gap-1 hover:bg-blue-50 transition-colors">
                          {getCtaLabel((publishedPostData || form).ctaType)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skeleton of previous post for realism */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden opacity-50 pointer-events-none">
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div className="space-y-1">
                      <div className="w-24 h-3 bg-gray-200 rounded"></div>
                      <div className="w-16 h-2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-full h-32 bg-gray-100"></div>
                </div>
              </div>
            </div>

            {/* Mobile Home Bar */}
            <div className="h-1.5 w-1/3 bg-gray-300 mx-auto rounded-full absolute bottom-2 left-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mt-16 ring-1 ring-black/5">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            Post History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-gray-100 text-gray-500">
              <tr>
                <th className="font-semibold px-6 py-4 w-[35%]">Post Content</th>
                <th className="font-semibold px-6 py-4">Status</th>
                <th className="font-semibold px-6 py-4">Date</th>
                <th className="font-semibold px-6 py-4">Type</th>
                <th className="font-semibold px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {postHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-500 font-medium">No posts found.</p>
                  </td>
                </tr>
              ) : (
                postHistory.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {post.imageUrl && (
                          <img src={post.imageUrl} className="w-12 h-12 rounded object-cover shrink-0 border border-gray-200" />
                        )}
                        <p className="text-gray-900 line-clamp-2">{post.content}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.status === "PUBLISHED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 className="h-3 w-3" /> Live
                        </span>
                      ) : post.status === "SCHEDULED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Clock className="h-3 w-3" /> Scheduled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {post.status === "SCHEDULED" && post.scheduledFor
                        ? format(new Date(post.scheduledFor), "MMM d, yyyy h:mm a")
                        : format(new Date(post.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                        {post.postType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(post.status === "DRAFT" || post.status === "SCHEDULED") && (
                        <Button
                          size="sm"
                          disabled={publishingDraftId === post.id}
                          onClick={() => handlePublishDraft(post.id)}
                          className={`${
                            post.status === "SCHEDULED"
                              ? "bg-indigo-600 hover:bg-indigo-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          } text-white font-bold h-8 text-xs rounded-full px-3.5 shadow-sm transition-all hover:scale-105`}
                        >
                          {publishingDraftId === post.id ? (
                            <><Sparkles className="h-3.5 w-3.5 mr-1 animate-spin" /> Publishing...</>
                          ) : post.status === "SCHEDULED" ? (
                            <><Globe className="h-3.5 w-3.5 mr-1" /> Publish Now</>
                          ) : (
                            <><Globe className="h-3.5 w-3.5 mr-1" /> Publish to Google</>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* AI Draft Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              Draft Google Update with AI
            </DialogTitle>
            <DialogDescription>
              Enter a clinical topic or health advisory and let Google Updates Assistant draft a policy-compliant update for your practice.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Textarea 
                placeholder="e.g. Flu season vaccines available now. Walk-ins welcome!" 
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={aiTone} onValueChange={setAiTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Informative">Informative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)} disabled={isGenerating}>Cancel</Button>
            <Button onClick={() => handleGenerateAI()} disabled={isGenerating || !aiTopic.trim()}>
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Draft"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}