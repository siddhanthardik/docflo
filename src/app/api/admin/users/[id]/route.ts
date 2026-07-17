import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { subscriptionPlan } = body;

    if (!subscriptionPlan) {
      return NextResponse.json({ error: "Missing subscriptionPlan" }, { status: 400 });
    }

      const pkg = await prisma.package.findFirst({ where: { name: subscriptionPlan } });
      
      let dataToUpdate: any = {};
      if (pkg) {
        dataToUpdate.packageId = pkg.id;
      }
      
      const updatedUser = await prisma.doctor.update({
        where: { id },
        data: dataToUpdate,
        select: {
          id: true,
          package: { select: { name: true } },
        },
      });
      
      const response = { ...updatedUser, subscriptionPlan: updatedUser.package?.name || "FREE" };
      
      return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
