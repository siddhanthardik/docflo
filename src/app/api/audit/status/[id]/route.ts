import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const request = await prisma.auditRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        progress: true
      }
    });

    if (!request) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("Failed to fetch audit status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
