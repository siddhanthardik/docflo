/**
 * GET   /api/admin/subscriptions/doctors/[id]/assign  - Get doctor's current package + full history
 * POST  /api/admin/subscriptions/doctors/[id]/assign  - Assign a package to a doctor (creates SubscriptionHistory)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

const ADMIN_ROLES = ['SUPERADMIN', 'ADMIN'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      clinicName: true,
      packageId: true,
      subscriptionStatus: true,
      package: {
        select: {
          id: true,
          slug: true,
          name: true,
          isArchived: true,
          modules: { select: { moduleName: true } },
          limits: { select: { limitName: true, limitValue: true } },
        },
      },
      subscriptionHistories: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

  return NextResponse.json(doctor);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: doctorId } = await params;
  const body = await req.json();
  const { packageId, reason } = body;

  if (!packageId) {
    return NextResponse.json({ error: 'Missing required field: packageId' }, { status: 400 });
  }

  // Verify doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true, packageId: true, name: true },
  });
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

  // Verify target package exists and is not archived
  const targetPackage = await prisma.package.findUnique({
    where: { id: packageId },
    select: { id: true, name: true, isArchived: true, isActive: true },
  });
  if (!targetPackage) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  if (targetPackage.isArchived) {
    return NextResponse.json(
      { error: `Cannot assign archived package "${targetPackage.name}" to a doctor` },
      { status: 409 }
    );
  }

  // Check if doctor is already on this package
  if (doctor.packageId === packageId) {
    return NextResponse.json({ error: 'Doctor is already on this package' }, { status: 409 });
  }

  // Perform assignment + create immutable history record in one transaction
  const [updatedDoctor, historyRecord] = await prisma.$transaction([
    prisma.doctor.update({
      where: { id: doctorId },
      data: { packageId },
      select: {
        id: true,
        name: true,
        email: true,
        packageId: true,
        package: {
          select: {
            id: true,
            slug: true,
            name: true,
            modules: { select: { moduleName: true } },
            limits: { select: { limitName: true, limitValue: true } },
          },
        },
      },
    }),
    prisma.subscriptionHistory.create({
      data: {
        doctorId,
        previousPackageId: doctor.packageId ?? null,
        newPackageId: packageId,
        changedById: session.user.id!,
        changedByRole: session.user.role,
        reason: reason ?? null,
      },
    }),
  ]);

  // Invalidate entitlement cache for the doctor
  revalidateTag(`doctor-package-${doctorId}`, "default");

  return NextResponse.json({
    doctor: updatedDoctor,
    historyRecord,
  });
}
