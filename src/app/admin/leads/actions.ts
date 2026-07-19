"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AuditLeadStatus } from "@prisma/client";

export async function deleteLead(leadId: string) {
  try {
    await prisma.auditLead.delete({
      where: { id: leadId },
    });
    revalidatePath("/admin/leads");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return { success: false, error: "Failed to delete lead" };
  }
}

export async function updateLeadStatus(leadId: string, status: AuditLeadStatus) {
  try {
    const updated = await prisma.auditLead.update({
      where: { id: leadId },
      data: { status },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        eventType: "CRM_STATUS_CHANGED",
        message: `Status updated to ${status}`,
      },
    });

    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    return { success: true, lead: updated };
  } catch (error) {
    console.error("Failed to update status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function addLeadNote(leadId: string, note: string) {
  try {
    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        eventType: "MANUAL_NOTE",
        message: note,
      },
    });

    revalidatePath(`/admin/leads/${leadId}`);
    return { success: true, activity };
  } catch (error) {
    console.error("Failed to add note:", error);
    return { success: false, error: "Failed to add note" };
  }
}

export async function assignSalesperson(leadId: string, userId: string | null) {
  try {
    const updated = await prisma.auditLead.update({
      where: { id: leadId },
      data: { assignedToId: userId },
      include: { assignedTo: true }
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        eventType: "SALES_ASSIGNED",
        message: userId && updated.assignedTo ? `Assigned to ${updated.assignedTo.name}` : "Unassigned",
      },
    });

    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    return { success: true, lead: updated };
  } catch (error) {
    console.error("Failed to assign salesperson:", error);
    return { success: false, error: "Failed to assign salesperson" };
  }
}
