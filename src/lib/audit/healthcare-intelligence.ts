export interface SpecialityBenchmark {
  speciality: string;
  expectedRating: number;
  expectedReviewCount: number;
  highValueKeywords: string[];
  seasonalOpportunities: string[];
  contentOpportunities: string[];
  isUnknown?: boolean;
}

const SPECIALITY_DATABASE: Record<string, SpecialityBenchmark> = {
  "urology": {
    speciality: "Urology Clinic",
    expectedRating: 4.5,
    expectedReviewCount: 150,
    highValueKeywords: ["Kidney Stone Treatment", "Laser Stone Surgery", "Prostate Treatment", "Male Infertility", "UTI Treatment"],
    seasonalOpportunities: ["Summer Hydration & Kidney Stones Awareness (June-August)"],
    contentOpportunities: ["Patient education on Laser Stone Surgery vs Traditional", "Prostate cancer screening guidelines"]
  },
  "ivf": {
    speciality: "Fertility Clinic",
    expectedRating: 4.8,
    expectedReviewCount: 200,
    highValueKeywords: ["IVF Clinic Near Me", "ICSI Treatment", "Egg Freezing", "Fertility Specialist", "Donor Program"],
    seasonalOpportunities: ["New Year, New Beginnings (January)", "National Infertility Awareness Week (April)"],
    contentOpportunities: ["Success rates and what they mean", "What to expect during your first IVF cycle"]
  },
  "orthopedic": {
    speciality: "Orthopedic Clinic",
    expectedRating: 4.4,
    expectedReviewCount: 120,
    highValueKeywords: ["Knee Replacement", "Hip Replacement", "Sports Injury Clinic", "Arthritis Treatment", "Orthopedic Surgeon"],
    seasonalOpportunities: ["Winter Sports Injuries (Dec-Feb)", "Summer Active Injuries (Jun-Aug)"],
    contentOpportunities: ["When to consider a knee replacement", "Recovery timelines for sports injuries"]
  },
  "dentist": {
    speciality: "Dental Clinic",
    expectedRating: 4.9,
    expectedReviewCount: 300,
    highValueKeywords: ["Teeth Whitening", "Dental Implants", "Invisalign", "Emergency Dentist", "Root Canal"],
    seasonalOpportunities: ["Back to School Checkups (August)", "Use Your Benefits Before Year-End (Nov-Dec)"],
    contentOpportunities: ["Before & After Invisalign", "Why Dental Implants are better than Dentures"]
  },
  "cardiologist": {
    speciality: "Cardiology Clinic",
    expectedRating: 4.6,
    expectedReviewCount: 100,
    highValueKeywords: ["Heart Specialist", "ECG Near Me", "Chest Pain Clinic", "Arrhythmia Treatment", "Cardiac Checkup"],
    seasonalOpportunities: ["Heart Month (February)"],
    contentOpportunities: ["Preventative heart screening packages", "Understanding your cholesterol levels"]
  },
  "diagnostic": {
    speciality: "Diagnostic Lab",
    expectedRating: 4.7,
    expectedReviewCount: 250,
    highValueKeywords: ["Blood Test Near Me", "Full Body Checkup", "MRI Scan", "Ultrasound Center", "Pathology Lab"],
    seasonalOpportunities: ["Annual Preventive Health Checkups (Jan)"],
    contentOpportunities: ["Why regular blood tests are important", "Preparing for your MRI scan"]
  },
  "hospital": {
    speciality: "Hospital",
    expectedRating: 4.2,
    expectedReviewCount: 500,
    highValueKeywords: ["Hospital Near Me", "Emergency Room", "24/7 Hospital", "Multispecialty Hospital"],
    seasonalOpportunities: ["Flu Season Readiness (Oct-Dec)"],
    contentOpportunities: ["Emergency care wait times", "Our multispecialty approach"]
  },
  "diabetes": {
    speciality: "Diabetes Clinic",
    expectedRating: 4.5,
    expectedReviewCount: 120,
    highValueKeywords: ["Diabetologist near me", "HbA1c Test", "Diabetes Management", "CGMS Sensor", "Insulin Therapy", "Foot Care Clinic"],
    seasonalOpportunities: ["World Diabetes Day (Nov 14)", "Monsoon Foot Care Awareness"],
    contentOpportunities: ["Managing diabetes in Indian diet", "When to start insulin therapy"]
  },
  "dermatology": {
    speciality: "Dermatologist",
    expectedRating: 4.6,
    expectedReviewCount: 180,
    highValueKeywords: ["Dermatologist", "Skin Specialist near me", "Acne Treatment", "Laser Hair Removal", "Botox Clinic", "Psoriasis Treatment", "Chemical Peel"],
    seasonalOpportunities: ["Summer Skin Damage (Apr–Jun)", "Pre-Wedding Skin Packages (Oct–Feb)"],
    contentOpportunities: ["Before & After Laser Skin", "Why over-the-counter creams don't work"]
  },
  "gynaecology": {
    speciality: "Gynaecology Clinic",
    expectedRating: 4.7,
    expectedReviewCount: 150,
    highValueKeywords: ["Gynaecologist near me", "PCOS Treatment", "Laparoscopic Surgery", "Pregnancy Care", "High-Risk Pregnancy", "Menopause Clinic"],
    seasonalOpportunities: ["Women's Health Month (Oct)", "Cervical Cancer Awareness (Jan)"],
    contentOpportunities: ["When to see a gynaecologist", "PCOS diet and lifestyle changes"]
  },
  "ent": {
    speciality: "ENT Clinic",
    expectedRating: 4.4,
    expectedReviewCount: 100,
    highValueKeywords: ["ENT Doctor near me", "Tonsil Surgery", "Hearing Aid Clinic", "Sinusitis Treatment", "Vertigo Treatment", "Cochlear Implant"],
    seasonalOpportunities: ["Winter Sinus Season (Nov–Feb)", "World Hearing Day (Mar)"],
    contentOpportunities: ["Sinusitis vs common cold", "When to consider tonsil removal"]
  },
  "ophthalmology": {
    speciality: "Eye Clinic",
    expectedRating: 4.6,
    expectedReviewCount: 130,
    highValueKeywords: ["Eye Specialist near me", "LASIK Surgery", "Cataract Surgery", "Retina Specialist", "Glaucoma Treatment", "Dry Eye Clinic"],
    seasonalOpportunities: ["World Sight Day (Oct)", "Glaucoma Awareness Week (Mar)"],
    contentOpportunities: ["Am I a candidate for LASIK?", "Cataract surgery recovery guide"]
  },
  "physiotherapy": {
    speciality: "Physiotherapy Clinic",
    expectedRating: 4.5,
    expectedReviewCount: 90,
    highValueKeywords: ["Physiotherapist near me", "Sports Injury Rehab", "Back Pain Physiotherapy", "Post-Surgery Rehab", "Cervical Pain Treatment", "Sciatica Treatment"],
    seasonalOpportunities: ["Sports Season (Jun–Aug)", "Winter Joint Pain (Nov–Jan)"],
    contentOpportunities: ["Exercises for lower back pain", "How many physiotherapy sessions do I need?"]
  },
  "pediatrics": {
    speciality: "Pediatrician",
    expectedRating: 4.8,
    expectedReviewCount: 150,
    highValueKeywords: ["Pediatrician Near Me", "Child Specialist", "Pediatric Clinic", "Baby Doctor", "Vaccination Center", "Children's Clinic"],
    seasonalOpportunities: ["Monsoon Flu & Fever Season (July-September)", "School Immunization Drive (March-April)"],
    contentOpportunities: ["Childhood vaccination schedule guide", "Monsoon fever care for kids"]
  },
  "psychiatry": {
    speciality: "Mental Health Clinic",
    expectedRating: 4.7,
    expectedReviewCount: 80,
    highValueKeywords: ["Psychiatrist near me", "Depression Treatment", "Anxiety Specialist", "OCD Therapy", "Addiction Treatment", "Online Therapy"],
    seasonalOpportunities: ["World Mental Health Day (Oct 10)", "New Year Wellness (Jan)"],
    contentOpportunities: ["When to see a psychiatrist vs psychologist", "Breaking the stigma around mental health"]
  },
  "neurology": {
    speciality: "Neurology Clinic",
    expectedRating: 4.5,
    expectedReviewCount: 90,
    highValueKeywords: ["Neurologist near me", "Migraine Treatment", "Epilepsy Specialist", "Stroke Clinic", "Memory Clinic", "Parkinson's Treatment"],
    seasonalOpportunities: ["Brain Tumour Awareness Month (May)", "World Stroke Day (Oct 29)"],
    contentOpportunities: ["Warning signs of a stroke", "Migraine triggers and management"]
  },
  "pulmonology": {
    speciality: "Pulmonology Clinic",
    expectedRating: 4.5,
    expectedReviewCount: 80,
    highValueKeywords: ["Pulmonologist near me", "Asthma Specialist", "COPD Treatment", "Sleep Apnea Clinic", "Allergy Testing", "Chest Specialist"],
    seasonalOpportunities: ["World Asthma Day (May)", "Air Pollution Season (Oct–Jan)"],
    contentOpportunities: ["Managing asthma in winter", "Is your child's cough asthma?"]
  },
  "gastroenterology": {
    speciality: "Gastroenterology Clinic",
    expectedRating: 4.5,
    expectedReviewCount: 100,
    highValueKeywords: ["Gastroenterologist near me", "Endoscopy Center", "IBS Treatment", "Colonoscopy", "Liver Specialist", "Acidity Treatment"],
    seasonalOpportunities: ["World Digestive Health Day (May 29)", "Colorectal Cancer Awareness Month (Mar)"],
    contentOpportunities: ["When to get a colonoscopy", "Foods to avoid with IBS"]
  },
  "nephrology": {
    speciality: "Nephrology Clinic",
    expectedRating: 4.5,
    expectedReviewCount: 70,
    highValueKeywords: ["Nephrologist near me", "Kidney Disease Specialist", "Dialysis Center", "CKD Treatment", "Renal Failure Clinic"],
    seasonalOpportunities: ["World Kidney Day (Mar)"],
    contentOpportunities: ["Early signs of kidney disease", "How to protect kidney health"]
  },
  "general": {
    speciality: "Medical Clinic",
    expectedRating: 4.5,
    expectedReviewCount: 150,
    highValueKeywords: ["General Physician Near Me", "Doctor Near Me", "Primary Care Clinic", "Walk-in Clinic"],
    seasonalOpportunities: ["Back to School Physicals (Aug)"],
    contentOpportunities: ["Importance of annual checkups", "When to visit urgent care vs primary care"]
  }
};

