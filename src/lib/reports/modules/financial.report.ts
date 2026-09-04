import { prisma } from "@/lib/prisma";

export async function generateFinancialReport(doctorId: string, start: Date, end: Date) {
  const invoices = await prisma.invoice.findMany({
    where: { doctorId, issueDate: { gte: start, lte: end } },
    include: {
      payments: true
    }
  });

  const totals = {
    revenueSummary: 0,
    paidInvoicesCount: 0,
    paidInvoicesTotal: 0,
    partiallyPaidInvoicesCount: 0,
    partiallyPaidInvoicesTotal: 0,
    unpaidInvoicesCount: 0,
    unpaidInvoicesTotal: 0,
    overdueInvoicesCount: 0,
    overdueInvoicesTotal: 0,
    outstandingAmount: 0
  };

  for (const inv of invoices) {
    if (inv.status === 'CANCELLED') continue;

    const totalAmt = inv.totalAmount || 0;
    totals.revenueSummary += totalAmt;

    // Calculate actual amount paid from payment transactions
    const paymentRecordsSum = (inv.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    // If status is marked PAID but payments array is empty, treat as fully paid
    const amountPaid = inv.status === 'PAID' ? Math.max(totalAmt, paymentRecordsSum) : paymentRecordsSum;
    const balanceDue = Math.max(0, totalAmt - amountPaid);

    // Accumulate all collected revenue
    totals.paidInvoicesTotal += amountPaid;

    if (inv.status === 'PAID' || balanceDue <= 0.01) {
      totals.paidInvoicesCount += 1;
    } else if (inv.status === 'PARTIALLY_PAID' || (amountPaid > 0 && balanceDue > 0.01)) {
      totals.partiallyPaidInvoicesCount += 1;
      totals.partiallyPaidInvoicesTotal += balanceDue;
      totals.unpaidInvoicesTotal += balanceDue;
      totals.outstandingAmount += balanceDue;
    } else if (inv.status === 'OVERDUE') {
      totals.overdueInvoicesCount += 1;
      totals.overdueInvoicesTotal += balanceDue;
      totals.outstandingAmount += balanceDue;
    } else {
      // UNPAID or DRAFT with 0 payments
      totals.unpaidInvoicesCount += 1;
      totals.unpaidInvoicesTotal += balanceDue;
      totals.outstandingAmount += balanceDue;
    }
  }

  return {
    financials: totals
  };
}
