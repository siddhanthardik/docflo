import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { WhatsAppService } from "@/services/whatsapp.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { doctorId } = await getSessionData();

  const campaign = await prisma.campaign.findFirst({
    where: { id, doctorId },
  });

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
    return NextResponse.json({ error: "Campaign can only be sent when in Draft or Scheduled status" }, { status: 400 });
  }

  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "SENDING" } });

  let patients: any[] = [];
  if (campaign.segmentType === "all") {
    patients = await prisma.patient.findMany({
      where: { doctorId },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  } else if (campaign.segmentType === "tag") {
    patients = await prisma.patient.findMany({
      where: { doctorId, tags: { has: campaign.segmentValue } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  } else if (campaign.segmentType === "last_visit_before") {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(campaign.segmentValue || "0"));
    const allPatients = await prisma.patient.findMany({
      where: { doctorId },
      include: { appointments: { orderBy: { date: "desc" }, take: 1 } },
    });
    patients = allPatients
      .filter((p: any) => {
        const lastApt = p.appointments[0];
        return !lastApt || new Date(lastApt.date) < monthsAgo;
      })
      .map((p: any) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone }));
  }

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

  const whatsappConfig = await prisma.whatsAppConfig.findUnique({ where: { doctorId } });
  if (whatsappConfig?.isActive) {
    const whatsappService = new WhatsAppService(
      whatsappConfig.accessToken!,
      whatsappConfig.phoneNumberId!,
      doctorId
    );

    for (const patient of patients) {
      const personalizedMsg = campaign.message
        .replace("{{firstName}}", patient.firstName)
        .replace("{{lastName}}", patient.lastName);
      try {
        await whatsappService.sendTextMessage(patient.phone, personalizedMsg);
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
  }

  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "SENT", sentAt: new Date() } });
  return NextResponse.json({ success: true });
}