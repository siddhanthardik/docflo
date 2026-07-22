import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status } = await req.json();

    if (!["PENDING", "COMPLETED", "DISMISSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const rec = await prisma.seoRecommendation.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ recommendation: rec });
  } catch (error) {
    console.error("PATCH /api/local-seo/recommendations/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
