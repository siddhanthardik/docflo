import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function GET(req: Request) {
  const { doctorId, locationId } = await getSessionData();

  const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
  if (block) return block;
  
  const where: any = { doctorId };
  if (locationId) {
    where.gbpAccountId = locationId;
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const { doctorId, locationId } = await getSessionData();

  // Enforce WHATSAPP_CRM module for campaign creation
  const blockPost = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
  if (blockPost) return blockPost;

  const body = await req.json();
  const { name, message, segmentType, segmentValue } = body;

  if (!name || !message || !segmentType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      doctorId,
      gbpAccountId: locationId || undefined,
      name,
      message,
      segmentType,
      segmentValue,
      status: "DRAFT",
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}