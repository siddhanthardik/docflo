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

// ── Comprehensive 31-Specialty Clinical & Surgical Medical Ontology ─────────
// Prioritized by clinical depth, surgical specialty, and patient intent.
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
      return (
        bLower.includes("ivf") ||
        bLower.includes("fertility") ||
        bLower.includes("test tube baby")
      );
    },
  },

  // 2. Obstetrician & Gynecologist (Maternity, deliveries, PCOS, and general fertility)
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

  // 3. Hair Transplant & Restoration Specialist (Dedicated hair clinic)
  {
    label: "Hair Transplant Clinic",
    matchers: [
      "hair transplant",
      "hair restoration",
      "fue hair",
      "fut hair",
      "prp hair",
      "baldness treatment",
      "hair loss clinic",
      "hair graft",
    ],
    priorityCheck: (corpus, businessName) => {
      const bLower = businessName.toLowerCase();
      return (
        bLower.includes("hair transplant") ||
        bLower.includes("hair restoration") ||
        bLower.includes("hair clinic") ||
        corpus.includes("hair transplant")
      );
    },
  },

  // 4. Plastic & Cosmetic Surgeon (Aesthetics, reconstructive, body contouring)
  {
    label: "Plastic & Cosmetic Surgeon",
    matchers: [
      "plastic surgeon",
      "plastic surgery",
      "cosmetic surgeon",
      "cosmetic surgery",
      "aesthetic surgeon",
      "rhinoplasty",
      "liposuction",
      "gynecomastia",
      "breast augmentation",
      "breast reduction",
      "tummy tuck",
      "abdominoplasty",
      "botox and fillers",
      "facelift",
    ],
  },

  // 5. Orthopedic Surgeon (Surgical bone, joint, and spine care)
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

  // 6. Rheumatologist (Arthritis & Autoimmune Joint Disease)
  {
    label: "Rheumatologist",
    matchers: [
      "rheumatol",
      "rheumatologist",
      "rheumatoid arthritis",
      "lupus",
      "ankylosing spondylitis",
      "gout specialist",
      "autoimmune arthritis",
      "myositis",
      "scleroderma",
    ],
  },

  // 7. Interventional Pain Management Specialist
  {
    label: "Pain Management Specialist",
    matchers: [
      "pain management",
      "pain clinic",
      "pain specialist",
      "interventional pain",
      "nerve block",
      "epidural injection",
      "slip disc pain",
      "sciatica specialist",
      "chronic back pain clinic",
    ],
  },

  // 8. Vascular Surgeon (Varicose Veins & Peripheral Vascular)
  {
    label: "Vascular Surgeon",
    matchers: [
      "vascular surgeon",
      "vascular surgery",
      "varicose veins clinic",
      "laser varicose",
      "evlt",
      "dvt clinic",
      "spider veins",
      "endovascular",
      "arterial disease",
    ],
  },

  // 9. Bariatric & Metabolic Weight Loss Surgeon
  {
    label: "Bariatric Surgeon",
    matchers: [
      "bariatric surgeon",
      "bariatric surgery",
      "weight loss surgery",
      "gastric bypass",
      "sleeve gastrectomy",
      "metabolic surgery",
      "obesity surgeon",
    ],
  },

  // 10. Pediatrician (Child & Newborn Healthcare)
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

  // 11. Child Development & Autism Therapy Centre
  {
    label: "Child Development & Autism Centre",
    matchers: [
      "child development centre",
      "child development center",
      "autism centre",
      "autism clinic",
      "speech therapy clinic",
      "occupational therapy clinic",
      "sensory integration",
      "adhd clinic",
      "pediatric therapy",
      "special educator",
    ],
  },

  // 12. Dermatologist & Cosmetologist
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
      "cosmetolog",
      "laser skin",
      "chemical peel",
      "pigmentation",
    ],
  },

  // 13. Dental Clinic & Dentist
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
      "clear aligners",
    ],
  },

  // 14. Ophthalmologist & Eye Surgeon
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
      "squint surgery",
      "cornea",
    ],
  },

  // 15. ENT Specialist (Ear, Nose, Throat)
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
      "vertigo clinic",
      "tympanoplasty",
    ],
  },

  // 16. Cardiologist & Heart Specialist
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
      "cardiac surgeon",
    ],
  },

  // 17. Gastroenterologist & Liver Specialist
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
      "fatty liver",
      "acidity clinic",
    ],
  },

  // 18. Urologist & Andrologist
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
      "urinary tract",
      "turp",
    ],
  },

  // 19. Sexologist & Men's Health Specialist
  {
    label: "Sexologist & Men's Health",
    matchers: [
      "sexolog",
      "sexologist",
      "erectile dysfunction",
      "premature ejaculation",
      "male sexual health",
      "gupt rog",
      "men's wellness clinic",
    ],
  },

  // 20. Nephrologist & Kidney Specialist
  {
    label: "Nephrologist",
    matchers: [
      "nephrol",
      "nephrologist",
      "kidney specialist",
      "dialysis",
      "renal care",
      "kidney failure",
      "hemodialysis",
    ],
  },

  // 21. Neurologist & Neurosurgeon
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
      "migraine clinic",
      "paralysis",
    ],
  },

  // 22. Pulmonologist & Chest Specialist
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
      "sleep apnea",
      "tb clinic",
    ],
  },

  // 23. Endocrinologist & Diabetologist (Hormone, Thyroid, and Diabetes Care)
  {
    label: "Endocrinologist",
    matchers: [
      "endocrinol",
      "endocrinologist",
      "diabetolog",
      "diabetologist",
      "diabetes doctor",
      "diabetes specialist",
      "diabetes clinic",
      "diabetes center",
      "diabetes centre",
      "thyroid specialist",
      "thyroid doctor",
      "thyroid clinic",
      "hormone specialist",
      "hormone doctor",
      "metabolic clinic",
      "metabolic disorder",
      "insulin therapy",
      "glycemic control",
      "pituitary",
      "adrenal",
      "growth hormone",
      "gestational diabetes",
      "osteoporosis clinic",
      "hba1c",
    ],
  },

  // 24. Oncologist & Cancer Specialist
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
      "surgical oncologist",
      "immunotherapy",
    ],
  },

  // 25. Psychiatrist & Mental Health Clinic
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
      "de-addiction",
      "behavioral health",
    ],
  },

  // 26. Physiotherapist & Physical Rehab Centre
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
      "manual therapy",
    ],
  },

  // 27. Diagnostic Lab & Pathology Centre
  {
    label: "Diagnostic Lab & Pathology",
    matchers: [
      "pathology lab",
      "diagnostic lab",
      "path lab",
      "blood test centre",
      "blood test center",
      "diagnostic center",
      "diagnostic centre",
      "clinical laboratory",
      "full body checkup",
    ],
    priorityCheck: (corpus, businessName) => {
      const bLower = businessName.toLowerCase();
      return (
        bLower.includes("pathology") ||
        bLower.includes("path lab") ||
        bLower.includes("diagnostic lab") ||
        bLower.includes("pathlabs")
      );
    },
  },

  // 28. Radiology & Imaging Centre
  {
    label: "Radiology & Imaging Centre",
    matchers: [
      "mri scan",
      "ct scan",
      "ultrasound clinic",
      "sonography",
      "radiology centre",
      "radiology center",
      "digital x-ray",
      "mammography",
      "color doppler",
      "imaging center",
      "imaging centre",
    ],
  },

  // 29. Ayurvedic Clinic & Panchakarma Centre
  {
    label: "Ayurvedic Clinic",
    matchers: [
      "ayurved",
      "panchakarma",
      "vaidya",
      "nadi pariksha",
      "ayush clinic",
      "ayurvedic doctor",
      "herbal treatment",
      "shirodhara",
    ],
  },

  // 30. Homeopathic Clinic & Doctor
  {
    label: "Homeopathic Clinic",
    matchers: [
      "homeopath",
      "homoeopath",
      "homeopathy clinic",
      "homeopathic doctor",
      "classical homeopathy",
    ],
  },

  // 31. General Physician & Family Doctor
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

  // ── Tier 3: Enhanced 31-Specialty Clinical & Surgical Medical Ontology ─────
  for (const rule of CLINICAL_MEDICAL_RULES) {
    // If rule has a custom priority check
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
