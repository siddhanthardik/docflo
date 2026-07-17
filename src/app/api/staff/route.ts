import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { email, password, name, role } = await req.json()
  const hashed = await hash(password, 12)

  try {
    const member = await prisma.staffMember.create({
      data: {
        doctorId: session.user.id,
        email,
        password: hashed,
        name,
        role,
      },
    })
    const { password: _, ...memberWithoutPassword } = member
    return NextResponse.json(memberWithoutPassword, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}