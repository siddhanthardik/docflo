import { prisma } from "@/lib/prisma";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { formatDoctorDisplayName } from "@/services/ai-agents.service";
import { resolveClinicTimezone } from "@/lib/timezone";

export class ReminderService {
  /**
   * Evaluates upcoming confirmed appointments and dispatches 24-hour and 2-hour WhatsApp reminders.
   */
  async sendAppointmentReminders() {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const doctors = await prisma.doctor.findMany({});
      let reminders24hSent = 0;
      let reminders2hSent = 0;

      for (const doctor of doctors) {
        if (!whatsappManager.isConnected(doctor.id)) continue;

        // 1. 24-HOUR PRIOR REMINDERS (If enable24hReminder is not explicitly disabled)
        if (doctor.enable24hReminder !== false) {
          const upcoming24hAppointments = await prisma.appointment.findMany({
            where: {
              doctorId: doctor.id,
              status: "CONFIRMED",
              startTime: {
                gte: now,
                lte: in24Hours,
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

            if (hoursUntilAppointment <= 24 && hoursUntilAppointment > 2) {
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
              const clinicLabel = doctor.clinicName || `${docName}'s Clinic`;

              const msg = `Hi ${appointment.patient.firstName}! 👋\n\nJust a friendly reminder from *${clinicLabel}* about your upcoming consultation with *${docName}* on *${dateStr} at ${timeStr}*.\n\n📍 Please arrive 5-10 minutes early. If you need to reschedule, reply directly to this message. See you soon! 😊`;

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

        // 2. SAME-DAY / 2-HOUR PRIOR REMINDERS (If enable2hReminder is true)
        if (doctor.enable2hReminder === true) {
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

            if (hoursUntilAppointment > 0 && hoursUntilAppointment <= 2.2) {
              const clinicTz = resolveClinicTimezone(doctor.timezone);
              const timeStr = appointmentTime.toLocaleTimeString("en-IN", {
                timeZone: clinicTz,
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              const docName = formatDoctorDisplayName(appointment.practitioner?.name || doctor.name);
              const clinicLabel = doctor.clinicName || `${docName}'s Clinic`;

              const msg = `Hi ${appointment.patient.firstName}! 🔔\n\nFriendly reminder: Your appointment with *${docName}* at *${clinicLabel}* is today in 2 hours at *${timeStr}*.\n\nWe look forward to seeing you shortly! 🩺`;

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

