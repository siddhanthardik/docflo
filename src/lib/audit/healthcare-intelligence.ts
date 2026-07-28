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
    .map(word => {
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

// ── Strict Clinical Medical Root Matchers ONLY ────────────────────────────────
// Casual conversational words (like "baby", "skin", "knee", "tooth", "cough") are 100% BANNED.
// We match ONLY explicit medical roots.
const CLINICAL_MEDICAL_RULES: Array<{ label: string; matchers: string[] }> = [
  { label: "Obstetrician & Gynecologist", matchers: ["gynaecolog", "gynecolog", "obstetr", "gynac", "obstetrician", "women's health"] },
  { label: "Pediatrician", matchers: ["paediatr", "pediatr", "neonatolog", "pediatrician", "paediatrician"] },
  { label: "Dermatologist", matchers: ["dermatolog", "dermatologist", "tricholog"] },
  { label: "Orthopedic Surgeon", matchers: ["orthopaed", "orthoped", "orthopedist", "orthopaedist"] },
  { label: "Cardiologist", matchers: ["cardiol", "cardiologist"] },
  { label: "Dental Clinic", matchers: ["dentist", "dental", "endodont", "orthodont"] },
  { label: "ENT Specialist", matchers: ["otolaryngol", "ent specialist", "ent doctor", "ent clinic"] },
  { label: "Ophthalmologist", matchers: ["ophthalmol", "eye surgeon", "eye specialist"] },
  { label: "Urologist", matchers: ["urolog", "urologist"] },
  { label: "Nephrologist", matchers: ["nephrol", "nephrologist"] },
  { label: "Neurologist", matchers: ["neurol", "neurologist"] },
  { label: "Gastroenterologist", matchers: ["gastroenterol", "gastroenterologist"] },
  { label: "Pulmonologist", matchers: ["pulmonol", "pulmonologist"] },
  { label: "Endocrinologist", matchers: ["endocrinol", "endocrinologist"] },
  { label: "Physiotherapist", matchers: ["physiother", "physiotherapist"] },
  { label: "Psychiatrist", matchers: ["psychiatr", "psychiatrist"] },
  { label: "Oncologist", matchers: ["oncolog", "oncologist"] },
];

// ── Main export: 100% Dynamic Bulletproof Specialty Detection Engine ──────
export function detectSpeciality(
  businessName: string,
  categories: string[] = [],
  address: string = "",
  primaryTypeSlug?: string | null,           // e.g. "obstetrician_gynecologist", "pediatrician"
  primaryTypeDisplayName?: string | null,    // e.g. "Obstetrician-gynecologist", "Pediatrician"
  reviewsText: string[] = []                 // Patient review text snippets
): SpecialityBenchmark {

  const genericSlugs = ["doctor", "medical_clinic", "health", "point_of_interest", "establishment", "consultant", "service"];

  // ── 1. Google Places API Primary Category Display Name Authority ─────────
  if (primaryTypeDisplayName && !genericSlugs.includes(primaryTypeDisplayName.toLowerCase().trim())) {
    const categoryLabel = primaryTypeDisplayName.trim();
    console.log(`[Bulletproof Specialty Engine] Priority 1 (Google API Primary Category): "${categoryLabel}"`);

    return {
      speciality: categoryLabel,
      expectedRating: 4.5,
      expectedReviewCount: 100,
      highValueKeywords: generateDynamicKeywords(categoryLabel),
      seasonalOpportunities: ["Annual Preventive Health Checkups", "Seasonal Health Awareness"],
      contentOpportunities: [`Patient guide to choosing a top ${categoryLabel}`, `What to expect during your first consultation`],
    };
  }

  // ── 2. Google Places API Primary Category Slug Conversion ────────────────
  if (primaryTypeSlug && !genericSlugs.includes(primaryTypeSlug.toLowerCase().trim())) {
    const categoryLabel = formatSlugToTitle(primaryTypeSlug);
    console.log(`[Bulletproof Specialty Engine] Priority 2 (Google API Primary Slug): "${primaryTypeSlug}" → "${categoryLabel}"`);

    return {
      speciality: categoryLabel,
      expectedRating: 4.5,
      expectedReviewCount: 100,
      highValueKeywords: generateDynamicKeywords(categoryLabel),
      seasonalOpportunities: ["Annual Preventive Health Checkups"],
      contentOpportunities: [`Patient guide to ${categoryLabel} care`],
    };
  }

  // ── 3. Google Places API Secondary Categories (types[]) ──────────────────
  const specificGoogleCategories = categories.filter(cat => !genericSlugs.includes(cat.toLowerCase().trim()));
  if (specificGoogleCategories.length > 0) {
    const chosenCategory = formatSlugToTitle(specificGoogleCategories[0]);
    console.log(`[Bulletproof Specialty Engine] Priority 3 (Google API Secondary Category): "${specificGoogleCategories[0]}" → "${chosenCategory}"`);

    return {
      speciality: chosenCategory,
      expectedRating: 4.5,
      expectedReviewCount: 100,
      highValueKeywords: generateDynamicKeywords(chosenCategory),
      seasonalOpportunities: ["Annual Preventive Health Checkups"],
      contentOpportunities: [`Patient guide to ${chosenCategory} care`],
    };
  }

  // ── 4. Strict Clinical Medical Root Term Match (Name & Reviews ONLY) ──────
  // ZERO casual word matching. Only strict medical terms (e.g. "gynaecolog", "obstetr", "pediatr").
  const fullCorpus = [businessName, reviewsText.join(" ")].join(" ").toLowerCase();

  for (const rule of CLINICAL_MEDICAL_RULES) {
    if (rule.matchers.some(matcher => fullCorpus.includes(matcher))) {
      console.log(`[Bulletproof Specialty Engine] Priority 4 (Strict Clinical Term Match): "${rule.label}"`);
      return {
        speciality: rule.label,
        expectedRating: 4.5,
        expectedReviewCount: 100,
        highValueKeywords: generateDynamicKeywords(rule.label),
        seasonalOpportunities: ["Annual Preventive Health Checkups"],
        contentOpportunities: [`Patient guide to ${rule.label} care`],
      };
    }
  }

  // ── 5. Clean Medical Specialist Fallback ──────────────────────────────────
  console.log(`[Bulletproof Specialty Engine] Priority 5 (Default Medical Practice) for "${businessName}"`);
  return {
    speciality: "Medical Specialist",
    isUnknown: true,
    expectedRating: 4.5,
    expectedReviewCount: 100,
    highValueKeywords: ["Medical Specialist Near Me", "Clinic Near Me", "Specialist Consultation"],
    seasonalOpportunities: ["Annual Health Checkups"],
    contentOpportunities: ["Importance of regular health checkups"]
  };
}
