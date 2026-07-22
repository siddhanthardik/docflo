import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function GET(req: Request) {
  const { doctorId } = await getSessionData();
  if (!doctorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
  if (block) return block;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const value = searchParams.get("value");

  try {
    let count = 0;
    
    if (type === "all") {
      count = await prisma.patient.count({
        where: { doctorId },
      });
    } else if (type === "tag" && value) {
      count = await prisma.patient.count({
        where: { doctorId, tags: { has: value } },
      });
    } else if (type === "last_visit_before" && value) {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(value || "0"));
      
      const allPatients = await prisma.patient.findMany({
        where: { doctorId },
        include: { appointments: { orderBy: { date: "desc" }, take: 1 } },
      });
      
      count = allPatients.filter((p: any) => {
        const lastApt = p.appointments[0];
        return !lastApt || new Date(lastApt.date) < monthsAgo;
      }).length;
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Estimate error:", error);
    return NextResponse.json({ error: "Failed to estimate audience" }, { status: 500 });
  }
}
