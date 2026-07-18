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
    speciality: "Dermatology Clinic",
    expectedRating: 4.6,
    expectedReviewCount: 180,
    highValueKeywords: ["Skin Specialist near me", "Acne Treatment", "Laser Hair Removal", "Botox Clinic", "Psoriasis Treatment", "Chemical Peel"],
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
  "psychiatry": {
    speciality: "Mental Health Clinic",
    expectedRating: 4.7,
    expectedReviewCount: 80,
    highValueKeywords: ["Psychiatrist near me", "Depression Treatment", "Anxiety Specialist", "OCD Therapy", "Addiction Treatment", "Online Therapy"],
    seasonalOpportunities: ["World Mental Health Day (Oct 10)", "New Year Wellness (Jan)"],
    contentOpportunities: ["When to see a psychiatrist vs psychologist", "Breaking the stigma around mental health"]
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

export function detectSpeciality(businessName: string, categories: string[]): SpecialityBenchmark {
  const text = (businessName + " " + categories.join(" ")).toLowerCase();
  
  if (text.includes("urology") || text.includes("urologist")) return SPECIALITY_DATABASE["urology"];
  if (text.includes("ivf") || text.includes("fertility") || text.includes("reproduction") || text.includes("infertility")) return SPECIALITY_DATABASE["ivf"];
  if (text.includes("orthopedic") || text.includes("orthopaedic") || text.includes("bone") || text.includes("sports injury") || text.includes("joint")) return SPECIALITY_DATABASE["orthopedic"];
  if (text.includes("dental") || text.includes("dentist") || text.includes("teeth") || text.includes("orthodon")) return SPECIALITY_DATABASE["dentist"];
  if (text.includes("cardio") || text.includes("heart") || text.includes("cardiac")) return SPECIALITY_DATABASE["cardiologist"];
  if (text.includes("diagnostic") || text.includes("laboratory") || text.includes("pathology") || text.includes("scan center") || text.includes("imaging")) return SPECIALITY_DATABASE["diagnostic"];
  if (text.includes("hospital") || text.includes("multispecialty") || text.includes("multi specialty")) return SPECIALITY_DATABASE["hospital"];
  if (text.includes("diabet") || text.includes("endocrinol") || text.includes("metabolic") || text.includes("thyroid")) return SPECIALITY_DATABASE["diabetes"];
  if (text.includes("derma") || text.includes("skin") || text.includes("cosmet") || text.includes("laser clinic")) return SPECIALITY_DATABASE["dermatology"];
  if (text.includes("gynae") || text.includes("gynecol") || text.includes("obstet") || text.includes("maternity") || text.includes("women")) return SPECIALITY_DATABASE["gynaecology"];
  if (text.includes(" ent ") || text.includes("ear nose") || text.includes("otolaryngol") || text.includes("sinus") || text.includes("hearing")) return SPECIALITY_DATABASE["ent"];
  if (text.includes("ophthal") || text.includes("eye") || text.includes("retina") || text.includes("lasik") || text.includes("cataract")) return SPECIALITY_DATABASE["ophthalmology"];
  if (text.includes("physio") || text.includes("rehab") || text.includes("rehabilitation")) return SPECIALITY_DATABASE["physiotherapy"];
  if (text.includes("psychi") || text.includes("mental health") || text.includes("psycholog") || text.includes("deaddiction")) return SPECIALITY_DATABASE["psychiatry"];
  if (text.includes("clinic") || text.includes("doctor") || text.includes("physician") || text.includes("medical") || text.includes("health")) return SPECIALITY_DATABASE["general"];

  return {
    speciality: "Unable to determine business specialty",
    isUnknown: true,
    expectedRating: 4.5,
    expectedReviewCount: 100,
    highValueKeywords: [],
    seasonalOpportunities: [],
    contentOpportunities: []
  };
}
