import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

import { whatsappManager } from "@/lib/whatsapp-manager";

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
      const allPatients = await prisma.patient.findMany({
        where: { doctorId, patientType: { not: "LEAD" } },
        select: { phone: true },
      });
      const uniquePhones = new Set(allPatients.map(p => whatsappManager.normalizePhone(p.phone)).filter(Boolean));
      count = uniquePhones.size;
    } else if (type === "tag" && value) {
      const taggedPatients = await prisma.patient.findMany({
        where: { doctorId, patientType: { not: "LEAD" }, tags: { has: value } },
        select: { phone: true },
      });
      const uniquePhones = new Set(taggedPatients.map(p => whatsappManager.normalizePhone(p.phone)).filter(Boolean));
      count = uniquePhones.size;
    } else if (type === "last_visit_before" && value) {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(value || "0"));
      
      const allPatients = await prisma.patient.findMany({
        where: { doctorId, patientType: { not: "LEAD" } },
        include: { appointments: { orderBy: { date: "desc" }, take: 1 } },
      });
      
      const filtered = allPatients.filter((p: any) => {
        const lastApt = p.appointments[0];
        return !lastApt || new Date(lastApt.date) < monthsAgo;
      });
      const uniquePhones = new Set(filtered.map(p => whatsappManager.normalizePhone(p.phone)).filter(Boolean));
      count = uniquePhones.size;
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Estimate error:", error);
    return NextResponse.json({ error: "Failed to estimate audience" }, { status: 500 });
  }
}
