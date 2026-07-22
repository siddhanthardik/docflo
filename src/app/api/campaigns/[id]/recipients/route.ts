import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { doctorId } = await getSessionData();

  if (!doctorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipients = await prisma.campaignRecipient.findMany({
    where: {
      campaignId: id,
      campaign: {
        doctorId
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({ recipients });
}
