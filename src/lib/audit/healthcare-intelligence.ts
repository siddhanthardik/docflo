import { GoogleGenAI } from "@google/genai";

export interface SpecialityBenchmark {
  speciality: string;
  expectedRating: number;
  expectedReviewCount: number;
  highValueKeywords: string[];
  seasonalOpportunities: string[];
  contentOpportunities: string[];
  isUnknown?: boolean;
}

// ── Helper to format raw Google Places API category slugs ───────────────────
function formatSlugToTitle(slug: string): string {
  if (!slug) return "";
  return slug
    .split("_")
    .map((word) => {
      if (word.toLowerCase() === "and") return "&";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

// ── Helper to generate dynamic keywords from category name ─────────────────
function generateDynamicKeywords(category: string): string[] {
  const cleanCat = category.replace(/clinic|hospital|center|centre/gi, "").trim();
  return [
    `${cleanCat} Near Me`,
    `Best ${cleanCat} in Town`,
    `${cleanCat} Consultation`,
    `${cleanCat} Specialist`,
    `${cleanCat} Treatment`,
  ];
}

// ── Comprehensive Clinical & Surgical Medical Ontology ───────────────────────
// Prioritized by clinical specialty and surgical depth.
export const CLINICAL_MEDICAL_RULES: Array<{
  label: string;
  matchers: string[];
  priorityCheck?: (corpus: string, businessName: string) => boolean;
}> = [
  // 1. Dedicated IVF & Fertility Center (Distinguished from general OB-GYN)
  {
    label: "IVF & Fertility Center",
    matchers: [
      "ivf center",
      "ivf centre",
      "ivf clinic",
      "ivf hospital",
      "fertility center",
      "fertility centre",
      "fertility clinic",
      "fertility hospital",
      "test tube baby",
      "art center",
      "art clinic",
      "embryolog",
    ],
    priorityCheck: (corpus, businessName) => {
      const bLower = businessName.toLowerCase();
      // True IVF centers prominently feature IVF/Fertility in their brand name
      return (
        bLower.includes("ivf") ||
        bLower.includes("fertility") ||
        bLower.includes("test tube baby")
      );
    },
  },

  // 2. Obstetrician & Gynecologist (Includes general maternity, delivery, PCOS, and fertility care)
  {
    label: "Obstetrician & Gynecologist",
    matchers: [
      "gynaecolog",
      "gynecolog",
      "obstetr",
      "gynac",
      "obstetrician",
      "women's health",
      "womens health",
      "pregnancy care",
      "prenatal",
      "maternity",
      "normal delivery",
      "c-section",
      "cesarean",
      "pcos",
      "pcod",
      "infertility",
      "laparoscop",
      "fibroid",
      "hysterectom",
      "follicular",
    ],
  },

  // 3. Orthopedic Surgeon (Surgical & Bone/Joint Care)
  {
    label: "Orthopedic Surgeon",
    matchers: [
      "orthopaed",
      "orthoped",
      "orthopedist",
      "orthopaedist",
      "knee replacement",
      "hip replacement",
      "joint replacement",
      "fracture",
      "bone specialist",
      "bone clinic",
      "spine surgery",
      "spine surgeon",
      "arthroscop",
      "ligament",
      "trauma surgeon",
      "bone and joint",
      "ortho clinic",
      "ortho care",
      "ortho hospital",
    ],
  },

  // 4. Pediatrician (Child & Newborn Healthcare)
  {
    label: "Pediatrician",
    matchers: [
      "paediatr",
      "pediatr",
      "neonatolog",
      "pediatrician",
      "paediatrician",
      "child specialist",
      "children's clinic",
      "childrens clinic",
      "child clinic",
      "vaccination",
      "newborn care",
      "infant care",
    ],
  },

  // 5. Dermatologist & Cosmetologist
  {
    label: "Dermatologist",
    matchers: [
      "dermatolog",
      "dermatologist",
      "tricholog",
      "skin specialist",
      "skin clinic",
      "skin care clinic",
      "acne treatment",
      "hair transplant",
      "cosmetolog",
      "laser skin",
    ],
  },

  // 6. Dental Clinic & Dentist
  {
    label: "Dental Clinic",
    matchers: [
      "dentist",
      "dental",
      "endodont",
      "orthodont",
      "root canal",
      "teeth whitening",
      "dental implant",
      "tooth extraction",
      "braces",
      "dental clinic",
      "smile design",
      "teeth scaling",
    ],
  },

  // 7. Ophthalmologist & Eye Surgeon
  {
    label: "Ophthalmologist",
    matchers: [
      "ophthalmol",
      "eye surgeon",
      "eye specialist",
      "eye clinic",
      "cataract surgery",
      "lasik",
      "glaucoma",
      "retina specialist",
      "vision care",
      "eye hospital",
    ],
  },

  // 8. ENT Specialist (Ear, Nose, Throat)
  {
    label: "ENT Specialist",
    matchers: [
      "otolaryngol",
      "ent specialist",
      "ent doctor",
      "ent clinic",
      "ear nose throat",
      "sinus surgery",
      "tonsil",
      "audiolog",
      "hearing aid",
    ],
  },

  // 9. Cardiologist & Heart Specialist
  {
    label: "Cardiologist",
    matchers: [
      "cardiol",
      "cardiologist",
      "heart specialist",
      "angioplasty",
      "ecg",
      "echo",
      "hypertension",
      "pacemaker",
      "cardiac care",
      "heart clinic",
    ],
  },

  // 10. Gastroenterologist & Liver Specialist
  {
    label: "Gastroenterologist",
    matchers: [
      "gastroenterol",
      "gastroenterologist",
      "endoscopy",
      "colonoscopy",
      "liver specialist",
      "hepatolog",
      "stomach specialist",
      "gastric",
    ],
  },

  // 11. Urologist & Andrologist
  {
    label: "Urologist",
    matchers: [
      "urolog",
      "urologist",
      "kidney stone",
      "prostate",
      "urinary",
      "androlog",
      "lithotripsy",
    ],
  },

  // 12. Nephrologist & Kidney Specialist
  {
    label: "Nephrologist",
    matchers: [
      "nephrol",
      "nephrologist",
      "kidney specialist",
      "dialysis",
      "renal care",
      "kidney failure",
    ],
  },

  // 13. Neurologist & Neurosurgeon
  {
    label: "Neurologist",
    matchers: [
      "neurol",
      "neurologist",
      "neurosurgeon",
      "brain specialist",
      "stroke care",
      "epilepsy",
      "parkinson",
      "spine specialist",
    ],
  },

  // 14. Pulmonologist & Chest Specialist
  {
    label: "Pulmonologist",
    matchers: [
      "pulmonol",
      "pulmonologist",
      "chest specialist",
      "asthma clinic",
      "allergy care",
      "respiratory",
      "bronchoscop",
    ],
  },

  // 15. Endocrinologist & Diabetologist
  {
    label: "Endocrinologist",
    matchers: [
      "endocrinol",
      "endocrinologist",
      "thyroid specialist",
      "diabetes clinic",
      "diabetolog",
      "metabolic",
    ],
  },

  // 16. Oncologist & Cancer Specialist
  {
    label: "Oncologist",
    matchers: [
      "oncolog",
      "oncologist",
      "cancer specialist",
      "chemotherapy",
      "radiation oncology",
      "tumor",
      "cancer care",
    ],
  },

  // 17. Psychiatrist & Mental Health
  {
    label: "Psychiatrist",
    matchers: [
      "psychiatr",
      "psychiatrist",
      "mental health",
      "depression",
      "counseling",
      "anxiety",
      "psycholog",
    ],
  },

  // 18. Physiotherapist (Ancillary / Physical Rehab)
  {
    label: "Physiotherapist",
    matchers: [
      "physiother",
      "physiotherapist",
      "physical therapy",
      "physiotherapy clinic",
      "rehab center",
      "rehabilitation center",
      "chiropract",
    ],
  },

  // 19. General Physician
  {
    label: "General Physician",
    matchers: [
      "general physician",
      "family doctor",
      "general practitioner",
      "internal medicine",
      "fever clinic",
      "consulting physician",
    ],
  },
];

// Generic Google categories that need intelligent medical classification
const GENERIC_GOOGLE_SLUGS = [
  "doctor",
  "medical_clinic",
  "health",
  "point_of_interest",
  "establishment",
  "consultant",
  "service",
];

/**
 * 4-Tier Bulletproof Healthcare Specialty Detection Engine
 */
export function detectSpeciality(
  businessName: string,
  categories: string[] = [],
  address: string = "",
  primaryTypeSlug?: string | null,
  primaryTypeDisplayName?: string | null,
  reviewsText: string[] = []
): SpecialityBenchmark {
  const bName = (businessName || "").trim();
  const fullCorpus = [bName, address, reviewsText.join(" ")].join(" ").toLowerCase();

  // ── Tier 1: Specific Google Places API Category Authority ──────────────────
  if (
    primaryTypeDisplayName &&
    !GENERIC_GOOGLE_SLUGS.includes(primaryTypeDisplayName.toLowerCase().trim())
  ) {
    const categoryLabel = primaryTypeDisplayName.trim();
    console.log(`[Specialty Engine] Tier 1 (Google API Display Name): "${categoryLabel}"`);

    return {
      speciality: categoryLabel,
      expectedRating: 4.5,
      expectedReviewCount: 100,
      highValueKeywords: generateDynamicKeywords(categoryLabel),
      seasonalOpportunities: ["Annual Preventive Health Checkups", "Seasonal Health Awareness"],
      contentOpportunities: [
        `Patient guide to choosing a top ${categoryLabel}`,
        `What to expect during your first consultation`,
      ],
    };
  }

  if (
    primaryTypeSlug &&
    !GENERIC_GOOGLE_SLUGS.includes(primaryTypeSlug.toLowerCase().trim())
  ) {
    const categoryLabel = formatSlugToTitle(primaryTypeSlug);
    console.log(`[Specialty Engine] Tier 1 (Google API Slug): "${primaryTypeSlug}" → "${categoryLabel}"`);

    return {
      speciality: categoryLabel,
      expectedRating: 4.5,
      expectedReviewCount: 100,
      highValueKeywords: generateDynamicKeywords(categoryLabel),
      seasonalOpportunities: ["Annual Preventive Health Checkups"],
      contentOpportunities: [`Patient guide to ${categoryLabel} care`],
    };
  }

  // ── Tier 2: Specific Google Places API Secondary Categories (types[]) ──────
  const specificGoogleCategories = categories.filter(
    (cat) => !GENERIC_GOOGLE_SLUGS.includes(cat.toLowerCase().trim())
  );
  if (specificGoogleCategories.length > 0) {
    const chosenCategory = formatSlugToTitle(specificGoogleCategories[0]);
    console.log(
      `[Specialty Engine] Tier 2 (Google API Secondary): "${specificGoogleCategories[0]}" → "${chosenCategory}"`
    );

    return {
      speciality: chosenCategory,
      expectedRating: 4.5,
      expectedReviewCount: 100,
      highValueKeywords: generateDynamicKeywords(chosenCategory),
      seasonalOpportunities: ["Annual Preventive Health Checkups"],
      contentOpportunities: [`Patient guide to ${chosenCategory} care`],
    };
  }

  // ── Tier 3: Enhanced Clinical & Surgical Medical Ontology ───────────────────
  for (const rule of CLINICAL_MEDICAL_RULES) {
    // If rule has a custom priority check (e.g. IVF vs OB-GYN distinction)
    if (rule.priorityCheck) {
      if (rule.priorityCheck(fullCorpus, bName)) {
        console.log(`[Specialty Engine] Tier 3 (Priority Rule Match): "${rule.label}" for "${bName}"`);
        return {
          speciality: rule.label,
          expectedRating: 4.5,
          expectedReviewCount: 100,
          highValueKeywords: generateDynamicKeywords(rule.label),
          seasonalOpportunities: ["Annual Health Checkups"],
          contentOpportunities: [`Expert guide to ${rule.label} procedures`],
        };
      }
    } else {
      if (rule.matchers.some((matcher) => fullCorpus.includes(matcher))) {
        console.log(`[Specialty Engine] Tier 3 (Clinical Match): "${rule.label}" for "${bName}"`);
        return {
          speciality: rule.label,
          expectedRating: 4.5,
          expectedReviewCount: 100,
          highValueKeywords: generateDynamicKeywords(rule.label),
          seasonalOpportunities: ["Annual Health Checkups"],
          contentOpportunities: [`Patient guide to ${rule.label} care & treatments`],
        };
      }
    }
  }

  // ── Tier 4: Graceful Medical Specialist Fallback ───────────────────────────
  console.log(`[Specialty Engine] Tier 4 (Default Specialist) for "${bName}"`);
  return {
    speciality: "Medical Specialist",
    isUnknown: true,
    expectedRating: 4.5,
    expectedReviewCount: 100,
    highValueKeywords: [
      "Medical Specialist Near Me",
      "Clinic Near Me",
      "Doctor Consultation",
    ],
    seasonalOpportunities: ["Annual Health Checkups"],
    contentOpportunities: ["Importance of regular health checkups"],
  };
}
