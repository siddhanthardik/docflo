export type SectionType =
  | "HERO"
  | "SERVICES"
  | "DOCTOR_BIO"
  | "REVIEWS"
  | "GALLERY"
  | "CTA_BANNER"
  | "FAQ"
  | "MAP_HOURS"
  | "CUSTOM_TEXT";

export interface PageSection {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  content?: string;
  image?: string | null;
  ctaText?: string;
  ctaAction?: string;
  bgColor?: string;
  isVisible?: boolean;
  data?: any;
}

export interface ClinicWebsiteData {
  id?: string;
  subdomain: string;
  customDomain?: string | null;
  themeId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  siteTitle: string;
  tagline?: string | null;
  heroHeading: string;
  heroSubheading?: string | null;
  heroImage?: string | null;
  heroStyle?: string;
  showHeroBookingForm?: boolean;
  announcementBar?: string | null;
  ctaButtonText: string;
  ctaButtonAction: string;
  whatsappNumber?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  showServices: boolean;
  showReviews: boolean;
  showDoctorBio: boolean;
  showFaq: boolean;
  showMap: boolean;
  showStickyBar: boolean;
  customServices?: Array<{ name: string; description: string; duration?: number; price?: number; icon?: string }>;
  customFaqs?: Array<{ question: string; answer: string }>;
  customBio?: string | null;
  sections?: PageSection[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  doctor?: {
    name: string;
    clinicName?: string | null;
    specialty?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    image?: string | null;
    workingHoursStart?: string | null;
    workingHoursEnd?: string | null;
    daysOff?: string[];
  };
  reviews?: Array<{ reviewerName: string; rating: number; comment?: string | null; reviewDate: string | Date }>;
}
