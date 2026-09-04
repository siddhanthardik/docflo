import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const currentRole = session.user.role || ""
  if (["RECEPTIONIST", "NURSE", "STAFF"].includes(currentRole)) {
    return NextResponse.json({ error: "Forbidden: Access restricted to clinic managers and doctors" }, { status: 403 })
  }

  try {
    const { id } = await params;
    const doctorId = session.user.doctorId || session.user.id;

    // Only the doctor/manager who owns this clinic can edit staff
    const existingStaff = await prisma.staffMember.findUnique({
      where: { id },
    })

    if (!existingStaff || existingStaff.doctorId !== doctorId) {
      return NextResponse.json({ error: "Staff member not found or access denied" }, { status: 404 })
    }

    const { email, password, name, role, isActive, phone } = await req.json()
    
    // Prepare update data
    const dataToUpdate: any = {}
    if (email !== undefined) dataToUpdate.email = email.trim().toLowerCase()
    if (name !== undefined) dataToUpdate.name = name.trim()
    if (role !== undefined) dataToUpdate.role = role
    if (isActive !== undefined) dataToUpdate.isActive = isActive
    if (phone !== undefined) dataToUpdate.phone = phone

    // Only update password if a new one was provided
    if (password && password.trim() !== "") {
      dataToUpdate.password = await hash(password, 12)
    }

    const updatedMember = await prisma.staffMember.update({
      where: { id },
      data: dataToUpdate,
    })

    const { password: _, ...memberWithoutPassword } = updatedMember
    return NextResponse.json(memberWithoutPassword, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const currentRole = session.user.role || ""
  if (["RECEPTIONIST", "NURSE", "STAFF"].includes(currentRole)) {
    return NextResponse.json({ error: "Forbidden: Access restricted to clinic managers and doctors" }, { status: 403 })
  }

  try {
    const { id } = await params;
    const doctorId = session.user.doctorId || session.user.id;

    const existingStaff = await prisma.staffMember.findUnique({
      where: { id },
    })

    if (!existingStaff || existingStaff.doctorId !== doctorId) {
      return NextResponse.json({ error: "Staff member not found or access denied" }, { status: 404 })
    }

    await prisma.staffMember.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
