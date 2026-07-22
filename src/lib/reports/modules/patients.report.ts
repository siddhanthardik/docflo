import { prisma } from "@/lib/prisma";

export async function generatePatientReport(doctorId: string, start: Date, end: Date) {
  // Use Prisma groupBy to avoid in-memory filtering
  const patientGroups = await prisma.patient.groupBy({
    by: ['patientType'],
    where: { doctorId, createdAt: { gte: start, lte: end } },
    _count: {
      patientType: true
    }
  });

  const totals = {
    totalNewPatients: 0,
    patientFunnel: {
      leads: 0,
      active: 0,
      inactive: 0,
      lost: 0
    }
  };

  for (const group of patientGroups) {
    const count = group._count.patientType;
    totals.totalNewPatients += count;
    
    switch (group.patientType) {
      case "LEAD":
        totals.patientFunnel.leads = count;
        break;
      case "ACTIVE":
        totals.patientFunnel.active = count;
        break;
      case "INACTIVE":
        totals.patientFunnel.inactive = count;
        break;
      case "LOST":
        totals.patientFunnel.lost = count;
        break;
    }
  }

  return totals;
}
