import { prisma } from "@/lib/prisma";

export interface GeneratedWebsiteData {
  subdomain: string;
  themeId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  siteTitle: string;
  tagline: string;
  heroHeading: string;
  heroSubheading: string;
  heroImage: string | null;
  heroStyle: string;
  announcementBar: string | null;
  ctaButtonText: string;
  ctaButtonAction: string;
  whatsappNumber: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  showServices: boolean;
  showReviews: boolean;
  showDoctorBio: boolean;
  showFaq: boolean;
  showMap: boolean;
  showStickyBar: boolean;
  customServices: Array<{ name: string; description: string; duration?: number; price?: number; icon?: string }>;
  customFaqs: Array<{ question: string; answer: string }>;
  customBio: string | null;
  metaTitle: string;
  metaDescription: string;
}

export class WebsiteFactoryService {
  /**
   * Intelligently selects the best-matched theme and color harmony based on medical specialty
   */
  static getSpecialtyThemeDefaults(specialty: string = ""): {
    themeId: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontHeading: string;
    fontBody: string;
  } {
    const s = specialty.toLowerCase();

    if (s.includes("derma") || s.includes("skin") || s.includes("cosmet") || s.includes("plastic")) {
      return {
        themeId: "serene-glow",
        primaryColor: "#BE185D", // Luxury Rose
        secondaryColor: "#1E1B4B",
        accentColor: "#F43F5E",
        fontHeading: "Playfair Display",
        fontBody: "Inter",
      };
    }

    if (s.includes("dent") || s.includes("orthodont") || s.includes("smile")) {
      return {
        themeId: "minimal-luxe",
        primaryColor: "#0284C7", // Cyan Mint
        secondaryColor: "#0F172A",
        accentColor: "#14B8A6",
        fontHeading: "Plus Jakarta Sans",
        fontBody: "Inter",
      };
    }

    if (s.includes("pediat") || s.includes("child") || s.includes("kids")) {
      return {
        themeId: "warm-pediatrics",
        primaryColor: "#059669", // Friendly Emerald
        secondaryColor: "#1E293B",
        accentColor: "#F59E0B",
        fontHeading: "Plus Jakarta Sans",
        fontBody: "Inter",
      };
    }

    if (s.includes("ortho") || s.includes("physio") || s.includes("rehab") || s.includes("joint") || s.includes("spine")) {
      return {
        themeId: "vitality-rehab",
        primaryColor: "#0D9488", // Athletic Teal
        secondaryColor: "#18181B",
        accentColor: "#E11D48",
        fontHeading: "Plus Jakarta Sans",
        fontBody: "Inter",
      };
    }

    // Default: Apex Clinical (Polyclinics, General Physicians, Cardiology, etc.)
    return {
      themeId: "apex-clinical",
      primaryColor: "#2563EB", // Authority Royal Blue
      secondaryColor: "#0F172A",
      accentColor: "#10B981",
      fontHeading: "Plus Jakarta Sans",
      fontBody: "Inter",
    };
  }

  /**
   * Generates a clean default subdomain slug from doctor / clinic name
   */
  static generateDefaultSlug(name: string, city: string = ""): string {
    const raw = (name || "clinic")
      .toLowerCase()
      .replace(/^dr.?\s*/i, "dr-")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return raw.slice(0, 30);
  }

