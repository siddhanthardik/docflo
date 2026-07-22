import { prisma } from "@/lib/prisma";

export async function generateAppointmentReport(doctorId: string, start: Date, end: Date) {
  // Use Prisma groupBy to avoid in-memory filtering of massive arrays
  const appointmentGroups = await prisma.appointment.groupBy({
    by: ['status'],
    where: { doctorId, date: { gte: start, lte: end } },
    _count: {
      status: true
    }
  });

  const totals = {
    totalAppointments: 0,
    appointmentOutcomes: {
      scheduled: 0, // CONFIRMED + CHECKED_IN
      completed: 0,
      cancelled: 0,
      noShow: 0
    }
  };

  for (const group of appointmentGroups) {
    const count = group._count.status;
    totals.totalAppointments += count;

    switch (group.status) {
      case "CONFIRMED":
      case "CHECKED_IN":
        totals.appointmentOutcomes.scheduled += count;
        break;
      case "COMPLETED":
        totals.appointmentOutcomes.completed = count;
        break;
      case "CANCELLED":
        totals.appointmentOutcomes.cancelled = count;
        break;
      case "NO_SHOW":
        totals.appointmentOutcomes.noShow = count;
        break;
    }
  }

  // Still need daily appointments for the line chart.
  // Using an optimized select instead of loading everything.
  const dailyQuery = await prisma.appointment.findMany({
    where: { doctorId, date: { gte: start, lte: end } },
    select: { date: true },
    orderBy: { date: 'asc' }
  });

  const dailyAppointments = dailyQuery.map(apt => ({
    date: apt.date.toISOString().split("T")[0],
  }));

  const reviewRequestsSent = await prisma.appointment.count({
    where: { doctorId, date: { gte: start, lte: end }, reviewRequested: true }
  });

  return {
    ...totals,
    dailyAppointments,
    reviewRequestsSent
  };
}
