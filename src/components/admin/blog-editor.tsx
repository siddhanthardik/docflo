"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Image as ImageIcon,
  Upload,
  Globe,
  Share2,
  HelpCircle,
  ListOrdered,
  Plus,
  Trash2,
  Eye,
  Save,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Search,
  Check,
  AlertCircle,
  FileText,
  Layers,
  Tag,
  User,
  Calendar,
  ExternalLink,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const BLOG_CATEGORIES = [
  "Local SEO & Google Maps",
  "Patient Acquisition",
  "WhatsApp Growth Engine",
  "Clinic Reputation & Reviews",
  "AI & Practice Automation",
  "Doctor Marketing Case Studies",
  "Healthcare Practice Management",
];

interface BlogEditorProps {
  initialData?: any;
  isNew?: boolean;
}

export function BlogEditor({ initialData, isNew = false }: BlogEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [heroImage, setHeroImage] = useState(initialData?.heroImage || "");
  const [heroImageAlt, setHeroImageAlt] = useState(initialData?.heroImageAlt || "");
  const [category, setCategory] = useState(initialData?.category || "Local SEO & Google Maps");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "SCHEDULED">(initialData?.status || "DRAFT");
  const [scheduledFor, setScheduledFor] = useState(
    initialData?.scheduledFor ? new Date(initialData.scheduledFor).toISOString().slice(0, 16) : ""
  );

  // Author E-E-A-T
  const [authorName, setAuthorName] = useState(initialData?.authorName || "Gyrex Medical Growth Team");
  const [authorRole, setAuthorRole] = useState(initialData?.authorRole || "Clinical SEO & Growth Strategist");

  // SEO & Social Meta
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl || "");
  const [keywordInput, setKeywordInput] = useState("");
  const [focusKeywords, setFocusKeywords] = useState<string[]>(initialData?.focusKeywords || []);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);

  // AI & GEO Search Blocks
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    initialData?.keyTakeaways && initialData.keyTakeaways.length > 0
      ? initialData.keyTakeaways
      : [""]
  );

  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>(
    Array.isArray(initialData?.faqItems) && initialData.faqItems.length > 0
      ? initialData.faqItems
      : [{ question: "", answer: "" }]
  );

  // Auto-slugify on title change if creating new post
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (isNew && !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  // Local Image Upload Handler
  const handleLocalImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, isInline = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size must be under 5MB. Please choose a smaller image.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "blog");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (isInline) {
        // Insert markdown image tag into content
        const markdownImg = `\n\n![${file.name.replace(/\.[^/.]+$/, "")}](${data.url})\n\n`;
        setContent((prev: string) => prev + markdownImg);
        toast({
          title: "Image Uploaded & Inserted 🖼️",
          description: "Image markdown code appended to the content.",
        });
      } else {
        setHeroImage(data.url);
        if (!heroImageAlt) {
          setHeroImageAlt(title || file.name.replace(/\.[^/.]+$/, ""));
        }
        toast({
          title: "Hero Image Selected! 📸",
          description: "Selected image uploaded to local storage successfully.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Key Takeaways helpers
  const addTakeaway = () => setKeyTakeaways((prev) => [...prev, ""]);
  const updateTakeaway = (idx: number, text: string) => {
    const next = [...keyTakeaways];
    next[idx] = text;
    setKeyTakeaways(next);
  };
  const removeTakeaway = (idx: number) => {
    setKeyTakeaways((prev) => prev.filter((_, i) => i !== idx));
  };

  // FAQ helpers
  const addFaq = () => setFaqItems((prev) => [...prev, { question: "", answer: "" }]);
  const updateFaq = (idx: number, field: "question" | "answer", val: string) => {
    const next = [...faqItems];
    next[idx][field] = val;
    setFaqItems(next);
  };
  const removeFaq = (idx: number) => {
    setFaqItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Keywords & Tags
  const addKeyword = () => {
    if (keywordInput.trim() && !focusKeywords.includes(keywordInput.trim())) {
      setFocusKeywords((prev) => [...prev, keywordInput.trim()]);
      setKeywordInput("");
    }
  };
  const removeKeyword = (kw: string) => {
    setFocusKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };
  const removeTag = (tg: string) => {
    setTags((prev) => prev.filter((t) => t !== tg));
  };

  // Save Handler
  const handleSave = async (overrideStatus?: "DRAFT" | "PUBLISHED" | "SCHEDULED") => {
    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please enter an article title.", variant: "destructive" });
      return;
    }
    if (!content.trim()) {
      toast({ title: "Content Required", description: "Please write article content.", variant: "destructive" });
      return;
    }

    const finalStatus = overrideStatus || status;

    const payload = {
      title,
      slug: slug || undefined,
      excerpt,
      content,
      heroImage: heroImage || null,
      heroImageAlt,
      category,
      status: finalStatus,
      scheduledFor: finalStatus === "SCHEDULED" && scheduledFor ? scheduledFor : null,
      authorName,
      authorRole,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
      canonicalUrl: canonicalUrl || null,
      focusKeywords,
      tags,
      keyTakeaways: keyTakeaways.filter((t) => t.trim().length > 0),
      faqItems: faqItems.filter((f) => f.question.trim().length > 0 && f.answer.trim().length > 0),
    };

    try {
      setSaving(true);
      const url = isNew ? "/api/admin/blogs" : `/api/admin/blogs/${initialData.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save blog post");

      toast({
        title: finalStatus === "PUBLISHED" ? "Article Published! 🚀" : "Draft Saved Successfully! 💾",
        description: `"${title}" has been saved.`,
      });

      if (isNew && data.id) {
        router.push(`/admin/blogs/${data.id}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      toast({
        title: "Save Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Length calculations for SEO
  const effectiveMetaTitle = metaTitle || title;
  const effectiveMetaDesc = metaDescription || excerpt;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/admin/blogs">
            <Button variant="ghost" size="sm" className="h-9 px-2 text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-1" /> All Articles
            </Button>
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 truncate max-w-md">
              {isNew ? "Create New SEO & AI Article" : title || "Edit Article"}
            </h1>
            <p className="text-xs text-gray-500">
              {status === "PUBLISHED" ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live & Indexed
                </span>
              ) : status === "SCHEDULED" ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Scheduled for {scheduledFor}
                </span>
              ) : (
                <span className="text-slate-400 font-medium">Draft Mode</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isNew && slug && (
            <Link href={`/blog/${slug}`} target="_blank">
              <Button variant="outline" size="sm" className="h-9 text-xs font-semibold">
                <Eye className="w-3.5 h-3.5 mr-1" /> View Live <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="h-9 text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5 mr-1" /> Save Draft
          </Button>

          <Button
            size="sm"
            onClick={() => handleSave("PUBLISHED")}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
            {saving ? "Publishing..." : "Publish Article"}
          </Button>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editor Tabs (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-xl h-11">
              <TabsTrigger value="content" className="rounded-lg text-xs font-bold gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Content & Media
              </TabsTrigger>
              <TabsTrigger value="ai-geo" className="rounded-lg text-xs font-bold gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-600" /> AI &amp; GEO Blocks
              </TabsTrigger>
              <TabsTrigger value="seo" className="rounded-lg text-xs font-bold gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" /> SEO &amp; Social
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Content & Hero Image */}
            <TabsContent value="content" className="space-y-6 mt-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Article Title *</label>
                  <Input
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="e.g. How South Delhi Dermatologists Reach Rank #1 on Google Maps in 30 Days"
                    className="text-base font-bold h-12 rounded-xl"
                    required
                  />
                </div>

                {/* Excerpt / Lead Paragraph */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Short Excerpt / Lead Summary
                  </label>
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="A punchy 1-2 sentence hook summarizing the clinical takeaway..."
                    rows={2}
                    className="text-xs rounded-xl"
                  />
                </div>

                {/* Hero Image Selector from Local Computer */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-600" /> Hero Image (Select from Local File)
                    </label>
                    {heroImage && (
                      <button
                        onClick={() => setHeroImage("")}
                        className="text-[11px] text-red-600 hover:underline font-semibold"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  {heroImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video max-h-72 bg-slate-100 group">
                      <img
                        src={heroImage}
                        alt={heroImageAlt || "Hero Image Preview"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-bold text-xs h-9"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" /> Replace Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-indigo-50/40 space-y-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">
                          Click to Select Hero Image from Your Local Computer
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Supports JPEG, PNG, WebP (Max 5MB)
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingImage}
                        className="h-8 text-xs font-bold rounded-xl"
                      >
                        {uploadingImage ? "Uploading..." : "Browse Files"}
                      </Button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleLocalImageSelect(e, false)}
                  />

                  {heroImage && (
                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-semibold text-gray-600">Hero Image Alt Text (For Google Image SEO)</label>
                      <Input
                        value={heroImageAlt}
                        onChange={(e) => setHeroImageAlt(e.target.value)}
                        placeholder="e.g. Doctor optimizing Google Business Profile on laptop"
                        className="h-9 text-xs rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Markdown / HTML Content Area */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Article Content (Markdown Supported) *
                    </label>
                    
                    {/* Inline Image Upload from Local Computer */}
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => inlineImageInputRef.current?.click()}
                        className="h-7 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50"
                      >
                        <Upload className="w-3 h-3 mr-1" /> Insert Local Image
                      </Button>
                      <input
                        ref={inlineImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleLocalImageSelect(e, true)}
                      />
                    </div>
                  </div>

                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write article in Markdown: # Heading, ## Subheading, **Bold**, - Lists, > Quotes, [Links](url)..."
                    rows={18}
                    className="font-mono text-xs leading-relaxed p-4 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <p className="text-[11px] text-gray-400">
                    Tip: Use ## for Major Headings and ### for Subheadings to auto-generate the reader Table of Contents.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: AI Search & GEO Optimization Blocks */}
            <TabsContent value="ai-geo" className="space-y-6 mt-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Generative Engine Optimization (GEO)
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    AI Search Direct Answer Blocks (Google SGE, ChatGPT &amp; Perplexity)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    AI models quote structured summaries and FAQs when generating conversational answers for patients and doctors.
                  </p>
                </div>

                {/* Key Takeaways Builder */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4 text-indigo-600" /> Executive Key Takeaways (Top Callout Box)
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTakeaway}
                      className="h-7 text-xs font-bold"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Point
                    </Button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Displayed in a highlighted banner at the top of the article. Highly cited by Perplexity and Google AI Overviews.
                  </p>

                  <div className="space-y-2">
                    {keyTakeaways.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <Input
                          value={point}
                          onChange={(e) => updateTakeaway(idx, e.target.value)}
                          placeholder="e.g. 78% of local patient searches convert through the Google Map 3-pack."
                          className="h-9 text-xs rounded-xl"
                        />
                        {keyTakeaways.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTakeaway(idx)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ Builder & JSON-LD Schema */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-emerald-600" /> Frequently Asked Questions (FAQ Schema Markup)
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFaq}
                      className="h-7 text-xs font-bold"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add FAQ
                    </Button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Automatically injects Google FAQPage Schema to trigger interactive expandable dropdowns directly on Google Search results.
                  </p>

                  <div className="space-y-4">
                    {faqItems.map((faq, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-900">FAQ Question #{idx + 1}</span>
                          {faqItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFaq(idx)}
                              className="text-gray-400 hover:text-red-600 text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>
                        <Input
                          value={faq.question}
                          onChange={(e) => updateFaq(idx, "question", e.target.value)}
                          placeholder="e.g. How fast does a Google Business Profile category update take to index?"
                          className="h-9 text-xs bg-white rounded-lg font-medium"
                        />
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                          placeholder="Answer: Category changes typically update within 7-14 days on Google Maps..."
                          rows={2}
                          className="text-xs bg-white rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: SEO, Canonical & Social Card Previews */}
            <TabsContent value="seo" className="space-y-6 mt-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Search Engine &amp; Social Optimization</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize meta tags and verify SERP snippet previews.</p>
                </div>

                {/* Meta Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">SEO Meta Title</label>
                    <span className={`text-[11px] font-semibold ${effectiveMetaTitle.length > 60 ? "text-amber-600" : "text-gray-400"}`}>
                      {effectiveMetaTitle.length}/60 chars
                    </span>
                  </div>
                  <Input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={title || "Article SEO Title..."}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                {/* Meta Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">SEO Meta Description</label>
                    <span className={`text-[11px] font-semibold ${effectiveMetaDesc.length > 160 ? "text-amber-600" : "text-gray-400"}`}>
                      {effectiveMetaDesc.length}/160 chars
                    </span>
                  </div>
                  <Textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder={excerpt || "Compelling 150-160 character description shown on Google SERP results..."}
                    rows={3}
                    className="text-xs rounded-xl"
                  />
                </div>

                {/* Focus Keywords */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Target Focus Keywords</label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                      placeholder="e.g. Dermatologist SEO, Google Maps 3-pack"
                      className="h-9 text-xs rounded-xl"
                    />
                    <Button type="button" size="sm" onClick={addKeyword} className="h-9 text-xs font-bold">
                      Add
                    </Button>
                  </div>
                  {focusKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {focusKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100"
                        >
                          {kw}
                          <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-600">
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Canonical URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Canonical URL (Optional)</label>
                  <Input
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://gyrex.in/blog/your-custom-canonical"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                {/* Google SERP Snippet Preview */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-blue-600" /> Google Search SERP Preview
                  </label>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1 max-w-xl">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                      <span>https://gyrex.in</span>
                      <span>›</span>
                      <span>blog</span>
                      <span>›</span>
                      <span className="text-slate-700 font-mono">{slug || "article-slug"}</span>
                    </div>
                    <h4 className="text-base text-blue-700 hover:underline font-semibold cursor-pointer truncate">
                      {effectiveMetaTitle || "Article Title on Google Search"}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {effectiveMetaDesc || "Article meta description snippet showing how this article appears to searchers on Google and Bing."}
                    </p>
                  </div>
                </div>

                {/* WhatsApp & Social Media Preview Card */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-emerald-600" /> Social &amp; WhatsApp Share Preview
                  </label>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 max-w-md bg-white shadow-xs">
                    {heroImage ? (
                      <div className="aspect-[1.91/1] bg-slate-100 overflow-hidden">
                        <img src={heroImage} alt="Social Card" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-[1.91/1] bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center text-white text-xs font-bold p-6 text-center">
                        Gyrex Clinical Growth Blog
                      </div>
                    )}
                    <div className="p-3.5 space-y-1 bg-slate-50 border-t border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">gyrex.in/blog</p>
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {effectiveMetaTitle || "Article Title"}
                      </h5>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {effectiveMetaDesc || "Short excerpt snippet..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Publishing Sidebar Settings (1 Col) */}
        <div className="space-y-6">
          {/* Status & Publication */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Publishing Controls</h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published (Live)</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </div>

            {status === "SCHEDULED" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Schedule Date &amp; Time
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            )}

            {/* Custom URL Slug */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-600">URL Slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-slug"
                className="h-9 text-xs font-mono rounded-lg"
              />
              <p className="text-[10px] text-gray-400 truncate">gyrex.in/blog/{slug || "slug"}</p>
            </div>

            <Button
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 rounded-xl shadow-xs"
            >
              {saving ? "Saving..." : status === "PUBLISHED" ? "Update Live Article" : "Save Draft"}
            </Button>
          </div>

          {/* Categorization & Tags */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Category &amp; Tags
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Primary Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {BLOG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-gray-400" /> Article Tags
              </label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="e.g. Dermatology"
                  className="h-8 text-xs rounded-lg"
                />
                <Button type="button" size="sm" onClick={addTag} className="h-8 text-xs font-bold px-2.5">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {tags.map((tg) => (
                    <span
                      key={tg}
                      className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                    >
                      {tg}
                      <button type="button" onClick={() => removeTag(tg)} className="hover:text-red-600">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Author E-E-A-T Profile */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" /> Author E-E-A-T Profile
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Author Name</label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="h-9 text-xs rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Author Clinical / SEO Role</label>
              <Input
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="e.g. Clinical SEO Specialist"
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
