import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeAuditScan } from "@/services/audit-scan.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Attempt lookup by AuditReport.id
    let report = await prisma.auditReport.findUnique({
      where: { id },
      include: {
        competitors: true,
        recommendations: true,
        request: {
          include: {
            lead: true,
          },
        },
      },
    });

    // 2. Fall back to lookup by AuditRequest.id
    if (!report) {
      report = await prisma.auditReport.findUnique({
        where: { requestId: id },
        include: {
          competitors: true,
          recommendations: true,
          request: {
            include: {
              lead: true,
            },
          },
        },
      });
    }

    // 3. Just-In-Time (JIT) Generation: If report doesn't exist yet, check if an AuditRequest exists
    if (!report) {
      console.log(`[AUDIT REPORT API] Report not pre-generated for ID: ${id}. Attempting Just-In-Time generation...`);
      
      let auditReq = await prisma.auditRequest.findUnique({
        where: { id },
        include: { lead: true },
      });

      // Also check if id is an AuditLead.id
      if (!auditReq) {
        const lead = await prisma.auditLead.findUnique({ where: { id } });
        if (lead) {
          auditReq = await prisma.auditRequest.create({
            data: {
              leadId: lead.id,
              placeId: lead.placeId,
              searchQuery: `${lead.clinicName} in ${lead.phone || ""}`,
              status: "PROCESSING",
              progress: 10,
            },
            include: { lead: true },
          });
        }
      }

      if (auditReq) {
        try {
          console.log(`[AUDIT REPORT API] Executing real-time diagnostic scan for request: ${auditReq.id} (${auditReq.lead?.clinicName})...`);
          
          await executeAuditScan(auditReq.id, {
            placeId: auditReq.placeId,
            name: auditReq.lead?.clinicName || "Clinic",
            address: auditReq.lead?.name || "",
            searchQuery: auditReq.searchQuery,
          });

          // Fetch the newly created AuditReport
          report = await prisma.auditReport.findUnique({
            where: { requestId: auditReq.id },
            include: {
              competitors: true,
              recommendations: true,
              request: {
                include: {
                  lead: true,
                },
              },
            },
          });
        } catch (scanErr) {
          console.error(`[AUDIT REPORT API] Real-time scan failed for ${id}:`, scanErr);
        }
      }
    }

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // In this UX, the report is fully transparent.
    // The lead capture is shifted to premium actions (Download PDF, Action Plan, etc).
    const isLocked = !report.request?.lead;

    return NextResponse.json({ report, isLocked });
  } catch (error) {
    console.error("Failed to fetch audit report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

