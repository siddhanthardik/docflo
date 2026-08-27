import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content ? content.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN", "MARKETING"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { authorName: { contains: search, mode: "insensitive" } },
        { focusKeywords: { hasSome: [search] } },
      ];
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    const stats = {
      total: await prisma.blogPost.count(),
      published: await prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
      drafts: await prisma.blogPost.count({ where: { status: "DRAFT" } }),
      scheduled: await prisma.blogPost.count({ where: { status: "SCHEDULED" } }),
      totalViews: (await prisma.blogPost.aggregate({ _sum: { viewCount: true } }))._sum.viewCount || 0,
    };

    return NextResponse.json({ posts, stats });
  } catch (error: any) {
    console.error("[ADMIN BLOGS GET ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN", "MARKETING"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      heroImage,
      heroImageAlt,
      metaTitle,
      metaDescription,
      canonicalUrl,
      focusKeywords,
      ogImage,
      keyTakeaways,
      faqItems,
      category,
      tags,
      authorName,
      authorRole,
      authorAvatar,
      status,
      scheduledFor,
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    let slug = customSlug ? slugify(customSlug) : slugify(title);
    if (!slug) slug = "article-" + Date.now();

    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const readingTimeMin = calculateReadingTime(content);

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt || "",
        content,
        heroImage: heroImage || null,
        heroImageAlt: heroImageAlt || "",
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt || "",
        canonicalUrl: canonicalUrl || null,
        focusKeywords: Array.isArray(focusKeywords) ? focusKeywords : [],
        ogImage: ogImage || heroImage || null,
        keyTakeaways: Array.isArray(keyTakeaways) ? keyTakeaways : [],
        faqItems: faqItems ? faqItems : [],
        category: category || "Growth & Marketing",
        tags: Array.isArray(tags) ? tags : [],
        authorName: authorName || session.user?.name || "Gyrex Medical Growth Team",
        authorRole: authorRole || "Clinical SEO & Growth Strategist",
        authorAvatar: authorAvatar || null,
        readingTimeMin,
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error("[ADMIN BLOGS POST ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to create post" }, { status: 500 });
  }
}
