import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // This is the requestId

    const report = await prisma.auditReport.findUnique({
      where: { requestId: id },
      include: {
        competitors: true,
        recommendations: true,
        request: {
          include: {
            lead: true
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // In this UX, the report is fully transparent.
    // The lead capture is shifted to premium actions (Download PDF, Action Plan, etc).
    const isLocked = !report.request.lead;

    return NextResponse.json({ report, isLocked });
  } catch (error) {
    console.error("Failed to fetch audit report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
