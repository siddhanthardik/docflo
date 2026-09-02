import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/support/tickets
 * List all tickets across all clinics for SuperAdmin / Admin
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!session?.user?.id || (role !== "SUPERADMIN" && role !== "ADMIN")) {
      return new NextResponse("Forbidden - Admin Access Required", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    const whereClause: any = {};
    if (status && status !== "ALL") whereClause.status = status;
    if (priority && priority !== "ALL") whereClause.priority = priority;
    if (category && category !== "ALL") whereClause.category = category;

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            clinicName: true,
            email: true,
            phone: true,
            package: { select: { name: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [
        { status: "asc" }, // OPEN first
        { createdAt: "desc" },
      ],
    });

    const counts = {
      all: await prisma.supportTicket.count(),
      open: await prisma.supportTicket.count({ where: { status: "OPEN" } }),
      inProgress: await prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
      resolved: await prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
    };

    return NextResponse.json({ tickets, counts });
  } catch (error: any) {
    console.error("[Admin Support Tickets API] Error:", error);
    return NextResponse.json({ error: "Failed to load support tickets." }, { status: 500 });
  }
}
