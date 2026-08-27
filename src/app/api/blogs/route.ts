import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = Number(searchParams.get("limit")) || 20;
    const page = Number(searchParams.get("page")) || 1;

    const where: any = {
      status: "PUBLISHED",
    };

    if (category && category !== "ALL") {
      where.category = category;
    }
    if (tag) {
      where.tags = { has: tag };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { focusKeywords: { hasSome: [search] } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          heroImage: true,
          heroImageAlt: true,
          category: true,
          tags: true,
          authorName: true,
          authorRole: true,
          authorAvatar: true,
          readingTimeMin: true,
          publishedAt: true,
          createdAt: true,
          keyTakeaways: true,
        },
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    const categories = await prisma.blogPost.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED" },
      _count: { category: true },
    });

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      categories: categories.map((c) => ({
        name: c.category,
        count: c._count.category,
      })),
    });
  } catch (error: any) {
    console.error("[PUBLIC BLOGS GET ERROR]:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}