// ── GBP Category Slug → Specialty Key ────────────────────────────────────────
// Maps the exact `primaryType` values returned by Places API (New) v1
// to our internal specialty keys. This is the PRIMARY detection path.
// Source: https://developers.google.com/maps/documentation/places/web-service/place-types
const GBP_TYPE_TO_SPECIALTY: Record<string, string> = {
  // Pediatrics
  "pediatrician": "pediatrics",
  "pediatric_clinic": "pediatrics",
  "child_care_agency": "pediatrics",

  // Dentistry
  "dentist": "dentist",
  "dental_clinic": "dentist",
  "orthodontist": "dentist",
  "oral_surgeon": "dentist",
  "periodontist": "dentist",
  "endodontist": "dentist",
  "cosmetic_dentist": "dentist",

  // Dermatology
  "dermatologist": "dermatology",
  "skin_care_clinic": "dermatology",
  "medical_spa": "dermatology",

  // Cardiology
  "cardiologist": "cardiologist",
  "cardiovascular_health_clinic": "cardiologist",

  // Orthopedics
  "orthopedic_surgeon": "orthopedic",
  "sports_complex": "orthopedic",

  // Gynaecology / Obstetrics
  "gynecologist": "gynaecology",
  "obstetrician_gynecologist": "gynaecology",
  "pregnancy_care_center": "gynaecology",

  // Urology
  "urologist": "urology",

  // ENT
  "otolaryngologist": "ent",
  "audiologist": "ent",
  "hearing_aid_store": "ent",

  // Ophthalmology
  "ophthalmologist": "ophthalmology",
  "optometrist": "ophthalmology",
  "lasik_eye_surgery_clinic": "ophthalmology",

  // Physiotherapy
  "physiotherapist": "physiotherapy",
  "physical_therapy_clinic": "physiotherapy",
  "sports_medicine_clinic": "physiotherapy",

  // Psychiatry / Mental Health
  "psychiatrist": "psychiatry",
  "psychologist": "psychiatry",
  "mental_health_clinic": "psychiatry",
  "counselor": "psychiatry",

  // Neurology
  "neurologist": "neurology",
  "neurosurgeon": "neurology",

  // Pulmonology
  "pulmonologist": "pulmonology",

  // Gastroenterology
  "gastroenterologist": "gastroenterology",
  "colonoscopy_clinic": "gastroenterology",

  // Nephrology
  "nephrologist": "nephrology",
  "dialysis_center": "nephrology",

  // Diagnostics / Labs
  "medical_laboratory": "diagnostic",
  "blood_testing_service": "diagnostic",
  "diagnostic_center": "diagnostic",
  "pathologist": "diagnostic",
  "x_ray_lab": "diagnostic",
  "radiologist": "diagnostic",
  "medical_imaging_center": "diagnostic",

  // IVF / Fertility
  "fertility_clinic": "ivf",
  "reproductive_health_clinic": "ivf",

  // Diabetes / Endocrinology
  "diabetologist": "diabetes",
  "endocrinologist": "diabetes",

  // Hospital
  "hospital": "hospital",
  "general_hospital": "hospital",
  "private_hospital": "hospital",

  // Pharmacy (falls through to general)
  "pharmacy": "general",
};

