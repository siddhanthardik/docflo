import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSessionData();
    if (!session || !session.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();

    if (!["PENDING", "COMPLETED", "DISMISSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existingRec = await prisma.seoRecommendation.findUnique({
      where: { id },
      include: { gbpAccount: true }
    });

    if (!existingRec || existingRec.gbpAccount.doctorId !== session.doctorId) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
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
