import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await req.json();
    const { role, isActive, password, kycStatus } = body;

    const dataToUpdate: any = {};
    if (role) dataToUpdate.role = role;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;
    if (kycStatus) dataToUpdate.kycStatus = kycStatus;
    if (password) {
      dataToUpdate.password = await hash(password, 10);
    }

    const updatedUser = await prisma.platformUser.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized. Only Superadmins can delete." }, { status: 401 });
    }

    const resolvedParams = await params;
    
    // Check if user has assigned leads or referred doctors
    const user = await prisma.platformUser.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: { assignedLeads: true, referredDoctors: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user._count.assignedLeads > 0 || user._count.referredDoctors > 0) {
      return NextResponse.json(
        { error: "Cannot delete user with assigned leads or referred doctors. Please deactivate them instead." },
        { status: 400 }
      );
    }

    await prisma.platformUser.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json(
      { error: "Failed to delete team member" },
      { status: 500 }
    );
  }
}
