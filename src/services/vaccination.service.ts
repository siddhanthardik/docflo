import { prisma } from "@/lib/prisma";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { formatDoctorDisplayName } from "@/services/ai-agents.service";
import { formatPatientSalutation } from "@/lib/salutation";
import { resolveClinicTimezone } from "@/lib/timezone";

export interface IAPMilestone {
  code: string;
  name: string;
  milestone: string;
  offsetWeeks: number;
}

export const IAP_VACCINE_SCHEDULE: IAPMilestone[] = [
  {
    code: "VACC_BIRTH",
    name: "BCG, OPV-0, Hepatitis B-1",
    milestone: "Birth Vaccines",
    offsetWeeks: 0
  },
  {
    code: "VACC_6W",
    name: "DTwP/DTaP-1, IPV-1, HepB-2, Hib-1, Rotavirus-1, PCV-1",
    milestone: "6 Weeks (1.5 Months)",
    offsetWeeks: 6
  },
  {
    code: "VACC_10W",
    name: "DTwP/DTaP-2, IPV-2, Hib-2, Rotavirus-2, PCV-2",
    milestone: "10 Weeks (2.5 Months)",
    offsetWeeks: 10
  },
  {
    code: "VACC_14W",
    name: "DTwP/DTaP-3, IPV-3, Hib-3, Rotavirus-3, PCV-3",
    milestone: "14 Weeks (3.5 Months)",
    offsetWeeks: 14
  },
  {
    code: "VACC_6M",
    name: "Influenza-1, Typhoid Conjugate Vaccine (TCV)",
    milestone: "6 Months",
    offsetWeeks: 26
  },
  {
    code: "VACC_7M",
    name: "Influenza-2",
    milestone: "7 Months",
    offsetWeeks: 30
  },
  {
    code: "VACC_9M",
    name: "MMR-1 (Measles, Mumps, Rubella), OPV-1",
    milestone: "9 Months",
    offsetWeeks: 39
  },
  {
    code: "VACC_12M",
    name: "Hepatitis A-1",
    milestone: "12 Months (1 Year)",
    offsetWeeks: 52
  },
  {
    code: "VACC_15M",
    name: "MMR-2, Varicella-1 (Chickenpox), PCV Booster",
    milestone: "15 Months",
    offsetWeeks: 65
  },
  {
    code: "VACC_18M",
    name: "DTwP/DTaP Booster-1, IPV Booster-1, Hib Booster",
    milestone: "18 Months (1.5 Years)",
    offsetWeeks: 78
  },
  {
    code: "VACC_2Y",
    name: "Hepatitis A-2, Typhoid Booster",
    milestone: "2 Years",
    offsetWeeks: 104
  },
  {
    code: "VACC_4_5Y",
    name: "DTwP/DTaP Booster-2, IPV Booster-2, MMR-3, Varicella-2",
    milestone: "4 to 5 Years",
    offsetWeeks: 234
  },
  {
    code: "VACC_10Y",
    name: "Tdap / Td, HPV Vaccine (Dose 1)",
    milestone: "10 Years",
    offsetWeeks: 520
  }
];

export class VaccinationService {
  /**
   * Initializes the standard IAP vaccination schedule for a pediatric patient based on their Date of Birth.
   */
  static async initializeScheduleForPatient(
    patientId: string,
    doctorId: string,
    dateOfBirth: Date | string
  ): Promise<number> {
    try {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return 0;

      const now = new Date();
      // Skip milestones that are older than 30 days in the past
      const pastCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let createdCount = 0;

      for (const item of IAP_VACCINE_SCHEDULE) {
        const dueDate = new Date(birthDate.getTime() + item.offsetWeeks * 7 * 24 * 60 * 60 * 1000);

        if (dueDate < pastCutoff) {
          continue;
        }

        await (prisma as any).patientVaccineRecord.upsert({
          where: {
            patientId_vaccineCode: {
              patientId,
              vaccineCode: item.code
            }
          },
          update: {
            dueDate,
            milestone: item.milestone,
            vaccineName: item.name
          },
          create: {
            patientId,
            doctorId,
            vaccineCode: item.code,
            vaccineName: item.name,
            milestone: item.milestone,
            dueDate,
            status: "PENDING"
          }
        });
        createdCount++;
      }

      console.log(`[VaccinationService] Initialized ${createdCount} IAP vaccination milestones for patient ${patientId}`);
      return createdCount;
    } catch (err) {
      console.error("[VaccinationService] Error initializing schedule:", err);
      return 0;
    }
  }