// ── Display Name keyword → Specialty Key ─────────────────────────────────────
// Secondary path: used when primaryTypeDisplayName is available from Places API v1
// but doesn't exactly match a GBP_TYPE_TO_SPECIALTY slug.
// Also handles Hindi/regional terms common in Indian GBP profiles.
function detectByDisplayName(displayName: string): string | null {
  const t = displayName.toLowerCase();
  if (t.includes("pediatr") || t.includes("child specialist") || t.includes("baby doctor") || t.includes("bal rog") || t.includes("shishu")) return "pediatrics";
  if (t.includes("derma") || t.includes("skin") || t.includes("cosmet") || t.includes("aesthetic")) return "dermatology";
  if (t.includes("dentist") || t.includes("dental") || t.includes("teeth") || t.includes("orthodon")) return "dentist";
  if (t.includes("cardio") || t.includes("heart") || t.includes("cardiac")) return "cardiologist";
  if (t.includes("orthop") || t.includes("orthopaed") || t.includes("bone") || t.includes("joint")) return "orthopedic";
  if (t.includes("gynae") || t.includes("gynecol") || t.includes("obstet") || t.includes("maternity") || t.includes("women")) return "gynaecology";
  if (t.includes("ivf") || t.includes("fertility") || t.includes("infertil") || t.includes("reproduct")) return "ivf";
  if (t.includes("urol")) return "urology";
  if (t.includes("ent") || t.includes("ear nose") || t.includes("otolaryng") || t.includes("sinus") || t.includes("hearing")) return "ent";
  if (t.includes("ophthal") || t.includes("eye") || t.includes("retina") || t.includes("lasik") || t.includes("cataract")) return "ophthalmology";
  if (t.includes("physio") || t.includes("rehab") || t.includes("rehabilitation")) return "physiotherapy";
  if (t.includes("psychi") || t.includes("mental health") || t.includes("psycholog") || t.includes("deaddiction")) return "psychiatry";
  if (t.includes("neurol") || t.includes("neuro") || t.includes("brain")) return "neurology";
  if (t.includes("pulmon") || t.includes("chest") || t.includes("lung") || t.includes("asthma") || t.includes("respirat")) return "pulmonology";
  if (t.includes("gastro") || t.includes("digestive") || t.includes("liver") || t.includes("stomach") || t.includes("endoscopy")) return "gastroenterology";
  if (t.includes("nephrol") || t.includes("kidney") || t.includes("dialysis") || t.includes("renal")) return "nephrology";
  if (t.includes("diabet") || t.includes("endocrinol") || t.includes("metabolic") || t.includes("thyroid")) return "diabetes";
  if (t.includes("diagnostic") || t.includes("laboratory") || t.includes("pathology") || t.includes("lab") || t.includes("imaging") || t.includes("scan center")) return "diagnostic";
  if (t.includes("hospital") || t.includes("multispecialty") || t.includes("multi specialty")) return "hospital";
  return null;
}

