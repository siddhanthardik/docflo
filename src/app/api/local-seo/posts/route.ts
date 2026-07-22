import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const account = await prisma.gbpAccount.findFirst({ where: { doctorId: session.doctorId, lastSyncAt: { not: null } }, orderBy: { updatedAt: 'desc' } });
    if (!account) return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });

    const snapshot = await prisma.gbpPostSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({
      data: snapshot?.json || null,
      source: "Google Business Profile Posts API",
      lastUpdated: snapshot?.date || null
    });
  } catch (error: any) {
    console.error("Posts API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
