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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN", "MARKETING"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("[ADMIN BLOG DETAIL GET ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN", "MARKETING"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    const existingPost = await prisma.blogPost.findUnique({ where: { id } });
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let slug = customSlug ? slugify(customSlug) : existingPost.slug;
    if (slug !== existingPost.slug) {
      const collision = await prisma.blogPost.findFirst({
        where: { slug, id: { not: id } },
      });
      if (collision) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const readingTimeMin = content ? calculateReadingTime(content) : existingPost.readingTimeMin;

    const publishedAt =
      status === "PUBLISHED" && !existingPost.publishedAt
        ? new Date()
        : status === "DRAFT"
        ? null
        : existingPost.publishedAt;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingPost.title,
        slug,
        excerpt: excerpt !== undefined ? excerpt : existingPost.excerpt,
        content: content !== undefined ? content : existingPost.content,
        heroImage: heroImage !== undefined ? heroImage : existingPost.heroImage,
        heroImageAlt: heroImageAlt !== undefined ? heroImageAlt : existingPost.heroImageAlt,
        metaTitle: metaTitle !== undefined ? metaTitle : existingPost.metaTitle,
        metaDescription: metaDescription !== undefined ? metaDescription : existingPost.metaDescription,
        canonicalUrl: canonicalUrl !== undefined ? canonicalUrl : existingPost.canonicalUrl,
        focusKeywords: Array.isArray(focusKeywords) ? focusKeywords : existingPost.focusKeywords,
        ogImage: ogImage !== undefined ? ogImage : existingPost.ogImage,
        keyTakeaways: Array.isArray(keyTakeaways) ? keyTakeaways : existingPost.keyTakeaways,
        faqItems: faqItems !== undefined ? faqItems : existingPost.faqItems,
        category: category !== undefined ? category : existingPost.category,
        tags: Array.isArray(tags) ? tags : existingPost.tags,
        authorName: authorName !== undefined ? authorName : existingPost.authorName,
        authorRole: authorRole !== undefined ? authorRole : existingPost.authorRole,
        authorAvatar: authorAvatar !== undefined ? authorAvatar : existingPost.authorAvatar,
        readingTimeMin,
        status: status !== undefined ? status : existingPost.status,
        publishedAt,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[ADMIN BLOG DETAIL PUT ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN", "MARKETING"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("[ADMIN BLOG DETAIL DELETE ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to delete post" }, { status: 500 });
  }
}
