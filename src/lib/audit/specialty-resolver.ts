import { 
  detectSpeciality, 
  SpecialityBenchmark,
  CLINICAL_MEDICAL_RULES
} from "@/lib/audit/healthcare-intelligence";
import { sanitizeDoctorBusinessName } from "@/lib/audit/name-sanitizer";

/**
 * Generic Google Places API categories that should NOT short-circuit clinical specialty detection.
 * If Google returns one of these containers, the engine must inspect title keywords and clinical rules.
 */
export const BROAD_CONTAINER_CATEGORIES = new Set([
  "hospital",
  "hospitals",
  "medical_clinic",
  "medical clinic",
  "doctor",
  "doctors",
  "health",
  "health_consultant",
  "consultant",
  "point_of_interest",
  "establishment",
  "general_hospital",
]);

/**
 * True institutional hospital keywords that confirm a facility is genuinely a large tertiary hospital
 * rather than a single doctor / OPD clinic listing.
 */
const INSTITUTIONAL_HOSPITAL_PATTERNS = [
  /\bsuper\s+speciality\s+hospital\b/i,
  /\bmultispeciality\s+hospital\b/i,
  /\bmulti-speciality\s+hospital\b/i,
  /\bmemorial\s+hospital\b/i,
  /\bgeneral\s+hospital\b/i,
  /\bdistrict\s+hospital\b/i,
  /\bcivil\s+hospital\b/i,
  /\bmedical\s+college\b/i,
  /\binstitute\s+of\s+medical\s+sciences\b/i,
  /\bresearch\s+institute\b/i,
];

export interface ResolvedSpecialtyResult {
  benchmark: SpecialityBenchmark;
  speciality: string;
  primaryCategory: string;
  isBroadContainerOverridden: boolean;
  overriddenFromCategory?: string;
}

/**
 * Bulletproof Specialty Resolver:
 * Wraps detectSpeciality without mutating healthcare-intelligence.ts.
 * Prioritizes clinical specialties from title, handles Google Places API container quirks,
 * and guarantees doctors aren't evaluated against tertiary hospitals.
 */
export function resolveBulletproofSpecialty(
  businessName: string,
  categories: string[] = [],
  address: string = "",
  primaryTypeSlug?: string | null,
  primaryTypeDisplayName?: string | null,
  reviewsText: string[] = []
): ResolvedSpecialtyResult {
  const sanitized = sanitizeDoctorBusinessName(businessName);
  const rawTitle = businessName || "";
  const cleanName = sanitized.cleanDisplayName;
  
  // Combine all keywords from raw title, clean name, and secondary segments
  const corpus = [
    rawTitle,
    cleanName,
    sanitized.stuffedKeywords.join(" "),
    address,
    reviewsText.slice(0, 5).join(" "),
  ].join(" ").toLowerCase();

  const rawGoogleCategory = (primaryTypeDisplayName || primaryTypeSlug || "").toLowerCase().trim();
  const isBroadContainer = BROAD_CONTAINER_CATEGORIES.has(rawGoogleCategory);

  // Check if facility is genuinely a large institutional hospital (e.g. Max Hospital, Apollo Hospital)
  const isGenuineInstitutionalHospital = INSTITUTIONAL_HOSPITAL_PATTERNS.some(pat => pat.test(rawTitle));

  // ── STEP 1: Title-First Clinical Rule Check ──────────────────────────────
  // If the listing is not an institutional hospital, check if any clinical rule matches the title/corpus
  if (!isGenuineInstitutionalHospital) {
    // Check specific clinical rules
    for (const rule of CLINICAL_MEDICAL_RULES) {
      const hasMatcher = rule.matchers.some(m => corpus.includes(m.toLowerCase()));
      const passesPriority = rule.priorityCheck ? rule.priorityCheck(corpus, rawTitle) : true;

      if (hasMatcher && passesPriority) {
        const benchmark: SpecialityBenchmark = {
          speciality: rule.label,
          expectedRating: 4.5,
          expectedReviewCount: 100,
          highValueKeywords: [
            `${rule.label} Near Me`,
            `Best ${rule.label}`,
            `${rule.label} Consultation`,
            `${rule.label} Clinic`,
          ],
          seasonalOpportunities: ["Annual Preventive Health Checkups", "Seasonal Health Consultation"],
          contentOpportunities: [
            `Patient guide to consulting a top ${rule.label}`,
            `Understanding common conditions treated by a ${rule.label}`,
          ],
        };

        return {
          benchmark,
          speciality: rule.label,
          primaryCategory: rule.label,
          isBroadContainerOverridden: isBroadContainer,
          overriddenFromCategory: isBroadContainer ? (primaryTypeDisplayName || primaryTypeSlug || "Hospital") : undefined,
        };
      }
    }
  }

  // ── STEP 2: General Family Physician / Doctor Title Inference ───────────
  // If the doctor has "Dr." or "Physician" or "Doctor" in name and Google assigned "Hospital"
  if (isBroadContainer && !isGenuineInstitutionalHospital) {
    if (sanitized.doctorHonorific || /\b(dr\.|doctor|physician|clinic|consultant)\b/i.test(rawTitle)) {
      const benchmark: SpecialityBenchmark = {
        speciality: "General Physician",
        expectedRating: 4.5,
        expectedReviewCount: 100,
        highValueKeywords: [
          "General Physician Near Me",
          "Family Doctor Near Me",
          "Doctor Consultation Near Me",
          "Best General Practitioner",
        ],
        seasonalOpportunities: ["Seasonal Fever & Infection Care", "Annual Health Checkup"],
        contentOpportunities: [
          "When to visit a General Physician vs Emergency Room",
          "Comprehensive Preventive Health Checklist for Families",
        ],
      };

      return {
        benchmark,
        speciality: "General Physician",
        primaryCategory: "General Physician",
        isBroadContainerOverridden: true,
        overriddenFromCategory: primaryTypeDisplayName || primaryTypeSlug || "Hospital",
      };
    }
  }

  // ── STEP 3: Fallback to existing detectSpeciality engine ─────────────────
  const baseBenchmark = detectSpeciality(
    businessName,
    categories,
    address,
    primaryTypeSlug,
    primaryTypeDisplayName,
    reviewsText
  );

  return {
    benchmark: baseBenchmark,
    speciality: baseBenchmark.speciality,
    primaryCategory: baseBenchmark.speciality,
    isBroadContainerOverridden: false,
  };
}
