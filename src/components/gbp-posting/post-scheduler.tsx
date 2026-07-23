"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Image as ImageIcon, Calendar, Send, Upload, Globe, MoreVertical, X, Clock, CheckCircle2, Eye, Sparkles } from "lucide-react"
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

  useEffect(() => {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setForm({ ...form, imageUrl: data.url })
        toast({ title: "Image uploaded successfully!" })
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
    if (!form.content) {
      toast({ title: "Content is required", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
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
          setTimeout(() => setPublishedPostData(null), 300) // slight delay to prevent flicker during fade out
        }, 3000)
      } else {
        toast({ title: "Error saving post", variant: "destructive" })
      }
    } catch (error) {
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
              Create Post
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
                  <button 
                    onClick={() => setForm({...form, imageUrl: ""})}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Content Textarea */}
            <div>
              <Label className="text-gray-700 font-semibold mb-2 block">Post Content <span className="text-red-500">*</span></Label>
              <Textarea 
                value={form.content} 
                onChange={(e) => setForm({...form, content: e.target.value.substring(0, 1500)})} 
                rows={5} 
                placeholder="What's new at your clinic?"
                className="resize-none focus:ring-indigo-500"
              />
            </div>

            {/* CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold mb-2 block">Button (Optional)</Label>
                <Select value={form.ctaType} onValueChange={(v) => setForm({...form, ctaType: v})}>
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
              
              {form.ctaType !== "NONE" && (
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">Link for your button</Label>
                  <Input 
                    placeholder="https://yourclinic.com/booking"
                    value={form.ctaLink} 
                    onChange={(e) => setForm({...form, ctaLink: e.target.value})} 
                  />
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
                <th className="font-semibold px-6 py-4 w-[40%]">Post Content</th>
                <th className="font-semibold px-6 py-4">Status</th>
                <th className="font-semibold px-6 py-4">Date</th>
                <th className="font-semibold px-6 py-4">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {postHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
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
                    <td className="px-6 py-4 text-gray-600">
                      {format(new Date(post.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                        {post.postType}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}