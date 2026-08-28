"use client";

import { useState, useRef, useEffect } from "react";
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
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Table as TableIcon,
  Minus,
  Undo,
  Redo,
  Highlighter,
  Lightbulb,
  AlertTriangle,
  BookmarkCheck,
  Type,
  Maximize2,
  Minimize2,
  Code2,
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
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [editorMode, setEditorMode] = useState<"visual" | "code" | "preview">("visual");

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

  // Link Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

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

  // Metrics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

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

  // Helper to insert formatting tags at cursor position
  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end) || placeholder;
      const replacement = prefix + selected + suffix;
      const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      }, 50);
    } else {
      setContent((prev: string) => prev + "\n\n" + prefix + (placeholder || "Text") + suffix);
    }
  };

  // Quick Insertion Helpers
  const insertHeading = (level: 2 | 3 | 4) => {
    const hashes = "#".repeat(level);
    insertFormatting(`\n${hashes} `, "\n", `Heading ${level}`);
  };

  const insertCallout = (type: "tip" | "note" | "warning") => {
    if (type === "tip") {
      insertFormatting("\n> 💡 **Clinical Tip**: ", "\n", "Add actionable growth recommendation for clinic staff...");
    } else if (type === "note") {
      insertFormatting("\n> 📌 **Key Practice Note**: ", "\n", "Highlight critical patient retention or SEO guideline...");
    } else {
      insertFormatting("\n> ⚠️ **Important Caution**: ", "\n", "Mention pitfalls to avoid in medical advertising or compliance...");
    }
  };

  const insertTable = () => {
    const sampleTable = `\n| Metric / Feature | Traditional Method | Gyrex Automated System |\n| :--- | :--- | :--- |\n| Patient Booking Speed | 15-30 Mins Waiting | Instant in 10 Seconds |\n| Google Review Velocity | 1-2 Reviews / Month | 25+ 5-Star Reviews / Month |\n| 24/7 After-Hours OPD | Lost Inquiries | 100% Captured by AI |\n`;
    insertFormatting(sampleTable);
  };

  const handleInsertLink = () => {
    if (!linkUrl) return;
    const anchor = linkText || linkUrl;
    insertFormatting(`[${anchor}](`, `${linkUrl})`);
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  // Local Image Upload Handler
  const handleLocalImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, isInline = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        const markdownImg = `\n\n![${cleanName}](${data.url})\n*Figure: ${cleanName}*\n\n`;
        insertFormatting(markdownImg);
        toast({ title: "Image Inserted! 🖼️", description: "Image successfully added into the article." });
      } else {
        setHeroImage(data.url);
        toast({ title: "Hero Image Uploaded! 🚀", description: "Set as the primary article cover image." });
      }
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // Save Blog Post
  const handleSave = async (targetStatus?: "DRAFT" | "PUBLISHED" | "SCHEDULED") => {
    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please provide an article title.", variant: "destructive" });
      return;
    }

    if (!slug.trim()) {
      toast({ title: "URL Slug Required", description: "Please specify a URL slug for SEO.", variant: "destructive" });
      return;
    }

    const finalStatus = targetStatus || status;

    try {
      setSaving(true);

      const payload = {
        title,
        slug,
        excerpt,
        content,
        heroImage,
        heroImageAlt,
        category,
        status: finalStatus,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        authorName,
        authorRole,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        canonicalUrl,
        focusKeywords,
        tags,
        keyTakeaways: keyTakeaways.filter((t) => t.trim().length > 0),
        faqItems: faqItems.filter((f) => f.question.trim().length > 0 && f.answer.trim().length > 0),
      };

      const url = isNew ? "/api/admin/blogs" : `/api/admin/blogs/${initialData.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save article");

      toast({
        title: finalStatus === "PUBLISHED" ? "Article Published Live! 🚀" : "Draft Saved Successfully! 💾",
        description: finalStatus === "PUBLISHED" ? `Live at gyrex.in/blog/${slug}` : "Your article updates have been saved.",
      });

      if (isNew) {
        router.push(`/admin/blogs/${data.post.id}`);
      } else {
        setStatus(finalStatus);
      }
    } catch (err: any) {
      toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Render Formatted HTML Preview
  const renderFormattedPreview = (rawText: string) => {
    if (!rawText) return <p className="text-slate-400 italic">No content written yet. Start typing in the visual composer...</p>;

    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-4" />;

      if (trimmed.startsWith("### ")) {
        return <h3 key={idx} className="text-xl font-bold text-slate-900 mt-6 mb-2">{trimmed.replace("### ", "")}</h3>;
      }
      if (trimmed.startsWith("## ")) {
        return <h2 key={idx} className="text-2xl font-black text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-100">{trimmed.replace("## ", "")}</h2>;
      }
      if (trimmed.startsWith("# ")) {
        return <h1 key={idx} className="text-3xl font-black text-slate-900 mt-8 mb-4">{trimmed.replace("# ", "")}</h1>;
      }
      if (trimmed.startsWith("> 💡")) {
        return (
          <div key={idx} className="p-4 my-4 rounded-2xl bg-amber-50 border-l-4 border-amber-500 text-amber-950 font-medium text-sm shadow-2xs">
            {trimmed.replace("> ", "")}
          </div>
        );
      }
      if (trimmed.startsWith("> 📌")) {
        return (
          <div key={idx} className="p-4 my-4 rounded-2xl bg-indigo-50 border-l-4 border-indigo-600 text-indigo-950 font-medium text-sm shadow-2xs">
            {trimmed.replace("> ", "")}
          </div>
        );
      }
      if (trimmed.startsWith("> ⚠️")) {
        return (
          <div key={idx} className="p-4 my-4 rounded-2xl bg-rose-50 border-l-4 border-rose-500 text-rose-950 font-medium text-sm shadow-2xs">
            {trimmed.replace("> ", "")}
          </div>
        );
      }
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={idx} className="p-4 my-4 rounded-2xl bg-slate-50 border-l-4 border-slate-400 text-slate-800 font-medium italic text-sm">
            {trimmed.replace("> ", "")}
          </blockquote>
        );
      }
      if (trimmed.startsWith("![")) {
        const match = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          return (
            <div key={idx} className="my-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
              <img src={match[2]} alt={match[1]} className="w-full h-auto object-cover max-h-[450px]" />
              {match[1] && <p className="text-center text-xs text-slate-500 py-2 italic">{match[1]}</p>}
            </div>
          );
        }
      }
      if (trimmed.startsWith("|")) {
        return (
          <div key={idx} className="overflow-x-auto my-2">
            <span className="font-mono text-xs text-slate-600 bg-slate-100 p-1.5 rounded">{trimmed}</span>
          </div>
        );
      }
      return (
        <p key={idx} className="text-slate-700 leading-relaxed mb-3 text-base">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-30 backdrop-blur-md bg-white/95">
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
                  <CheckCircle2 className="w-3 h-3" /> Live &amp; Indexed
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
                <FileText className="w-3.5 h-3.5" /> WYSIWYG Composer
              </TabsTrigger>
              <TabsTrigger value="ai-geo" className="rounded-lg text-xs font-bold gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-600" /> AI &amp; GEO Blocks
              </TabsTrigger>
              <TabsTrigger value="seo" className="rounded-lg text-xs font-bold gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" /> SEO &amp; Social
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Full-Fledged WYSIWYG Content & Hero Image */}
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

                {/* Hero Image Selector */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-600" /> Hero Cover Image
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
                          Click to Select Hero Image from Your Computer
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

                {/* ── WYSIWYG VISUAL EDITOR SUITE ── */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div>
                      <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" /> Article Content (WYSIWYG Composer)
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {wordCount} Words • ~{readingTime} Min Read
                      </span>
                    </div>

                    {/* Editor Mode Switcher */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setEditorMode("visual")}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          editorMode === "visual" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Type className="w-3.5 h-3.5" /> Visual Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode("code")}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          editorMode === "code" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" /> Source Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode("preview")}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          editorMode === "preview" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" /> Live Preview
                      </button>
                    </div>
                  </div>

                  {/* ── WYSIWYG FORMATTING TOOLBAR ── */}
                  <div className="bg-slate-50 border border-slate-200 rounded-t-2xl p-2 flex flex-wrap items-center gap-1 shadow-2xs">
                    {/* Headings */}
                    <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
                      <button
                        type="button"
                        onClick={() => insertHeading(2)}
                        className="px-2 py-1 rounded-lg text-xs font-black text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                        title="Major Heading (H2)"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHeading(3)}
                        className="px-2 py-1 rounded-lg text-xs font-black text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                        title="Subheading (H3)"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHeading(4)}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                        title="Minor Heading (H4)"
                      >
                        H4
                      </button>
                    </div>

                    {/* Inline Formatting */}
                    <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
                      <button
                        type="button"
                        onClick={() => insertFormatting("**", "**", "bold text")}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200"
                        title="Bold (Ctrl+B)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("*", "*", "italic text")}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200"
                        title="Italic (Ctrl+I)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("<u>", "</u>", "underlined text")}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200"
                        title="Underline (Ctrl+U)"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("~~", "~~", "strikethrough")}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200"
                        title="Strikethrough"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("<mark className='bg-amber-200 px-1 rounded'>", "</mark>", "highlighted text")}
                        className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100"
                        title="Highlight Text"
                      >
                        <Highlighter className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Lists & Quotes */}
                    <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
                      <button
                        type="button"
                        onClick={() => insertFormatting("\n- ", "\n", "List item")}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200"
                        title="Bulleted List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("\n1. ", "\n", "Step 1")}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("\n> ", "\n", "Blockquote")}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200"
                        title="Quote Block"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Clinical Callout Boxes */}
                    <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
                      <button
                        type="button"
                        onClick={() => insertCallout("tip")}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center gap-1"
                        title="Insert Clinical Tip Box"
                      >
                        <Lightbulb className="w-3 h-3 text-amber-600" /> Tip
                      </button>
                      <button
                        type="button"
                        onClick={() => insertCallout("note")}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1"
                        title="Insert Note Box"
                      >
                        <BookmarkCheck className="w-3 h-3 text-indigo-600" /> Note
                      </button>
                      <button
                        type="button"
                        onClick={() => insertCallout("warning")}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center gap-1"
                        title="Insert Warning Box"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> Warning
                      </button>
                    </div>

                    {/* Media, Links & Tables */}
                    <div className="flex items-center gap-0.5 px-2">
                      <button
                        type="button"
                        onClick={() => inlineImageInputRef.current?.click()}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
                        title="Insert Local Image"
                      >
                        <Upload className="w-3.5 h-3.5" /> Image
                      </button>
                      <input
                        ref={inlineImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleLocalImageSelect(e, true)}
                      />

                      <button
                        type="button"
                        onClick={() => setShowLinkModal(true)}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200"
                        title="Insert Hyperlink"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={insertTable}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200"
                        title="Insert Comparison Table"
                      >
                        <TableIcon className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting("\n\n---\n\n")}
                        className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200"
                        title="Divider Line"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ── EDITOR BODY: WYSIWYG / CODE / PREVIEW ── */}
                  {editorMode === "preview" ? (
                    <div className="bg-white border border-slate-200 border-t-0 rounded-b-2xl p-6 sm:p-8 min-h-[450px] shadow-inner space-y-4">
                      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 font-semibold flex items-center justify-between">
                        <span>👁️ Live Reader View (Formatted exactly as on gyrex.in/blog/{slug || "slug"})</span>
                        <span className="font-bold">{wordCount} words</span>
                      </div>
                      <article className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:leading-relaxed prose-a:text-blue-600">
                        {renderFormattedPreview(content)}
                      </article>
                    </div>
                  ) : editorMode === "visual" ? (
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your high-converting healthcare article here... Use toolbar buttons above to format headings, bullet points, clinical callout boxes, and upload local images."
                        rows={18}
                        className="font-sans text-sm leading-relaxed p-5 rounded-t-none rounded-b-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500 border-t-0 min-h-[400px]"
                        required
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Raw Markdown / HTML source code..."
                        rows={18}
                        className="font-mono text-xs leading-relaxed p-4 rounded-t-none rounded-b-2xl border-slate-200 bg-slate-900 text-emerald-400 focus:ring-2 focus:ring-indigo-500 border-t-0 min-h-[400px]"
                        required
                      />
                    </div>
                  )}

                  {/* Quick Guide */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                    <span>💡 Tip: Insert <strong>H2</strong> and <strong>H3</strong> headings to automatically populate the reader Table of Contents.</span>
                    <span className="font-semibold text-indigo-600 cursor-pointer hover:underline" onClick={() => setEditorMode("preview")}>
                      Preview Article ↗
                    </span>
                  </div>
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
                      onClick={() => setKeyTakeaways([...keyTakeaways, ""])}
                      className="h-7 text-xs font-bold"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Takeaway
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {keyTakeaways.map((takeaway, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={takeaway}
                          onChange={(e) => {
                            const copy = [...keyTakeaways];
                            copy[idx] = e.target.value;
                            setKeyTakeaways(copy);
                          }}
                          placeholder={`Key Takeaway #${idx + 1} (e.g. 78% of local patients book doctors with 25+ recent reviews)`}
                          className="text-xs rounded-xl h-10"
                        />
                        {keyTakeaways.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setKeyTakeaways(keyTakeaways.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 h-9 w-9 p-0 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* In-Article FAQs (Rich Snippets) */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-emerald-600" /> Article FAQs (Schema Rich Snippets)
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFaqItems([...faqItems, { question: "", answer: "" }])}
                      className="h-7 text-xs font-bold"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add FAQ
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {faqItems.map((faq, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                            FAQ Question #{idx + 1}
                          </span>
                          {faqItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setFaqItems(faqItems.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <Input
                          value={faq.question}
                          onChange={(e) => {
                            const copy = [...faqItems];
                            copy[idx].question = e.target.value;
                            setFaqItems(copy);
                          }}
                          placeholder="e.g. How long does Google Maps verification take for a new clinic?"
                          className="text-xs font-bold bg-white rounded-lg h-9"
                        />
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => {
                            const copy = [...faqItems];
                            copy[idx].answer = e.target.value;
                            setFaqItems(copy);
                          }}
                          placeholder="Direct, authoritative answer in 2-3 sentences..."
                          rows={2}
                          className="text-xs bg-white rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: SEO, Social & Publishing Settings */}
            <TabsContent value="seo" className="space-y-6 mt-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">SEO Meta Title</label>
                  <Input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={title || "SEO optimized title under 60 chars..."}
                    className="text-xs rounded-xl h-10"
                  />
                  <p className="text-[11px] text-gray-400">
                    {metaTitle.length}/60 characters (Google search result title)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">SEO Meta Description</label>
                  <Textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder={excerpt || "Compelling summary under 160 characters..."}
                    rows={3}
                    className="text-xs rounded-xl"
                  />
                  <p className="text-[11px] text-gray-400">
                    {metaDescription.length}/160 characters (Snippet under search results)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Canonical URL (Optional)</label>
                  <Input
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://gyrex.in/blog/article-slug"
                    className="text-xs rounded-xl h-10"
                  />
                </div>

                {/* Focus Keywords */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Focus Target Keywords (For Rank Tracking)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && keywordInput.trim()) {
                          e.preventDefault();
                          if (!focusKeywords.includes(keywordInput.trim())) {
                            setFocusKeywords([...focusKeywords, keywordInput.trim()]);
                          }
                          setKeywordInput("");
                        }
                      }}
                      placeholder="Type keyword and press Enter (e.g. clinic local seo)"
                      className="text-xs rounded-xl h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (keywordInput.trim() && !focusKeywords.includes(keywordInput.trim())) {
                          setFocusKeywords([...focusKeywords, keywordInput.trim()]);
                          setKeywordInput("");
                        }
                      }}
                      className="text-xs font-bold h-10"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {focusKeywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs px-2.5 py-1 rounded-lg gap-1">
                        {kw}
                        <button
                          type="button"
                          onClick={() => setFocusKeywords(focusKeywords.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Meta Controls & Publishing Card (1 Col) */}
        <div className="space-y-6">
          {/* Status & Publication Box */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-5">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Publishing Settings
            </h3>

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold bg-white text-gray-900"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published (Live)</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">URL Slug *</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-slug"
                className="text-xs font-mono rounded-xl h-10"
                required
              />
              <p className="text-[11px] text-gray-400 truncate">
                gyrex.in/blog/{slug || "slug"}
              </p>
            </div>

            {/* Primary Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Primary Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold bg-white text-gray-900"
              >
                {BLOG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 border-t border-gray-100">
              <Button
                onClick={() => handleSave()}
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-11 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving Changes..." : status === "PUBLISHED" ? "Update Published Post" : "Save Draft"}
              </Button>
            </div>
          </div>

          {/* Author E-E-A-T Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" /> Author E-E-A-T Profile
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Author Name</label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Dr. Siddhant / Gyrex Medical Team"
                className="text-xs rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Author Role / Credential</label>
              <Input
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="Senior Healthcare Growth Consultant"
                className="text-xs rounded-xl h-10"
              />
            </div>
          </div>

          {/* Tags Box */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" /> Article Tags
            </h3>

            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    if (!tags.includes(tagInput.trim())) {
                      setTags([...tags, tagInput.trim()]);
                    }
                    setTagInput("");
                  }
                }}
                placeholder="e.g. Dermatology"
                className="text-xs rounded-xl h-9"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                    setTags([...tags, tagInput.trim()]);
                    setTagInput("");
                  }
                }}
                className="text-xs font-bold h-9"
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t, i) => (
                <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 rounded-lg gap-1">
                  #{t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insert Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" /> Insert Hyperlink
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Display Text</label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Book a Consultation"
                  className="text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">URL / Destination Web Address *</label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://gyrex.in or /features"
                  className="text-xs rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowLinkModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleInsertLink} className="bg-indigo-600 text-white font-bold text-xs">
                Insert Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
