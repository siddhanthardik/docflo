import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Strict role whitelists for privilege escalation defense
const MANAGER_ALLOWED_STAFF_ROLES = ["RECEPTIONIST", "STAFF", "NURSE"];
const DOCTOR_ALLOWED_STAFF_ROLES = ["RECEPTIONIST", "STAFF", "NURSE", "MANAGER"];

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
    
    // Strict Privilege Escalation Protection:
    // 1. If caller is a MANAGER:
    if (currentRole === "MANAGER") {
      // A manager cannot alter their own role or escalate themselves
      if (id === session.user.id && role !== undefined && role !== existingStaff.role) {
        return NextResponse.json(
          { error: "Forbidden: Managers cannot change their own access level or role." },
          { status: 403 }
        )
      }
      // A manager cannot edit or modify another manager's account
      if (existingStaff.role === "MANAGER" && id !== session.user.id) {
        return NextResponse.json(
          { error: "Forbidden: Managers cannot modify other manager accounts. Only the clinic doctor can modify manager accounts." },
          { status: 403 }
        )
      }
      // A manager can only assign subordinate roles (RECEPTIONIST, STAFF, NURSE)
      if (role !== undefined && !MANAGER_ALLOWED_STAFF_ROLES.includes(role)) {
        return NextResponse.json(
          { error: "Forbidden: Managers can only assign Receptionist, Staff, or Nurse roles." },
          { status: 403 }
        )
      }
    }

    // 2. If caller is a DOCTOR:
    if (currentRole === "DOCTOR") {
      // A doctor can only assign clinic staff roles, never ADMIN or SUPERADMIN
      if (role !== undefined && !DOCTOR_ALLOWED_STAFF_ROLES.includes(role)) {
        return NextResponse.json(
          { error: "Forbidden: Doctors can only assign Receptionist, Staff, Nurse, or Manager roles. Platform Admin and Superadmin roles cannot be assigned." },
          { status: 403 }
        )
      }
    }

    // 3. Fallback for any other unauthorized role
    if (!["MANAGER", "DOCTOR"].includes(currentRole)) {
      return NextResponse.json({ error: "Forbidden: Unauthorized to update staff." }, { status: 403 })
    }

    // Prepare update data
    const dataToUpdate: any = {}
    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase()
      // Check if email belongs to Doctor
      const existingDoctor = await prisma.doctor.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } }
      })
      if (existingDoctor) {
        return NextResponse.json({ error: "This email is already registered as a clinic account owner" }, { status: 409 })
      }
      dataToUpdate.email = cleanEmail
    }
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

    // Prevent staff member from deleting their own account
    if (id === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own staff account" }, { status: 400 })
    }

    const existingStaff = await prisma.staffMember.findUnique({
      where: { id },
    })

    if (!existingStaff || existingStaff.doctorId !== doctorId) {
      return NextResponse.json({ error: "Staff member not found or access denied" }, { status: 404 })
    }

    // Strict Privilege Escalation Protection:
    // A Manager cannot delete another Manager account (only Doctor can remove a manager)
    if (currentRole === "MANAGER" && existingStaff.role === "MANAGER") {
      return NextResponse.json(
        { error: "Forbidden: Managers cannot remove other manager accounts. Only the clinic doctor can remove a manager." },
        { status: 403 }
      )
    }

    await prisma.staffMember.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
