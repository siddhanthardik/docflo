import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { entitlementGuard } from "@/lib/withEntitlements"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { email, password, name, role } = await req.json()
  const hashed = await hash(password, 12)

  try {
    const member = await prisma.$transaction(async (tx) => {
      // 1. Lock the Doctor row to prevent concurrent creations from exceeding limits
      const doctorId = session.user.id;
      await tx.$queryRaw`SELECT 1 FROM "Doctor" WHERE id = ${doctorId} FOR UPDATE`;

      // 2. Enforce MAX_STAFF_SEATS under CLINIC_CORE
      const block = await entitlementGuard(doctorId, req, { module: "CLINIC_CORE", limit: "MAX_STAFF_SEATS" });
      if (block) {
        throw block;
      }

      // 3. Create the staff member
      return await tx.staffMember.create({
        data: {
          doctorId,
          email,
          password: hashed,
          name,
          role,
        },
      });
    });

    const { password: _, ...memberWithoutPassword } = member
    return NextResponse.json(memberWithoutPassword, { status: 201 })
  } catch (err: any) {
    if (err instanceof NextResponse) {
      return err; // Return the block response from entitlementGuard
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}