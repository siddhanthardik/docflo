import { prisma } from "@/lib/prisma";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { formatDoctorDisplayName } from "@/services/ai-agents.service";
import { resolveClinicTimezone } from "@/lib/timezone";
import { formatPatientSalutation } from "@/lib/salutation";
import { VaccinationService } from "@/services/vaccination.service";

export class ReminderService {
  /**
   * Evaluates upcoming confirmed appointments and dispatches 24-hour and 2-hour WhatsApp reminders,
   * as well as automated IAP guideline vaccination reminders for pediatric patients.
   */
  async sendAppointmentReminders() {
    try {
      // Trigger periodic IAP pediatric vaccination reminders
      try {
        await VaccinationService.sendVaccinationReminders();
      } catch (vaccErr) {
        console.error("[ReminderService] Vaccination reminder check error:", vaccErr);
      }

      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const doctors = await prisma.doctor.findMany({});
      let reminders24hSent = 0;
      let reminders2hSent = 0;

      for (const doctor of doctors) {
        if (!whatsappManager.isConnected(doctor.id)) continue;

        // 1. 24-HOUR PRIOR REMINDERS (Strictly for appointments booked in advance, 20-26 hours prior)
        if (doctor.enable24hReminder !== false) {
          const min24h = new Date(now.getTime() + 20 * 60 * 60 * 1000);
          const max24h = new Date(now.getTime() + 26 * 60 * 60 * 1000);

          const upcoming24hAppointments = await prisma.appointment.findMany({
            where: {
              doctorId: doctor.id,
              status: "CONFIRMED",
              startTime: {
                gte: min24h,
                lte: max24h,
              },
              followUps: {
                none: {
                  type: "24_HOUR",
                },
              },
            },
            include: {
              patient: true,
              practitioner: true,
            },
          });

          for (const appointment of upcoming24hAppointments) {
            const appointmentTime = new Date(appointment.startTime);
            const hoursUntilAppointment =
              (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            const msSinceCreation = now.getTime() - appointment.createdAt.getTime();

            // Strictly fire between 20 and 26 hours prior, and never if booked within the last 2 hours
            if (hoursUntilAppointment >= 20 && hoursUntilAppointment <= 26 && msSinceCreation > 2 * 60 * 60 * 1000) {
              const clinicTz = resolveClinicTimezone(doctor.timezone);
              const timeStr = appointmentTime.toLocaleTimeString("en-IN", {
                timeZone: clinicTz,
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
              const dateStr = appointmentTime.toLocaleDateString("en-IN", {
                timeZone: clinicTz,
                weekday: "short",
                day: "numeric",
                month: "short",
              });

              const docName = formatDoctorDisplayName(appointment.practitioner?.name || doctor.name);
              const hasDistinctClinic = Boolean(
                doctor.clinicName && 
                doctor.clinicName.trim() && 
                doctor.clinicName.trim().toLowerCase() !== docName.toLowerCase() &&
                !doctor.clinicName.trim().toLowerCase().includes(docName.toLowerCase().replace(/^dr\.?\s*/i, ''))
              );
              const fromClinicPrefix = hasDistinctClinic ? `from *${doctor.clinicName!.trim()}* ` : "";
              const salutation = formatPatientSalutation(appointment.patient);
              const isTeleConsultation = appointment.type === "TELE_CONSULTATION" || 
                (appointment.notes && /tele|online|video/i.test(appointment.notes));

              const msg = isTeleConsultation
                ? `Hi ${salutation.greetingName}! 👋\n\nJust a friendly reminder ${fromClinicPrefix}about your upcoming online consultation with *${docName}* on *${dateStr} at ${timeStr}*.\n\n💻 This is an online consultation. We will connect with you digitally (via video/call link) at the scheduled time. If you need to reschedule, reply directly to this message. See you soon! 😊`
                : `Hi ${salutation.greetingName}! 👋\n\nJust a friendly reminder ${fromClinicPrefix}about your upcoming consultation with *${docName}* on *${dateStr} at ${timeStr}*.\n\n📍 Please arrive 5-10 minutes early. If you need to reschedule, reply directly to this message. See you soon! 😊`;

              await whatsappManager.sendMessage(doctor.id, appointment.patient.phone, msg);

              await prisma.appointmentFollowUp.create({
                data: {
                  appointmentId: appointment.id,
                  type: "24_HOUR",
                },
              });
              await prisma.appointment.update({
                where: { id: appointment.id },
                data: { reminderSent: true },
              });
              reminders24hSent++;
            }
          }
        }

        // 2. SAME-DAY / 2-HOUR PRIOR REMINDERS (Active for every patient unless explicitly disabled)
        if (doctor.enable2hReminder !== false) {
          const upcoming2hAppointments = await prisma.appointment.findMany({
            where: {
              doctorId: doctor.id,
              status: "CONFIRMED",
              startTime: {
                gte: now,
                lte: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
              },
              followUps: {
                none: {
                  type: "2_HOUR",
                },
              },
            },
            include: {
              patient: true,
              practitioner: true,
            },
          });

          for (const appointment of upcoming2hAppointments) {
            const appointmentTime = new Date(appointment.startTime);
            const hoursUntilAppointment =
              (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            const msSinceCreation = now.getTime() - appointment.createdAt.getTime();

            // Fire between 15 minutes and 2.2 hours prior, but skip if appointment was created within the last 45 minutes (to avoid redundant alerts immediately after booking card)
            if (hoursUntilAppointment > 0.25 && hoursUntilAppointment <= 2.2 && msSinceCreation > 45 * 60 * 1000) {
              const clinicTz = resolveClinicTimezone(doctor.timezone);
              const timeStr = appointmentTime.toLocaleTimeString("en-IN", {
                timeZone: clinicTz,
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              const docName = formatDoctorDisplayName(appointment.practitioner?.name || doctor.name);
              const hasDistinctClinic = Boolean(
                doctor.clinicName && 
                doctor.clinicName.trim() && 
                doctor.clinicName.trim().toLowerCase() !== docName.toLowerCase() &&
                !doctor.clinicName.trim().toLowerCase().includes(docName.toLowerCase().replace(/^dr\.?\s*/i, ''))
              );
              const atClinicSuffix = hasDistinctClinic ? ` at *${doctor.clinicName!.trim()}*` : "";
              const salutation = formatPatientSalutation(appointment.patient);
              const isTeleConsultation = appointment.type === "TELE_CONSULTATION" || 
                (appointment.notes && /tele|online|video/i.test(appointment.notes));

              const msg = isTeleConsultation
                ? `Hi ${salutation.greetingName}! 🔔\n\nFriendly reminder: Your online consultation with *${docName}* is today in 2 hours at *${timeStr}*.\n\n💻 We will connect with you digitally. Please be ready with your reports/prescriptions at the scheduled time! 🩺`
                : `Hi ${salutation.greetingName}! 🔔\n\nFriendly reminder: Your appointment with *${docName}*${atClinicSuffix} is today in 2 hours at *${timeStr}*.\n\nWe look forward to seeing you shortly! 🩺`;

              await whatsappManager.sendMessage(doctor.id, appointment.patient.phone, msg);

              await prisma.appointmentFollowUp.create({
                data: {
                  appointmentId: appointment.id,
                  type: "2_HOUR",
                },
              });
              reminders2hSent++;
            }
          }
        }
      }

      return { success: true, message: `Reminders sweep completed: ${reminders24hSent} 24h reminders & ${reminders2hSent} 2h reminders sent.` };
    } catch (error) {
      console.error("Error sending reminders:", error);
      throw error;
    }
  }

  async sendReviewRequest(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: true,
          doctor: true,
          practitioner: true,
        },
      });

      if (
        !appointment ||
        !whatsappManager.isConnected(appointment.doctorId) ||
        appointment.reviewRequested
      ) {
        return;
      }

      // Get Google review link
      const gbpAccount = await prisma.gbpAccount.findFirst({
        where: { doctorId: appointment.doctorId },
      });

      let reviewLink = "https://g.page/r/yourbusiness"; // Fallback
      if (gbpAccount?.locationName) {
        const placeId = gbpAccount.locationName.split("/").pop();
        reviewLink = `https://search.google.com/local/writereview?placeid=${placeId}`;
      }

      const docName = formatDoctorDisplayName(appointment.practitioner?.name || appointment.doctor.name);
      const clinicLabel = appointment.doctor.clinicName || `${docName}'s Clinic`;

      const msg = `Hi ${appointment.patient.firstName}, thank you for visiting *${clinicLabel}* today! We would love to hear your feedback on your consultation with ${docName}. Please leave us a quick review: ${reviewLink}`;

      await whatsappManager.sendMessage(appointment.doctorId, appointment.patient.phone, msg);

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reviewRequested: true, reviewStatus: "LINK_SENT" },
      });

      return { success: true, message: "Review request sent" };
    } catch (error) {
      console.error("Error sending review request:", error);
      throw error;
    }
  }
}

