"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export default function AdminBlogListPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, published: 0, drafts: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/admin/blogs?${params.toString()}`);
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      toast({ title: "Failed to load posts", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleDeletePost = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");

      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Post Deleted", description: `"${title}" has been deleted.` });
    } catch (err: any) {
      toast({ title: "Delete Error", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Article Link Copied! 📋", description: url });
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" /> AI &amp; SEO Content Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Blog Publishing Suite</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Publish high-authority medical growth content engineered to rank #1 on Google, Bing, ChatGPT &amp; Perplexity with rich JSON-LD schema.
          </p>
        </div>

        <Link href="/admin/blogs/new">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-11 px-5 rounded-2xl shadow-lg flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Create New Article
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Articles</p>
          <p className="text-2xl font-black text-slate-900">{stats.total || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Live &amp; Indexed</p>
          <p className="text-2xl font-black text-emerald-600">{stats.published || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Drafts</p>
          <p className="text-2xl font-black text-amber-600">{stats.drafts || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Total Reader Views</p>
          <p className="text-2xl font-black text-indigo-600">{(stats.totalViews || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "ALL", label: "All Posts" },
            { id: "PUBLISHED", label: "Published" },
            { id: "DRAFT", label: "Drafts" },
            { id: "SCHEDULED", label: "Scheduled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, keyword, author..."
            className="h-10 text-xs rounded-xl"
          />
          <Button type="submit" size="sm" className="h-10 px-3 rounded-xl bg-slate-900">
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 animate-pulse">Loading articles...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-700">No blog articles found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Get started by creating your first clinic growth article with local image uploads and AI-ready schema.
            </p>
            <Link href="/admin/blogs/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs mt-2">
                <Plus className="w-3.5 h-3.5 mr-1" /> Write First Article
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category &amp; Author</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Read Time</th>
                  <th className="py-3 px-4 text-center">Views</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Title & Hero Thumbnail */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {post.heroImage ? (
                          <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-gray-200">
                            <img src={post.heroImage} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-500">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="space-y-0.5 max-w-md">
                          <Link
                            href={`/admin/blogs/${post.id}`}
                            className="font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 text-sm"
                          >
                            {post.title}
                          </Link>
                          <p className="text-[11px] text-gray-400 font-mono">/blog/{post.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category & Author */}
                    <td className="py-4 px-4 space-y-0.5">
                      <span className="inline-block text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {post.category}
                      </span>
                      <p className="text-[11px] text-gray-500">{post.authorName}</p>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      {post.status === "PUBLISHED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Live
                        </span>
                      ) : post.status === "SCHEDULED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3" /> Scheduled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Read time */}
                    <td className="py-4 px-4 text-center text-gray-600 font-medium">
                      {post.readingTimeMin} min read
                    </td>

                    {/* Views */}
                    <td className="py-4 px-4 text-center font-bold text-gray-800">
                      {(post.viewCount || 0).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {post.status === "PUBLISHED" && (
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600" title="View Public Page">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(post.slug)}
                          className="h-8 px-2 text-gray-600"
                          title="Copy Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>

                        <Link href={`/admin/blogs/${post.id}`}>
                          <Button variant="outline" size="sm" className="h-8 px-2.5 font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id, post.title)}
                          disabled={deletingId === post.id}
                          className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
