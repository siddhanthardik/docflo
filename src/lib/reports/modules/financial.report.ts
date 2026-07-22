import { prisma } from "@/lib/prisma";

export async function generateFinancialReport(doctorId: string, start: Date, end: Date) {
  const invoiceGroups = await prisma.invoice.groupBy({
    by: ['status'],
    where: { doctorId, issueDate: { gte: start, lte: end } },
    _sum: {
      totalAmount: true
    },
    _count: {
      id: true
    }
  });

  const totals = {
    revenueSummary: 0,
    paidInvoicesCount: 0,
    paidInvoicesTotal: 0,
    unpaidInvoicesCount: 0,
    unpaidInvoicesTotal: 0,
    overdueInvoicesCount: 0,
    overdueInvoicesTotal: 0,
    outstandingAmount: 0
  };

  for (const group of invoiceGroups) {
    const amount = group._sum.totalAmount || 0;
    const count = group._count.id;
    
    // Revenue Summary = All non-cancelled invoices (total billed)
    if (group.status !== 'CANCELLED') {
      totals.revenueSummary += amount;
    }

    if (group.status === 'PAID') {
      totals.paidInvoicesCount += count;
      totals.paidInvoicesTotal += amount;
    } else if (group.status === 'UNPAID' || group.status === 'PARTIALLY_PAID') {
      totals.unpaidInvoicesCount += count;
      totals.unpaidInvoicesTotal += amount;
      totals.outstandingAmount += amount;
    } else if (group.status === 'OVERDUE') {
      totals.overdueInvoicesCount += count;
      totals.overdueInvoicesTotal += amount;
      totals.outstandingAmount += amount;
    }
  }

  return {
    financials: totals
  };
}
