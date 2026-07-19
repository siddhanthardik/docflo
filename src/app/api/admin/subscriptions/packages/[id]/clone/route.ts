/**
 * POST /api/admin/subscriptions/packages/[id]/clone
 * Creates a deep copy of a package with a new slug, returning the cloned package.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_ROLES = ['SUPERADMIN', 'ADMIN'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { slug, name } = body;

  if (!slug || !name) {
    return NextResponse.json({ error: 'Missing required fields: slug, name' }, { status: 400 });
  }

  // Verify source package exists
  const source = await prisma.package.findUnique({
    where: { id },
    include: { modules: true, limits: true },
  });

  if (!source) return NextResponse.json({ error: 'Source package not found' }, { status: 404 });

  // Check slug uniqueness
  const slugExists = await prisma.package.findUnique({ where: { slug } });
  if (slugExists) {
    return NextResponse.json({ error: `Slug "${slug}" is already in use` }, { status: 409 });
  }

  const cloned = await prisma.package.create({
    data: {
      slug,
      name,
      description: source.description ? `Copy of ${source.description}` : `Copy of ${source.name}`,
      priceMonthly: source.priceMonthly,
      priceQuarterly: source.priceQuarterly,
      priceYearly: source.priceYearly,
      isActive: false, // Clones start as inactive until explicitly activated
      isArchived: false,
      modules: {
        create: source.modules.map((m) => ({ moduleName: m.moduleName })),
      },
      limits: {
        create: source.limits.map((l) => ({ limitName: l.limitName, limitValue: l.limitValue })),
      },
    },
    include: {
      modules: { select: { moduleName: true } },
      limits: { select: { limitName: true, limitValue: true } },
      _count: { select: { doctors: true } },
    },
  });

  return NextResponse.json(cloned, { status: 201 });
}
