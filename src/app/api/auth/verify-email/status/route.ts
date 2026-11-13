export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email?.trim().toLowerCase();

    // Check DB directly across doctor, staff, and platform users
    let user = userId
      ? await prisma.doctor.findUnique({ where: { id: userId }, select: { emailVerified: true } })
      : null;

    if (!user && email) {
      user = await prisma.doctor.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { emailVerified: true } });
    }
    if (!user && userId) {
      user = await prisma.staffMember.findUnique({ where: { id: userId }, select: { emailVerified: true } });
    }
    if (!user && email) {
      user = await prisma.staffMember.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { emailVerified: true } });
    }
    if (!user && userId) {
      user = await prisma.platformUser.findUnique({ where: { id: userId }, select: { emailVerified: true } });
    }
    if (!user && email) {
      user = await prisma.platformUser.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { emailVerified: true } });
    }

    const isVerified = Boolean(user?.emailVerified);

    return NextResponse.json({
      verified: isVerified,
      emailVerified: user?.emailVerified ? user.emailVerified.toISOString() : null,
    });
  } catch (err: any) {
    console.error("VERIFY EMAIL STATUS ERROR:", err);
    return NextResponse.json({ error: "Failed to check verification status" }, { status: 500 });
  }
}
