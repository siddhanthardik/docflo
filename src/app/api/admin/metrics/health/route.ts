import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const revalidate = 60;

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let databaseSize = "Unknown";
    try {
      const result: any[] = await prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size;
      `;
      if (result && result.length > 0) {
        databaseSize = result[0].size;
      }
    } catch (e) {
      console.error("Failed to fetch database size:", e);
    }

    const dailyActiveUsers = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        },
        action: "LOGIN"
      }
    });

    const totalAuditLogs = await prisma.auditLog.count();

    return NextResponse.json({
      databaseSize,
      dailyActiveUsers,
      totalAuditLogs
    });
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
