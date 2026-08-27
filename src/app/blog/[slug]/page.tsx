import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/layout/Footer";
import {
  Clock,
  Calendar,
  User,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Share2,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  MapPin,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Generate rich SEO & OpenGraph metadata dynamically
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
  });

  if (!post) {
    return {
      title: "Article Not Found | Gyrex",
    };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || "";
  const url = post.canonicalUrl || `https://gyrex.in/blog/${post.slug}`;
  const images = post.ogImage || post.heroImage ? [{ url: post.ogImage || post.heroImage! }] : [{ url: "/og-image.png" }];

  return {
    title: `${title} | Gyrex Clinical Growth`,
    description,
    keywords: post.focusKeywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Gyrex",
      images,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function ArticleReaderPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
  });

  if (!post) {
    notFound();
  }

  // Increment view counter in background
  prisma.blogPost
    .update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  // Fetch related articles in same category
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      category: post.category,
      id: { not: post.id },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });

  const rawTakeaways = Array.isArray(post.keyTakeaways) ? post.keyTakeaways : [];
  const rawFaqs = Array.isArray(post.faqItems) ? (post.faqItems as { question: string; answer: string }[]) : [];

  // ── JSON-LD Structured Data Schema for AI & Google Rich Results ──
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    headline: post.title,
    description: post.metaDescription || post.excerpt || "",
    image: post.heroImage || "https://gyrex.in/og-image.png",
    datePublished: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.authorName,
      jobTitle: post.authorRole || "Clinical SEO Specialist",
    },
    publisher: {
      "@type": "Organization",
      name: "Gyrex",
      url: "https://gyrex.in",
      logo: {
        "@type": "ImageObject",
        url: "https://gyrex.in/favicon.ico",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": post.canonicalUrl || `https://gyrex.in/blog/${post.slug}`,
    },
  };

  const faqSchema =
    rawFaqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: rawFaqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://gyrex.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://gyrex.in/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.category,
        item: `https://gyrex.in/blog?category=${encodeURIComponent(post.category)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: post.title,
        item: `https://gyrex.in/blog/${post.slug}`,
      },
    ],
  };

  // Helper to format markdown headers and text
  const formatParagraphs = (raw: string) => {
    return raw.split("\n\n").map((block, idx) => {
      const trimmed = block.trim();
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xl font-bold text-slate-900 mt-8 mb-3 scroll-mt-28">
            {trimmed.replace("### ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-2xl sm:text-3xl font-black text-slate-900 mt-12 mb-4 scroll-mt-28 border-b border-slate-100 pb-2">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-2xl sm:text-3xl font-black text-slate-900 mt-12 mb-4 scroll-mt-28">
            {trimmed.replace("# ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={idx} className="p-4 my-6 rounded-2xl bg-indigo-50/70 border-l-4 border-indigo-600 text-indigo-950 font-medium italic text-sm">
            {trimmed.replace("> ", "")}
          </blockquote>
        );
      }
      if (trimmed.startsWith("![")) {
        const match = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          return (
            <div key={idx} className="my-8 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={match[2]} alt={match[1]} className="w-full h-auto object-cover max-h-[500px]" />
              {match[1] && <p className="text-center text-xs text-slate-500 py-2 italic">{match[1]}</p>}
            </div>
          );
        }
      }
      return (
        <p key={idx} className="text-base sm:text-lg text-slate-700 leading-relaxed mb-6 font-normal">
          {trimmed}
        </p>
      );
    });
  };

  const shareUrl = `https://gyrex.in/blog/${post.slug}`;
  const shareTitle = encodeURIComponent(post.title);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      {/* Inject Structured Data JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <LandingHeader />

      {/* Article Header */}
      <header className="pt-32 pb-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href="/blog" className="hover:text-blue-600">Blog</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href={`/blog?category=${encodeURIComponent(post.category)}`} className="hover:text-blue-600 font-semibold text-blue-600">
              {post.category}
            </Link>
          </nav>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              {post.excerpt}
            </p>
          )}

          {/* Author E-E-A-T & Publication Date Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {post.authorName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  {post.authorName}
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">{post.authorRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "Recent"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {post.readingTimeMin} min read
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      {post.heroImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-10">
          <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 aspect-[16/9] bg-slate-100">
            <img
              src={post.heroImage}
              alt={post.heroImageAlt || post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Main Reading Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Executive Key Takeaways Callout (Favored by Perplexity & AI Overviews) */}
        {rawTakeaways.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 border border-indigo-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <h3 className="text-base font-bold text-indigo-950 uppercase tracking-wider">
                Executive Key Takeaways
              </h3>
            </div>
            <ul className="space-y-2.5 text-sm text-indigo-900 font-medium">
              {rawTakeaways.map((point: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Body Content */}
        <article className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:font-semibold hover:prose-a:underline">
          {formatParagraphs(post.content)}
        </article>

        {/* FAQ Accordion Section (Rich Snippet Trigger) */}
        {rawFaqs.length > 0 && (
          <section className="pt-10 border-t border-slate-200 space-y-6">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-4">
              {rawFaqs.map((faq: { question: string; answer: string }, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-base font-bold text-slate-900 leading-snug">{faq.question}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Social Share Bar */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-slate-500" /> Share this Playbook
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://api.whatsapp.com/send?text=${shareTitle}%20${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              LinkedIn
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              X / Twitter
            </a>
          </div>
        </div>

        {/* In-Article Clinic Growth CTA Banner */}
        <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl space-y-4 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-400/20 px-3 py-1 rounded-full inline-block">
              Claim Your #1 Spot
            </span>
            <h3 className="text-2xl font-black tracking-tight">
              Ready to Implement This in Your Practice?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Run a complimentary 10-point local SEO scan to see where your clinic ranks and unlock automated WhatsApp patient reviews.
            </p>
          </div>

          <Link href="/local-seo/free-audit" className="shrink-0">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-lg">
              Get Free Clinic Audit
            </Button>
          </Link>
        </section>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="pt-10 border-t border-slate-200 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Related Articles in {post.category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {rel.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">{rel.readingTimeMin} min read</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
