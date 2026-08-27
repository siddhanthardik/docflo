import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/layout/Footer";
import { 
  Sparkles, 
  Clock, 
  User, 
  ArrowRight, 
  Search, 
  TrendingUp, 
  CheckCircle2, 
  Layers,
  MapPin,
  Calendar,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Gyrex Clinical Growth & SEO Blog | Healthcare Marketing & Practice Intelligence",
  description: "Actionable local SEO guides, Google Maps 3-pack strategies, WhatsApp patient acquisition workflows, and AI practice automation for doctors and clinic owners.",
  openGraph: {
    title: "Gyrex Clinical Growth & SEO Blog",
    description: "Actionable local SEO guides, Google Maps 3-pack strategies, and WhatsApp patient acquisition for clinics.",
    url: "https://gyrex.in/blog",
    siteName: "Gyrex",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Gyrex Blog" }],
    type: "website",
  },
};

export const revalidate = 60; // ISR cache for 60 seconds

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || "ALL";
  const searchKeyword = params.search || "";

  const where: any = {
    status: "PUBLISHED",
  };

  if (activeCategory !== "ALL") {
    where.category = activeCategory;
  }

  if (searchKeyword.trim()) {
    where.OR = [
      { title: { contains: searchKeyword.trim(), mode: "insensitive" } },
      { excerpt: { contains: searchKeyword.trim(), mode: "insensitive" } },
      { content: { contains: searchKeyword.trim(), mode: "insensitive" } },
      { focusKeywords: { hasSome: [searchKeyword.trim()] } },
    ];
  }

  const [posts, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.blogPost.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED" },
      _count: { category: true },
    }),
  ]);

  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <LandingHeader />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Clinical Growth &amp; Local SEO Intelligence
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            How Top Clinics Outrank Competitors &amp; Automate Patient Flow
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Deep-dive Playbooks, Google Maps ranking algorithms, WhatsApp booking workflows, and AI practice management systems.
          </p>

          {/* Search Form */}
          <form className="max-w-md mx-auto flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                name="search"
                defaultValue={searchKeyword}
                placeholder="Search articles by topic, keyword, specialty..."
                className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>
            <Button type="submit" className="h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20">
              Search
            </Button>
          </form>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-4">
            <Link
              href="/blog"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === "ALL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Topics
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.category}
                href={`/blog?category=${encodeURIComponent(cat.category)}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat.category
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.category} ({cat._count.category})
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full space-y-16">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No articles found</h3>
            <p className="text-xs text-slate-500">
              Try searching with another keyword or selecting a different category.
            </p>
            <Link href="/blog">
              <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
                Reset Filters
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Hero Article */}
            {featuredPost && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 hover:border-blue-300 transition-all group">
                <div className="lg:col-span-7 relative aspect-video lg:aspect-auto min-h-[280px] sm:min-h-[380px] bg-slate-100 overflow-hidden">
                  {featuredPost.heroImage ? (
                    <img
                      src={featuredPost.heroImage}
                      alt={featuredPost.heroImageAlt || featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-950 flex items-center justify-center text-white font-bold text-lg p-8 text-center">
                      Gyrex Featured Intelligence
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-amber-400 text-amber-950 text-[11px] font-black px-3 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Featured Article
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {featuredPost.category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {featuredPost.readingTimeMin} min read
                      </span>
                    </div>

                    <Link href={`/blog/${featuredPost.slug}`}>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 hover:text-blue-600 transition-colors leading-tight">
                        {featuredPost.title}
                      </h2>
                    </Link>

                    {featuredPost.excerpt && (
                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{featuredPost.authorName}</p>
                      <p className="text-slate-400 text-[11px]">{featuredPost.authorRole}</p>
                    </div>

                    <Link href={`/blog/${featuredPost.slug}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1">
                        Read Guide <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Remaining Grid Articles */}
            {gridPosts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Latest Growth Articles</h3>
                  <span className="text-xs text-slate-500 font-semibold">{gridPosts.length} articles</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridPosts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      <div>
                        {/* Thumbnail */}
                        <Link href={`/blog/${post.slug}`} className="block aspect-[16/10] bg-slate-100 overflow-hidden relative">
                          {post.heroImage ? (
                            <img
                              src={post.heroImage}
                              alt={post.heroImageAlt || post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-indigo-900 flex items-center justify-center text-white text-xs font-bold p-6 text-center">
                              {post.category}
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs">
                              {post.category}
                            </span>
                          </div>
                        </Link>

                        {/* Text */}
                        <div className="p-6 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {post.publishedAt
                                ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                : "Recent"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {post.readingTimeMin}m read
                            </span>
                          </div>

                          <Link href={`/blog/${post.slug}`}>
                            <h4 className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                              {post.title}
                            </h4>
                          </Link>

                          {post.excerpt && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-4">
                        <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[150px]">
                          {post.authorName}
                        </span>
                        <Link href={`/blog/${post.slug}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                          Read <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Free Audit Conversion Banner */}
        <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-400/20 border border-amber-400/30 px-3 py-1 rounded-full inline-block">
              Free Clinic Audit
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              See How Your Clinic Ranks Against Top Competitors on Google Maps
            </h3>
            <p className="text-sm text-slate-300">
              Run a complimentary 10-point local SEO scan. Discover keyword deficits and estimated lost patient inquiries in 60 seconds.
            </p>
          </div>

          <Link href="/local-seo/free-audit" className="shrink-0">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm h-12 px-8 rounded-2xl shadow-xl transition-all">
              Run Free Clinic Audit Now
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
