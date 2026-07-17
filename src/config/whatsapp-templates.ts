export const DEFAULT_TEMPLATES = [
  {
    name: "appointment_reminder_24hr",
    language: "en",
    category: "APPOINTMENT_REMINDER",
    components: [
      {
        type: "HEADER",
        text: "Appointment Reminder",
      },
      {
        type: "BODY",
        text: "Hi {{1}}, this is a reminder of your appointment with Dr. {{2}} tomorrow at {{3}}. Reply CONFIRM to confirm or call us to reschedule.",
      },
      {
        type: "FOOTER",
        text: "MedPractice - Healthcare Management",
      },
    ],
  },
  {
    name: "appointment_reminder_1hr",
    language: "en",
    category: "APPOINTMENT_REMINDER",
    components: [
      {
        type: "HEADER",
        text: "Upcoming Appointment",
      },
      {
        type: "BODY",
        text: "Hi {{1}}, your appointment is in 1 hour at {{2}}. Please arrive on time.",
      },
    ],
  },
  {
    name: "review_request",
    language: "en",
    category: "FEEDBACK",
    components: [
      {
        type: "HEADER",
        text: "Share Your Experience",
      },
      {
        type: "BODY",
        text: "Thank you for visiting {{2}}, {{1}}! We'd love to hear about your experience. Please take a moment to leave us a review: {{3}}",
      },
    ],
  },
  {
    name: "welcome_message",
    language: "en",
    category: "WELCOME",
    components: [
      {
        type: "HEADER",
        text: "Welcome!",
      },
      {
        type: "BODY",
        text: "Hi {{1}}, welcome to {{2}}! We're glad to have you as our patient. If you have any questions, feel free to reach out.",
      },
    ],
  },
];