  /**
   * Evaluates pending vaccine milestones and dispatches WhatsApp reminders:
   * - 1 Month Prior (approx. 28-31 days)
   * - 1 Week Prior (approx. 6-8 days)
   * - 1 Day Prior (approx. 20-28 hours)
   */
  static async sendVaccinationReminders(): Promise<{ m1: number; w1: number; d1: number }> {
    const stats = { m1: 0, w1: 0, d1: 0 };
    try {
      const now = new Date();

      // Find all doctors with active WhatsApp connection
      const doctors = await prisma.doctor.findMany({
        where: {
          specialty: {
            contains: "pediatric",
            mode: "insensitive"
          }
        }
      });

      for (const doctor of doctors) {
        if (!whatsappManager.isConnected(doctor.id)) continue;
        const clinicTz = resolveClinicTimezone(doctor.timezone);
        const docName = formatDoctorDisplayName(doctor.name);

        // 1. ONE MONTH PRIOR (28 to 31 days)
        const min30d = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
        const max30d = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

        const due1Month = await (prisma as any).patientVaccineRecord.findMany({
          where: {
            doctorId: doctor.id,
            status: "PENDING",
            reminder1mSent: false,
            dueDate: { gte: min30d, lte: max30d },
            patient: { vaccinationOptOut: false, isBlocked: false }
          },
          include: { patient: true }
        });

        for (const record of due1Month) {
          const ptSal = formatPatientSalutation(record.patient);
          const formattedDate = record.dueDate.toLocaleDateString("en-IN", {
            timeZone: clinicTz,
            day: "numeric",
            month: "short",
            year: "numeric"
          });

          const msg = `Dear Parent, friendly immunization update from ${docName}'s clinic! 🌸\n\n` +
            `*${ptSal.fullNameWithSalutation}* has upcoming **${record.milestone} IAP Vaccines** due in approximately 1 month (*${formattedDate}*):\n` +
            `💉 *Vaccines:* ${record.vaccineName}\n\n` +
            `Timely vaccination ensures complete immunity against preventable illnesses. You can easily schedule an appointment by replying to this message. 😊`;

          const sent = await whatsappManager.sendOutboundPatientMessage(
            null,
            doctor.id,
            record.patient.phone,
            msg,
            record.patient.id,
            ptSal.fullNameWithSalutation
          );

          if (sent) {
            await (prisma as any).patientVaccineRecord.update({
              where: { id: record.id },
              data: { reminder1mSent: true }
            });
            stats.m1++;
          }
        }

        // 2. ONE WEEK PRIOR (6 to 8 days)
        const min7d = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
        const max7d = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

        const due1Week = await (prisma as any).patientVaccineRecord.findMany({
          where: {
            doctorId: doctor.id,
            status: "PENDING",
            reminder1wSent: false,
            dueDate: { gte: min7d, lte: max7d },
            patient: { vaccinationOptOut: false, isBlocked: false }
          },
          include: { patient: true }
        });

        for (const record of due1Week) {
          const ptSal = formatPatientSalutation(record.patient);
          const formattedDate = record.dueDate.toLocaleDateString("en-IN", {
            timeZone: clinicTz,
            day: "numeric",
            month: "short",
            year: "numeric"
          });

          const msg = `Dear Parent, reminder from ${docName}'s clinic! 🧸\n\n` +
            `*${ptSal.fullNameWithSalutation}*'s **${record.milestone} Vaccination** is due next week (*${formattedDate}*):\n` +
            `💉 *Vaccines:* ${record.vaccineName}\n\n` +
            `Would you like to book a morning or evening vaccination slot with ${docName}? Simply reply with your preferred day/time to reserve your slot! 🙏`;

          const sent = await whatsappManager.sendOutboundPatientMessage(
            null,
            doctor.id,
            record.patient.phone,
            msg,
            record.patient.id,
            ptSal.fullNameWithSalutation
          );

          if (sent) {
            await (prisma as any).patientVaccineRecord.update({
              where: { id: record.id },
              data: { reminder1wSent: true }
            });
            stats.w1++;
          }
        }

        // 3. ONE DAY PRIOR (20 to 28 hours)
        const min1d = new Date(now.getTime() + 20 * 60 * 60 * 1000);
        const max1d = new Date(now.getTime() + 28 * 60 * 60 * 1000);

        const due1Day = await (prisma as any).patientVaccineRecord.findMany({
          where: {
            doctorId: doctor.id,
            status: "PENDING",
            reminder1dSent: false,
            dueDate: { gte: min1d, lte: max1d },
            patient: { vaccinationOptOut: false, isBlocked: false }
          },
          include: { patient: true }
        });

        for (const record of due1Day) {
          const ptSal = formatPatientSalutation(record.patient);
          const formattedDate = record.dueDate.toLocaleDateString("en-IN", {
            timeZone: clinicTz,
            day: "numeric",
            month: "short",
            year: "numeric"
          });

          const msg = `Dear Parent, final reminder from ${docName}'s clinic! 🍼\n\n` +
            `*${ptSal.fullNameWithSalutation}*'s **${record.milestone} Vaccination** is due tomorrow (*${formattedDate}*):\n` +
            `💉 *Vaccines:* ${record.vaccineName}\n\n` +
            `Please carry your baby's vaccination record book/card. To confirm your visit or check today's OPD timings, please reply directly to this chat. ✨`;

          const sent = await whatsappManager.sendOutboundPatientMessage(
            null,
            doctor.id,
            record.patient.phone,
            msg,
            record.patient.id,
            ptSal.fullNameWithSalutation
          );

          if (sent) {
            await (prisma as any).patientVaccineRecord.update({
              where: { id: record.id },
              data: { reminder1dSent: true }
            });
            stats.d1++;
          }
        }
      }

      return stats;
    } catch (err) {
      console.error("[VaccinationService] Error in sendVaccinationReminders:", err);
      return stats;
    }
  }
}
