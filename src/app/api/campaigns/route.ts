import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function GET() {
  const { doctorId, locationId } = await getSessionData();
  
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