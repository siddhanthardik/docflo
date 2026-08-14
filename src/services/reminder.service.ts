import { prisma } from "@/lib/prisma";
import { whatsappManager } from "@/lib/whatsapp-manager";

export class ReminderService {
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
            },
          });

          for (const appointment of upcoming24hAppointments) {
            const appointmentTime = new Date(appointment.startTime);
            const hoursUntilAppointment =
              (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (hoursUntilAppointment <= 24 && hoursUntilAppointment > 2) {
              const timeStr = appointmentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const msg = `Hi ${appointment.patient.firstName}! Just a friendly reminder from ${doctor.clinicName || 'our clinic'} about your appointment tomorrow at ${timeStr}.\n\nIf anything has changed, please let us know.`;
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
            },
          });

          for (const appointment of upcoming2hAppointments) {
            const appointmentTime = new Date(appointment.startTime);
            const hoursUntilAppointment =
              (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (hoursUntilAppointment > 0 && hoursUntilAppointment <= 2.2) {
              const timeStr = appointmentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const msg = `Hi ${appointment.patient.firstName}! Friendly reminder: Your appointment with ${doctor.clinicName || 'our clinic'} is today in 2 hours at ${timeStr}.\n\nWe look forward to seeing you soon! 🩺`;
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
        // Extract place ID from location name
        const placeId = gbpAccount.locationName.split("/").pop();
        reviewLink = `https://search.google.com/local/writereview?placeid=${placeId}`;
      }

      const msg = `Hi ${appointment.patient.firstName}, thank you for visiting ${appointment.doctor.clinicName || "us"} today! We would love to hear your feedback. Please leave us a review: ${reviewLink}`;
      await whatsappManager.sendMessage(appointment.doctorId, appointment.patient.phone, msg);

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reviewRequested: true },
      });

      return { success: true, message: "Review request sent" };
    } catch (error) {
      console.error("Error sending review request:", error);
      throw error;
    }
  }

  async sendFollowUpReminders() {
    try {
      const now = new Date();
      const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const past48Hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const doctors = await prisma.doctor.findMany({});

      for (const doctor of doctors) {
        if (!whatsappManager.isConnected(doctor.id)) continue;

        // Find COMPLETED appointments from the last 24-48 hours
        const recentAppointments = await prisma.appointment.findMany({
          where: {
            doctorId: doctor.id,
            status: "COMPLETED",
            date: {
              gte: past48Hours,
              lte: past24Hours,
            },
            // Ensure no "1_DAY" follow up has been sent yet
            followUps: {
              none: {
                type: "1_DAY"
              }
            }
          },
          include: {
            patient: true,
            doctor: true
          }
        });

        for (const appointment of recentAppointments) {
          const msg = `Hi ${appointment.patient.firstName}, this is ${appointment.doctor.clinicName || 'our clinic'} checking in! We hope you're feeling great after your visit with us yesterday.\n\nYour health is our priority—if you have any lingering questions or concerns, please don't hesitate to reach out right here. Take care! 💙`;
          
          await whatsappManager.sendMessage(doctor.id, appointment.patient.phone, msg);

          await prisma.appointmentFollowUp.create({
            data: {
              appointmentId: appointment.id,
              type: "1_DAY"
            }
          });
        }
      }
      return { success: true, message: "Follow-ups sent successfully" };
    } catch (error) {
      console.error("Error sending follow-ups:", error);
      throw error;
    }
  }
}