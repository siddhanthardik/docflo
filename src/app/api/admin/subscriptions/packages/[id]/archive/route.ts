/**
 * PATCH /api/admin/subscriptions/packages/[id]/archive
 * Soft-archives a package. Archived packages cannot be assigned to new doctors,
 * but existing assignments remain unaffected.
 * Cannot archive a package if it is currently assigned to any doctor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_ROLES = ['SUPERADMIN', 'ADMIN'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const pkg = await prisma.package.findUnique({
    where: { id },
    include: { _count: { select: { doctors: true } } },
  });

  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  if (pkg.isArchived) return NextResponse.json({ error: 'Package is already archived' }, { status: 409 });

  // Constraint: cannot archive if any doctor is currently on this package
  if (pkg._count.doctors > 0) {
    return NextResponse.json(
      {
        error: `Cannot archive package "${pkg.name}" — it is currently assigned to ${pkg._count.doctors} doctor(s). Reassign all doctors first.`,
        doctorCount: pkg._count.doctors,
      },
      { status: 409 }
    );
  }

  const archived = await prisma.package.update({
    where: { id },
    data: { isArchived: true, isActive: false },
    include: {
      modules: { select: { moduleName: true } },
      limits: { select: { limitName: true, limitValue: true } },
      _count: { select: { doctors: true } },
    },
  });

  revalidateTag(`package-${id}`, "default");
  return NextResponse.json(archived);
}
