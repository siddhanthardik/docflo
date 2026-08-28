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

export interface NavLinkItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface SectionDesignConfig {
  layoutVariant?: string;
  bgType?: "solid" | "gradient" | "dark" | "light" | "cream" | "custom";
  bgColor?: string;
  textColor?: string;
  cardBg?: string;
  cardBorder?: string;
  paddingSize?: "compact" | "normal" | "spacious";
}

export interface PageSection {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  content?: string;
  image?: string | null;
  sliderImages?: string[];
  heroStyle?: "SPLIT" | "FULL_WIDTH" | "BENTO" | "EDITORIAL";
  badgeText?: string;
  ctaText?: string;
  ctaAction?: string;
  secondaryCtaText?: string;
  secondaryCtaAction?: string;
  bgColor?: string;
  showPrices?: boolean;
  isVisible?: boolean;
  design?: SectionDesignConfig;
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
  buttonRadius?: string | null;
  siteTitle: string;
  tagline?: string | null;
  logoUrl?: string | null;
  heroHeading: string;
  heroSubheading?: string | null;
  heroImage?: string | null;
  heroSliderImages?: string[];
  heroStyle?: string;
  showHeroBookingForm?: boolean;
  announcementBar?: string | null;
  showAnnouncementBar?: boolean;
  ctaButtonText: string;
  ctaButtonAction: string;
  primaryCtaLink?: string | null;
  secondaryCtaText?: string | null;
  secondaryCtaAction?: string | null;
  secondaryCtaLink?: string | null;
  whatsappNumber?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  showServices: boolean;
  showReviews: boolean;
  showDoctorBio: boolean;
  showFaq: boolean;
  showMap: boolean;
  showStickyBar: boolean;
  showPrices?: boolean;
  showServiceButtons?: boolean;
  showAppointmentPage?: boolean;
  clinicAddress?: string | null;
  mapEmbedUrl?: string | null;
  navLinks?: NavLinkItem[];
  customServices?: Array<{ name: string; description: string; duration?: number; price?: number; icon?: string; image?: string }>;
  customFaqs?: Array<{ question: string; answer: string }>;
  customBio?: string | null;
  galleryImages?: Array<{ url: string; caption?: string }>;
  sections?: PageSection[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  doctor?: {
    name: string;
    clinicName?: string | null;
    specialty?: string | null;
    degrees?: string | null;
    designation?: string | null;
    experienceYears?: string | null;
    totalPatients?: string | null;
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
