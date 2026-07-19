/**
 * GET /api/admin/subscriptions/doctors/[id]/history
 * Returns the complete immutable subscription history for a given doctor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_ROLES = ['SUPERADMIN', 'ADMIN'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: doctorId } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true, name: true, email: true },
  });

  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

  const history = await prisma.subscriptionHistory.findMany({
    where: { doctorId },
    orderBy: { createdAt: 'desc' },
  });

  // Enrich with package names for readability (IDs are the authoritative source)
  const packageIds = [...new Set([
    ...history.map((h) => h.previousPackageId).filter(Boolean),
    ...history.map((h) => h.newPackageId),
  ])] as string[];

  const packageMap = await prisma.package.findMany({
    where: { id: { in: packageIds } },
    select: { id: true, slug: true, name: true },
  });

  const pkgById = Object.fromEntries(packageMap.map((p) => [p.id, p]));

  const enriched = history.map((h) => ({
    ...h,
    previousPackage: h.previousPackageId ? pkgById[h.previousPackageId] ?? null : null,
    newPackage: pkgById[h.newPackageId] ?? null,
  }));

  return NextResponse.json({ doctor, history: enriched });
}
