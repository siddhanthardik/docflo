import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/support/tickets/[id]
 * Update ticket status, priority, or resolution note
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!session?.user?.id || (role !== "SUPERADMIN" && role !== "ADMIN")) {
      return new NextResponse("Forbidden - Admin Access Required", { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, priority, resolutionNote } = body;

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(resolutionNote !== undefined ? { resolutionNote } : {}),
      },
    });

    return NextResponse.json({ message: "Ticket updated successfully", ticket: updated });
  } catch (error: any) {
    console.error("[Admin Ticket Update API] Error:", error);
    return NextResponse.json({ error: "Failed to update ticket." }, { status: 500 });
  }
}
