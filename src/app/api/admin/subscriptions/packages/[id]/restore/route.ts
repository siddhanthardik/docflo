/**
 * PATCH /api/admin/subscriptions/packages/[id]/restore
 * Restores an archived package back to active state.
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

  const pkg = await prisma.package.findUnique({ where: { id } });

  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  if (!pkg.isArchived) return NextResponse.json({ error: 'Package is not archived' }, { status: 409 });

  const restored = await prisma.package.update({
    where: { id },
    data: { isArchived: false, isActive: true },
    include: {
      modules: { select: { moduleName: true } },
      limits: { select: { limitName: true, limitValue: true } },
      _count: { select: { doctors: true } },
    },
  });

  revalidateTag(`package-${id}`, "default");
  return NextResponse.json(restored);
}
