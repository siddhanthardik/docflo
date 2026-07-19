/**
 * GET    /api/admin/subscriptions/packages/[id]       - Get a single package with full details
 * PUT    /api/admin/subscriptions/packages/[id]       - Edit package metadata, modules, and limits
 * POST   /api/admin/subscriptions/packages/[id]/clone - Clone a package
 * PATCH  /api/admin/subscriptions/packages/[id]/archive  - Archive a package
 * PATCH  /api/admin/subscriptions/packages/[id]/restore  - Restore an archived package
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ModuleName, LimitName } from '@prisma/client';

const ADMIN_ROLES = ['SUPERADMIN', 'ADMIN'];

function isAdmin(role?: string) {
  return role && ADMIN_ROLES.includes(role);
}

const INCLUDE_FULL = {
  modules: { select: { moduleName: true } },
  limits: { select: { limitName: true, limitValue: true } },
  _count: { select: { doctors: true } },
} as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const pkg = await prisma.package.findUnique({
    where: { id },
    include: INCLUDE_FULL,
  });

  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

  return NextResponse.json(pkg);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, description, priceMonthly, priceQuarterly, priceYearly, modules, limits } = body;

  // Validate module names if provided
  if (modules) {
    const invalid = modules.filter((m: string) => !Object.values(ModuleName).includes(m as ModuleName));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid module names: ${invalid.join(', ')}` }, { status: 400 });
    }
  }

  // Validate limit names if provided
  if (limits) {
    const invalid = limits.filter((l: any) => !Object.values(LimitName).includes(l.limitName));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid limit names: ${invalid.map((l: any) => l.limitName).join(', ')}` }, { status: 400 });
    }
  }

  // Use a transaction to atomically update modules and limits
  const updatedPackage = await prisma.$transaction(async (tx) => {
    if (modules !== undefined) {
      await tx.packageModule.deleteMany({ where: { packageId: id } });
      await tx.packageModule.createMany({
        data: modules.map((m: string) => ({ packageId: id, moduleName: m as ModuleName })),
      });
    }

    if (limits !== undefined) {
      for (const l of limits) {
        await tx.packageLimit.upsert({
          where: { packageId_limitName: { packageId: id, limitName: l.limitName as LimitName } },
          update: { limitValue: l.limitValue ?? null },
          create: { packageId: id, limitName: l.limitName as LimitName, limitValue: l.limitValue ?? null },
        });
      }
    }

    return tx.package.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(priceMonthly !== undefined && { priceMonthly }),
        ...(priceQuarterly !== undefined && { priceQuarterly }),
        ...(priceYearly !== undefined && { priceYearly }),
      },
      include: INCLUDE_FULL,
    });
  });

  revalidateTag(`package-${id}`, "default");
  return NextResponse.json(updatedPackage);
}
