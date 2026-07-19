"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function convertToCustomer(
  leadId: string, 
  packageId: string, 
  temporaryPassword?: string
) {
  try {
    const lead = await prisma.auditLead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    if (lead.status === "CUSTOMER") {
      return { success: false, error: "Lead is already a customer" };
    }

    if (lead.convertedDoctorId) {
      return { success: false, error: "Lead has already been converted to a Doctor account" };
    }

    // Prepare credentials
    // If no password is provided by the sales rep, generate a random one
    const plainPassword = temporaryPassword || Math.random().toString(36).slice(-8) + "Aa1!";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const email = lead.email || `temp-${lead.id}@docflo.local`;

    // We must execute this in a transaction to ensure atomic conversion
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Doctor account
      const doctor = await tx.doctor.create({
        data: {
          name: lead.name,
          email: email,
          password: hashedPassword,
          phone: lead.phone,
          clinicName: lead.clinicName || lead.name,
          packageId: packageId || null,
          subscriptionStatus: packageId ? "ACTIVE" : "ACTIVE",
          role: "DOCTOR",
        },
      });

      // 2. Update the Lead status and link to the Doctor account
      const updatedLead = await tx.auditLead.update({
        where: { id: lead.id },
        data: {
          status: "CUSTOMER",
          convertedDoctorId: doctor.id,
        },
      });

      // 3. Create a Lead Activity to record the conversion
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          eventType: "CONVERTED_TO_CUSTOMER",
          message: "Lead successfully converted to a paying customer",
          metadata: {
            doctorId: doctor.id,
            packageId: packageId,
          }
        },
      });

      return { doctor, plainPassword };
    });

    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);

    return { 
      success: true, 
      doctorId: result.doctor.id, 
      email: result.doctor.email,
      temporaryPassword: result.plainPassword
    };

  } catch (error: any) {
    console.error("[convertToCustomer] Error:", error);
    // Handle unique constraint on email
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return { success: false, error: "An account with this email already exists." };
    }
    return { success: false, error: error.message || "Failed to convert lead" };
  }
}