  /**
   * Ingests full Doctor, GBP & Settings data to synthesize an initial ready-to-publish website
   */
  static async synthesizeClinicWebsite(doctorId: string): Promise<GeneratedWebsiteData> {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        serviceTypes: { where: { isActive: true } },
        reviews: { orderBy: { reviewDate: "desc" }, take: 6 },
        gbpAccounts: {
          include: {
            profileSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          take: 1,
        },
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const gbpAccount = doctor.gbpAccounts[0];
    const gbpSnapshot = gbpAccount?.profileSnapshots?.[0];
    const snapshotJson = (gbpSnapshot?.json as any) || {};

    const clinicName = doctor.clinicName || snapshotJson.businessName || doctor.name || "Premier Medical Clinic";
    const specialty = doctor.specialty || snapshotJson.primaryCategory || "Healthcare & Medical Care";
    const city = doctor.city || snapshotJson.city || "";
    const phone = doctor.phone || snapshotJson.phone || "";
    const address = doctor.address || snapshotJson.address || "";

    const themeConfig = this.getSpecialtyThemeDefaults(specialty);
    const suggestedSubdomain = this.generateDefaultSlug(clinicName, city);

    // Build default services from ServiceType or specialty fallback
    let services: Array<{ name: string; description: string; duration?: number; price?: number; icon?: string }> = doctor.serviceTypes.map((st) => ({
      name: st.name,
      description: st.description || `Comprehensive clinical consultation and specialized treatment for ${st.name}.`,
      duration: st.duration || 30,
      price: st.price ? Number(st.price) : undefined,
    }));

    if (services.length === 0) {
      services = [
        {
          name: "Initial Comprehensive Consultation",
          description: `Detailed medical diagnosis, clinical evaluation, and tailored treatment planning by ${doctor.name}.`,
          duration: 30,
          price: undefined,
        },
        {
          name: `Specialized ${specialty} Care`,
          description: "Evidence-based clinical procedures and therapeutic treatments using modern technology.",
          duration: 45,
          price: undefined,
        },
        {
          name: "Follow-Up & Treatment Review",
          description: "Progress monitoring, prescription optimization, and continuous patient recovery guidance.",
          duration: 20,
          price: undefined,
        },
      ];
    }

    // Build default FAQs
    const faqs = [
      {
        question: "How do I book an appointment?",
        answer: `You can book instantly online by clicking 'Book Appointment' or messaging us directly on WhatsApp at ${phone}.`,
      },
      {
        question: "What are the clinic consultation hours?",
        answer: `Our clinic is open Mon–Sat from ${doctor.workingHoursStart || "09:00 AM"} to ${doctor.workingHoursEnd || "08:00 PM"}.`,
      },
      {
        question: "Where is the clinic located?",
        answer: `We are located at ${address || "our primary clinical center in " + city}. On-site parking and accessible entrance are available.`,
      },
    ];

    const tagline = `Leading ${specialty} in ${city || "Your Area"} • High Patient Satisfaction`;
    const heroHeading = `Advanced ${specialty} & Dedicated Patient Care`;
    const heroSubheading = `Led by ${doctor.name} at ${clinicName}. Delivering patient-centered clinical excellence, modern treatments, and personalized care in ${city || "Delhi"}.`;

    return {
      subdomain: suggestedSubdomain,
      ...themeConfig,
      siteTitle: clinicName,
      tagline,
      heroHeading,
      heroSubheading,
      heroImage: doctor.image || null,
      heroStyle: "SPLIT_FORM",
      announcementBar: `Now accepting new appointments. Consult ${doctor.name} this week.`,
      ctaButtonText: "Book Appointment",
      ctaButtonAction: "BOOKING_MODAL",
      whatsappNumber: phone,
      contactPhone: phone,
      contactEmail: doctor.email,
      showServices: true,
      showReviews: true,
      showDoctorBio: true,
      showFaq: true,
      showMap: true,
      showStickyBar: true,
      customServices: services,
      customFaqs: faqs,
      customBio: `${doctor.name} is a highly regarded ${specialty} dedicated to providing compassionate, evidence-based healthcare. Practicing at ${clinicName}, ${doctor.name} combines clinical expertise with modern medical standards to ensure optimal patient outcomes.`,
      metaTitle: `${clinicName} | Best ${specialty} in ${city || "India"}`,
      metaDescription: `Book an appointment with ${doctor.name} at ${clinicName}. Top-rated ${specialty} in ${city} offering comprehensive consultations, evidence-based treatments, and patient care.`,
    };
  }
}