// ── Main export ────────────────────────────────────────────────────────────────
// ── Main export ────────────────────────────────────────────────────────────────
export function detectSpeciality(
  businessName: string,
  categories: string[] = [],
  address: string = "",
  searchQuery: string = "",
  primaryTypeSlug?: string | null,           // e.g. "pediatrician" — from Places API v1
  primaryTypeDisplayName?: string | null,    // e.g. "Pediatrician" — from Places API v1
  reviewsText: string[] = []                 // 🌟 Patient review snippets from Google Places API
): SpecialityBenchmark {

  // ── Priority 1: Direct GBP primary type slug match ──────────────────────────
  // This is the most reliable signal — it's exactly what Google Maps shows
  // as the business's primary category (when specific e.g. "pediatrician", "dentist").
  if (primaryTypeSlug) {
    const normalizedSlug = primaryTypeSlug.toLowerCase().trim();
    // Exclude generic tags like "doctor", "medical_clinic", "health" from slug matching
    // so they fall through to review/name analysis.
    const genericSlugs = ["doctor", "medical_clinic", "health", "point_of_interest", "establishment", "consultant"];
    if (!genericSlugs.includes(normalizedSlug)) {
      const specialtyKey = GBP_TYPE_TO_SPECIALTY[normalizedSlug];
      if (specialtyKey && SPECIALITY_DATABASE[specialtyKey]) {
        console.log(`[Specialty] Matched via GBP primaryType slug: "${primaryTypeSlug}" → "${specialtyKey}"`);
        return SPECIALITY_DATABASE[specialtyKey];
      }
    }
  }

  // ── Priority 2: Primary type display name keyword match ──────────────────────
  // e.g. primaryTypeDisplayName = "Pediatrician" or "Child Specialist"
  if (primaryTypeDisplayName && primaryTypeDisplayName.toLowerCase() !== "doctor") {
    const key = detectByDisplayName(primaryTypeDisplayName);
    if (key && SPECIALITY_DATABASE[key]) {
      console.log(`[Specialty] Matched via GBP displayName: "${primaryTypeDisplayName}" → "${key}"`);
      return SPECIALITY_DATABASE[key];
    }
  }

  // ── Priority 3: Patient Reviews Keyword Engine (🌟 REVOLUTIONARY FOR LOCAL SEO)
  // When Google Places API returns generic "Doctor" or "Medical Clinic",
  // patient reviews contain the exact specialty (e.g. "pediatrician", "baby", "root canal").
  if (reviewsText && reviewsText.length > 0) {
    const reviewsCorpus = reviewsText.join(" ").toLowerCase();

    if (reviewsCorpus.includes("pediatr") || reviewsCorpus.includes("neonat") || reviewsCorpus.includes("child doctor") || reviewsCorpus.includes("baby's") || reviewsCorpus.includes("child's")) {
      console.log(`[Specialty] Matched via Patient Reviews → "pediatrics"`);
      return SPECIALITY_DATABASE["pediatrics"];
    }
    if (reviewsCorpus.includes("derma") || reviewsCorpus.includes("acne") || reviewsCorpus.includes("skin care") || reviewsCorpus.includes("laser hair")) {
      console.log(`[Specialty] Matched via Patient Reviews → "dermatology"`);
      return SPECIALITY_DATABASE["dermatology"];
    }
    if (reviewsCorpus.includes("dentist") || reviewsCorpus.includes("dental") || reviewsCorpus.includes("root canal") || reviewsCorpus.includes("teeth")) {
      console.log(`[Specialty] Matched via Patient Reviews → "dentist"`);
      return SPECIALITY_DATABASE["dentist"];
    }
    if (reviewsCorpus.includes("ivf") || reviewsCorpus.includes("fertility") || reviewsCorpus.includes("infertility")) {
      console.log(`[Specialty] Matched via Patient Reviews → "ivf"`);
      return SPECIALITY_DATABASE["ivf"];
    }
    if (reviewsCorpus.includes("gynae") || reviewsCorpus.includes("gynecol") || reviewsCorpus.includes("pregnancy") || reviewsCorpus.includes("pcos")) {
      console.log(`[Specialty] Matched via Patient Reviews → "gynaecology"`);
      return SPECIALITY_DATABASE["gynaecology"];
    }
    if (reviewsCorpus.includes("orthop") || reviewsCorpus.includes("knee replacement") || reviewsCorpus.includes("bone doctor") || reviewsCorpus.includes("joint pain")) {
      console.log(`[Specialty] Matched via Patient Reviews → "orthopedic"`);
      return SPECIALITY_DATABASE["orthopedic"];
    }
    if (reviewsCorpus.includes("cardio") || reviewsCorpus.includes("heart doctor") || reviewsCorpus.includes("ecg")) {
      console.log(`[Specialty] Matched via Patient Reviews → "cardiologist"`);
      return SPECIALITY_DATABASE["cardiologist"];
    }
    if (reviewsCorpus.includes("urol") || reviewsCorpus.includes("kidney stone") || reviewsCorpus.includes("prostate")) {
      console.log(`[Specialty] Matched via Patient Reviews → "urology"`);
      return SPECIALITY_DATABASE["urology"];
    }
    if (reviewsCorpus.includes("ent") || reviewsCorpus.includes("ear nose") || reviewsCorpus.includes("sinus") || reviewsCorpus.includes("tonsil")) {
      console.log(`[Specialty] Matched via Patient Reviews → "ent"`);
      return SPECIALITY_DATABASE["ent"];
    }
    if (reviewsCorpus.includes("eye doctor") || reviewsCorpus.includes("lasik") || reviewsCorpus.includes("cataract") || reviewsCorpus.includes("ophthal")) {
      console.log(`[Specialty] Matched via Patient Reviews → "ophthalmology"`);
      return SPECIALITY_DATABASE["ophthalmology"];
    }
    if (reviewsCorpus.includes("physio") || reviewsCorpus.includes("back pain") || reviewsCorpus.includes("rehab")) {
      console.log(`[Specialty] Matched via Patient Reviews → "physiotherapy"`);
      return SPECIALITY_DATABASE["physiotherapy"];
    }
    if (reviewsCorpus.includes("diabet") || reviewsCorpus.includes("hba1c") || reviewsCorpus.includes("insulin")) {
      console.log(`[Specialty] Matched via Patient Reviews → "diabetes"`);
      return SPECIALITY_DATABASE["diabetes"];
    }
  }

  // ── Priority 4: Business name + search query keyword matching ─────────
  const text = (businessName + " " + categories.join(" ") + " " + searchQuery).toLowerCase();

  if (text.includes("pediatr") || text.includes("child specialist") || text.includes("bal rog") || text.includes("shishu")) return SPECIALITY_DATABASE["pediatrics"];
  if (text.includes("derma") || text.includes("skin specialist") || text.includes("cosmet") || text.includes("laser") || text.includes("aesthetic")) return SPECIALITY_DATABASE["dermatology"];
  if (text.includes("urol")) return SPECIALITY_DATABASE["urology"];
  if (text.includes("ivf") || text.includes("fertility") || text.includes("infertil") || text.includes("reproduct")) return SPECIALITY_DATABASE["ivf"];
  if (text.includes("orthopedic") || text.includes("orthopaedic") || text.includes("bone") || text.includes("sports injury") || text.includes("joint replace")) return SPECIALITY_DATABASE["orthopedic"];
  if (text.includes("dental") || text.includes("dentist") || text.includes("teeth") || text.includes("orthodon")) return SPECIALITY_DATABASE["dentist"];
  if (text.includes("cardio") || text.includes("heart") || text.includes("cardiac")) return SPECIALITY_DATABASE["cardiologist"];
  if (text.includes("diagnostic") || text.includes("laboratory") || text.includes("pathology") || text.includes("scan center") || text.includes("imaging")) return SPECIALITY_DATABASE["diagnostic"];
  if (text.includes("hospital") || text.includes("multispecialty") || text.includes("multi specialty")) return SPECIALITY_DATABASE["hospital"];
  if (text.includes("diabet") || text.includes("endocrinol") || text.includes("metabolic") || text.includes("thyroid")) return SPECIALITY_DATABASE["diabetes"];
  if (text.includes("gynae") || text.includes("gynecol") || text.includes("obstet") || text.includes("maternity") || text.includes("women")) return SPECIALITY_DATABASE["gynaecology"];
  if (text.includes(" ent ") || text.includes("ear nose") || text.includes("otolaryng") || text.includes("sinus") || text.includes("hearing")) return SPECIALITY_DATABASE["ent"];
  if (text.includes("ophthal") || text.includes("eye clinic") || text.includes("retina") || text.includes("lasik") || text.includes("cataract")) return SPECIALITY_DATABASE["ophthalmology"];
  if (text.includes("physio") || text.includes("rehab") || text.includes("rehabilitation")) return SPECIALITY_DATABASE["physiotherapy"];
  if (text.includes("psychi") || text.includes("mental health") || text.includes("psycholog") || text.includes("deaddiction")) return SPECIALITY_DATABASE["psychiatry"];
  if (text.includes("neurol") || text.includes("neuro") || text.includes("brain")) return SPECIALITY_DATABASE["neurology"];
  if (text.includes("pulmon") || text.includes("chest") || text.includes("lung") || text.includes("asthma") || text.includes("respirat")) return SPECIALITY_DATABASE["pulmonology"];
  if (text.includes("gastro") || text.includes("digestive") || text.includes("liver") || text.includes("stomach") || text.includes("endoscopy")) return SPECIALITY_DATABASE["gastroenterology"];
  if (text.includes("nephrol") || text.includes("kidney") || text.includes("dialysis") || text.includes("renal")) return SPECIALITY_DATABASE["nephrology"];

  // ── Priority 5: Fallback — only fall to "general" if explicitly matching family physician ──
  const textWithAddress = text + " " + address.toLowerCase();
  if (textWithAddress.includes("general physician") || textWithAddress.includes("general practice") || textWithAddress.includes("family medicine")) {
    return SPECIALITY_DATABASE["general"];
  }

  // ── Unknown — not enough signal ──────────────────────────────────────────────
  return {
    speciality: "General Medical Clinic",
    isUnknown: true,
    expectedRating: 4.5,
    expectedReviewCount: 100,
    highValueKeywords: ["Doctor Near Me", "Clinic Near Me", "General Physician"],
    seasonalOpportunities: ["Annual Health Checkups (Jan)"],
    contentOpportunities: ["Importance of regular checkups"]
  };
}
