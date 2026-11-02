export type SectionType =
  | "HERO"
  | "STATS_RIBBON"
  | "PACKAGES"
  | "STATS_RIBBON"
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
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  maxWidth?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  imageOpacity?: number; // 10 to 100
  imagePosition?: "center" | "top" | "bottom" | "left" | "right";
  overlayDarkness?: "none" | "subtle" | "medium" | "dark";
  heroHeight?: "compact" | "normal" | "tall" | "fullscreen";
  sliderType?: "fade" | "slide" | "ambient";
  // Exly Layout & Flexbox Accordion
  display?: "flex" | "grid" | "block";
  flexDirection?: "row" | "row-reverse" | "column" | "column-reverse";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  gap?: number;
  flexWrap?: "nowrap" | "wrap";
  // Exly Typography Accordion
  textAlign?: "left" | "center" | "right" | "justify";
  fontSize?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  fontWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  // Exly Borders & Corners Accordion
  borderRadius?: "none" | "md" | "lg" | "xl" | "2xl" | "full";
  borderWidth?: number;
  borderStyle?: "none" | "solid" | "dashed" | "dotted";
  borderColor?: string;
  // Exly Effects & Shadows Accordion
  boxShadow?: "none" | "sm" | "md" | "lg" | "xl" | "glow";
  // Exly Animation Tab
  animationType?: "none" | "fadeIn" | "fadeInUp" | "fadeInDown" | "slideInLeft" | "slideInRight" | "zoomIn" | "bounce" | "pulse";
  animationDelay?: number; // ms
  animationDuration?: number; // ms
  hoverEffect?: "none" | "lift" | "scale" | "glow";
  bioStyle?: "CARD" | "SPLIT_EDITORIAL" | "MINIMAL" | "BENTO";
  servicesStyle?: "GRID_3COL" | "GRID_4COL" | "BENTO" | "SPLIT_LIST" | "MINIMAL_LIST" | "ICON_CARDS";
  columnLayout?: "1col" | "2col_5050" | "2col_2575" | "2col_7525" | "3col" | "3col_hero" | "quote" | "divider";
}

export interface PageSection {
  packages?: Array<{
    name: string;
    tag?: string;
    parameterCount?: string;
    originalPrice?: number;
    price?: number;
    discount?: string;
    fasting?: string;
    reportTime?: string;
    popular?: boolean;
    features?: string[];
  }>;
  stats?: Array<{ value: string; label: string; icon?: string }>;
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  content?: string;
  image?: string | null;
  sliderImages?: string[];
  heroStyle?: "SPLIT" | "FULL_WIDTH" | "BENTO" | "EDITORIAL" | "MINIMAL" | "REVERSED_SPLIT";
  badgeText?: string;
  ctaText?: string;
  ctaAction?: string;
  secondaryCtaText?: string;
  secondaryCtaAction?: string;
  showHeroActions?: boolean;
  showHighlights?: boolean;
  heroHighlights?: HeroHighlightItem[];
  bgColor?: string;
  cardBg?: string;
  bioStyle?: "CARD" | "SPLIT_EDITORIAL" | "MINIMAL" | "BENTO";
  servicesStyle?: "GRID_3COL" | "GRID_4COL" | "BENTO" | "SPLIT_LIST" | "MINIMAL_LIST" | "ICON_CARDS";
  columnLayout?: "1col" | "2col_5050" | "2col_2575" | "2col_7525" | "3col" | "3col_hero" | "quote" | "divider";
  columns?: Array<{
    title?: string;
    subtitle?: string;
    content?: string;
    ctaText?: string;
    ctaUrl?: string;
    badge?: string;
    icon?: string;
  }>;
  quoteAuthor?: string;
  quoteRole?: string;
  isQuote?: boolean;
  hasForm?: boolean;
  formTitle?: string;
  formSubtitle?: string;
  formButtonText?: string;
  showHeroBookingForm?: boolean;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorDegrees?: string;
  doctorDesignation?: string;
  doctorImage?: string;
  showPrices?: boolean;
  isVisible?: boolean;
  design?: SectionDesignConfig;
  data?: any;
  // Exly Component Properties
  videoUrl?: string;
  mapAddress?: string;
  countdownDate?: string;
  customCode?: string;
  typedStrings?: string[];
  columnsCount?: number;
  tableData?: Array<{ cols: string[] }>;
  formFields?: Array<{ name: string; label: string; type: string; required?: boolean }>;
}

export interface HeroHighlightItem {
  icon?: string;
  text: string;
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
  showHeroActions?: boolean;
  showHighlights?: boolean;
  heroHighlights?: HeroHighlightItem[];
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
  customServices?: Array<{ name: string; description: string; duration?: number | string; price?: number; icon?: string; image?: string }>;
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
