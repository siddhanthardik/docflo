/**
 * GET  /api/admin/subscriptions/packages        - List all packages with module & limit details
 * POST /api/admin/subscriptions/packages        - Create a new package
 */

import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get('includeArchived') === 'true';

  const packages = await prisma.package.findMany({
    where: includeArchived ? {} : { isArchived: false },
    include: INCLUDE_FULL,
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(packages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { slug, name, description, priceMonthly, priceQuarterly, priceYearly, modules, limits } = body;

  if (!slug || !name || typeof priceMonthly !== 'number') {
    return NextResponse.json(
      { error: 'Missing required fields: slug, name, priceMonthly' },
      { status: 400 }
    );
  }

  // Validate module names
  const invalidModules = (modules || []).filter((m: string) => !Object.values(ModuleName).includes(m as ModuleName));
  if (invalidModules.length > 0) {
    return NextResponse.json({ error: `Invalid module names: ${invalidModules.join(', ')}` }, { status: 400 });
  }

  // Validate limit names
  const invalidLimits = (limits || []).filter((l: any) => !Object.values(LimitName).includes(l.limitName));
  if (invalidLimits.length > 0) {
    return NextResponse.json({ error: `Invalid limit names: ${invalidLimits.map((l: any) => l.limitName).join(', ')}` }, { status: 400 });
  }

  const newPackage = await prisma.package.create({
    data: {
      slug,
      name,
      description,
      priceMonthly,
      priceQuarterly: priceQuarterly ?? 0,
      priceYearly: priceYearly ?? 0,
      modules: {
        create: (modules || []).map((m: string) => ({ moduleName: m as ModuleName })),
      },
      limits: {
        create: (limits || []).map((l: { limitName: string; limitValue?: number | null }) => ({
          limitName: l.limitName as LimitName,
          limitValue: l.limitValue ?? null,
        })),
      },
    },
    include: INCLUDE_FULL,
  });

  return NextResponse.json(newPackage, { status: 201 });
}
