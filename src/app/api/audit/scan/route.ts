import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeAuditScan } from "@/services/audit-scan.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, placeId, searchQuery, name, address } = body;

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }
    if (!searchQuery && !placeId) {
      return NextResponse.json({ error: "Missing search parameters" }, { status: 400 });
    }

    // Verify lead exists
    const lead = await prisma.auditLead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Create the AuditRequest record linked to the lead
    const auditRequest = await prisma.auditRequest.create({
      data: {
        leadId,
        placeId,
        searchQuery: name ? `${name} ${address}` : searchQuery,
        status: "SCANNING",
        progress: 10,
      },
    });

    // Log Activity
    await prisma.leadActivity.create({
      data: {
        leadId,
        eventType: "AUDIT_STARTED",
        message: "A new GBP audit scan has been initiated.",
        metadata: { auditId: auditRequest.id },
      },
    });

    // Fire and Forget (Async Background Processing via shared service)
    executeAuditScan(auditRequest.id, { placeId, name, address, searchQuery }).catch(console.error);

    return NextResponse.json({
      success: true,
      auditId: auditRequest.id,
    });
  } catch (error) {
    console.error("Failed to start audit scan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
