import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { WhatsAppService } from "@/services/whatsapp.service";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { entitlementGuard } from "@/lib/withEntitlements";
import fs from "fs";
import path from "path";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { doctorId } = await getSessionData();

  const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
  if (block) return block;

  const campaign = await prisma.campaign.findFirst({
    where: { id, doctorId },
  });

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
    return NextResponse.json({ error: "Campaign can only be sent when in Draft or Scheduled status" }, { status: 400 });
  }

  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "SENDING" } });

  let rawPatients: any[] = [];
  if (campaign.segmentType === "all") {
    rawPatients = await prisma.patient.findMany({
      where: { doctorId, patientType: { not: "LEAD" } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  } else if (campaign.segmentType === "tag") {
    rawPatients = await prisma.patient.findMany({
      where: { doctorId, patientType: { not: "LEAD" }, tags: { has: campaign.segmentValue } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  } else if (campaign.segmentType === "last_visit_before") {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(campaign.segmentValue || "0"));
    const allPatients = await prisma.patient.findMany({
      where: { doctorId, patientType: { not: "LEAD" } },
      include: { appointments: { orderBy: { date: "desc" }, take: 1 } },
    });
    rawPatients = allPatients
      .filter((p: any) => {
        const lastApt = p.appointments[0];
        return !lastApt || new Date(lastApt.date) < monthsAgo;
      })
      .map((p: any) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone }));
  }

  // Deduplicate and normalize phone numbers
  const uniquePatientsMap = new Map();
  for (const p of rawPatients) {
    const clean = whatsappManager.normalizePhone(p.phone);
    if (clean && !uniquePatientsMap.has(clean)) {
      uniquePatientsMap.set(clean, { ...p, phone: clean });
    }
  }
  const patients = Array.from(uniquePatientsMap.values());

  for (const patient of patients) {
    await prisma.campaignRecipient.create({
      data: {
        campaignId: campaign.id,
        patientId: patient.id,
        patientPhone: patient.phone,
        patientName: `${patient.firstName} ${patient.lastName}`,
        status: "PENDING",
      },
    });
  }

  if (whatsappManager.isConnected(doctorId)) {
    // Run sending in background to avoid request timeout and enforce rate limit
    (async () => {
      for (const patient of patients) {
        // RATE LIMIT: Wait 6 seconds between messages (max 10 msgs / minute)
        // This is crucial to prevent the WhatsApp number from getting banned.
        await new Promise((resolve) => setTimeout(resolve, 6000));

        let personalizedMsg = campaign.message
          .replace("{{firstName}}", patient.firstName)
          .replace("{{lastName}}", patient.lastName);
          
        if (campaign.ctaLink) {
          const btnText = campaign.ctaText || "Click Here";
          personalizedMsg += `\n\n👉 *${btnText}*: ${campaign.ctaLink}`;
        }
        
        try {
          let mediaSent = false;
          if (campaign.mediaUrl) {
            try {
              let buffer: Buffer | null = null;
              if (campaign.mediaUrl.startsWith("/")) {
                 const filePath = path.join(process.cwd(), "public", campaign.mediaUrl);
                 if (fs.existsSync(filePath)) {
                   buffer = fs.readFileSync(filePath);
                 }
              } else {
                 const res = await fetch(campaign.mediaUrl);
                 if (res.ok) {
                   const arrayBuffer = await res.arrayBuffer();
                   buffer = Buffer.from(arrayBuffer);
                 }
              }
              
              if (buffer) {
                if (campaign.mediaType === "IMAGE") {
                  await whatsappManager.sendImage(doctorId, patient.phone, buffer, personalizedMsg);
                  mediaSent = true;
                } else if (campaign.mediaType === "PDF") {
                  await whatsappManager.sendDocument(doctorId, patient.phone, buffer, "Document.pdf", personalizedMsg);
                  mediaSent = true;
                }
              }
            } catch (mediaErr) {
              console.warn(`[CAMPAIGN] Media buffer fetch failed, falling back to text for ${patient.phone}:`, mediaErr);
            }
          }

          if (!mediaSent) {
            await whatsappManager.sendMessage(doctorId, patient.phone, personalizedMsg);
          }
          
          await prisma.campaignRecipient.updateMany({
            where: { campaignId: campaign.id, patientPhone: patient.phone },
            data: { status: "SENT", sentAt: new Date() },
          });
        } catch (err) {
          console.error(`Failed to send to ${patient.phone}:`, err);
          await prisma.campaignRecipient.updateMany({
            where: { campaignId: campaign.id, patientPhone: patient.phone },
            data: { status: "FAILED", error: String(err) },
          });
        }
      }
      // Update campaign status when all done
      await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "SENT", sentAt: new Date() } });
    })();
  }

  // We return immediately. The background task handles sending safely.
  return NextResponse.json({ success: true, message: "Announcement scheduled for safe delivery" });
}