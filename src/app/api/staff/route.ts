import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { entitlementGuard } from "@/lib/withEntitlements"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = session.user.role || ""
  if (["RECEPTIONIST", "NURSE", "STAFF"].includes(role)) {
    return NextResponse.json({ error: "Forbidden: Access restricted to clinic managers and doctors" }, { status: 403 })
  }

  const doctorId = session.user.doctorId || session.user.id
  const staff = await prisma.staffMember.findMany({
    where: { doctorId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(staff)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const currentRole = session.user.role || ""
  if (["RECEPTIONIST", "NURSE", "STAFF"].includes(currentRole)) {
    return NextResponse.json({ error: "Forbidden: Access restricted to clinic managers and doctors" }, { status: 403 })
  }

  const { email, password, name, role } = await req.json()
  const cleanEmail = email.trim().toLowerCase()

  // Check if staff email already exists
  const existingStaff = await prisma.staffMember.findUnique({
    where: { email: cleanEmail }
  })
  if (existingStaff) {
    return NextResponse.json({ error: "A staff member with this email already exists" }, { status: 409 })
  }

  const hashed = await hash(password, 12)
  const doctorId = session.user.doctorId || session.user.id

  try {
    const member = await prisma.$transaction(async (tx) => {
      // 1. Lock the Doctor row to prevent concurrent creations from exceeding limits
      await tx.$queryRaw`SELECT 1 FROM "doctors" WHERE id = ${doctorId} FOR UPDATE`

      // 2. Enforce MAX_STAFF_SEATS under CLINIC_CORE
      const block = await entitlementGuard(doctorId, req, { module: "CLINIC_CORE", limit: "MAX_STAFF_SEATS" })
      if (block) {
        throw block
      }

      // 3. Create the staff member
      return await tx.staffMember.create({
        data: {
          doctorId,
          email: cleanEmail,
          password: hashed,
          name: name.trim(),
          role,
        },
      })
    })

    const { password: _, ...memberWithoutPassword } = member
    return NextResponse.json(memberWithoutPassword, { status: 201 })
  } catch (err: any) {
    if (err instanceof NextResponse) {
      return err // Return the block response from entitlementGuard
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}