export const SPECIALTIES = [
  "Audiology & Speech Therapy",
  "Ayurveda",
  "Cardiology",
  "Clinical Psychology & Counseling",
  "Cosmetology & Aesthetic Medicine",
  "Dentistry",
  "Dermatology",
  "Diabetology",
  "Dietetics & Clinical Nutrition",
  "Endocrinology",
  "ENT (Otolaryngology)",
  "Gastroenterology",
  "General Medicine",
  "General Surgery",
  "Gynecology & Obstetrics",
  "Hematology",
  "Homeopathy",
  "Infectious Diseases",
  "IVF & Infertility",
  "Laparoscopic Surgery",
  "Naturopathy & Yoga",
  "Nephrology",
  "Neurology",
  "Neurosurgery & Spine Surgery",
  "Occupational Therapy",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pathology & Laboratory Medicine",
  "Pediatric Surgery",
  "Pediatrics",
  "Physiotherapy",
  "Plastic & Reconstructive Surgery",
  "Psychiatry",
  "Pulmonology & Respiratory Medicine",
  "Radiology & Imaging",
  "Rheumatology",
  "Sexology & Andrology",
  "Sports Medicine",
  "Trichology & Hair Transplant",
  "Urology",
  "Vascular Surgery",
  "Other",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

const SPECIALTY_ALIASES: Record<string, Specialty> = {
  "general physician": "General Medicine",
  "internal medicine": "General Medicine",
  "family medicine": "General Medicine",
  "physician": "General Medicine",
  "gynaecology": "Gynecology & Obstetrics",
  "gynecology": "Gynecology & Obstetrics",
  "obstetrics": "Gynecology & Obstetrics",
  "gynaecologist": "Gynecology & Obstetrics",
  "gynecologist": "Gynecology & Obstetrics",
  "ob-gyn": "Gynecology & Obstetrics",
  "eye care": "Ophthalmology",
  "eye specialist": "Ophthalmology",
  "ophthalmologist": "Ophthalmology",
  "ent": "ENT (Otolaryngology)",
  "ear nose throat": "ENT (Otolaryngology)",
  "dental": "Dentistry",
  "dentist": "Dentistry",
  "dental clinic": "Dentistry",
  "skin": "Dermatology",
  "skin specialist": "Dermatology",
  "dermatologist": "Dermatology",
  "child specialist": "Pediatrics",
  "pediatrician": "Pediatrics",
  "heart specialist": "Cardiology",
  "cardiologist": "Cardiology",
  "orthopedic": "Orthopedics",
  "orthopedic surgeon": "Orthopedics",
  "joint specialist": "Orthopedics",
  "physiotherapist": "Physiotherapy",
  "physical therapy": "Physiotherapy",
  "rehab": "Physiotherapy",
  "sugar specialist": "Diabetology",
  "diabetes": "Diabetology",
  "kidney specialist": "Nephrology",
  "chest specialist": "Pulmonology & Respiratory Medicine",
  "pulmonologist": "Pulmonology & Respiratory Medicine",
  "respiratory medicine": "Pulmonology & Respiratory Medicine",
  "cancer specialist": "Oncology",
  "oncologist": "Oncology",
  "neuro specialist": "Neurology",
  "neurologist": "Neurology",
  "dietitian": "Dietetics & Clinical Nutrition",
  "nutritionist": "Dietetics & Clinical Nutrition",
  "counselor": "Clinical Psychology & Counseling",
  "psychologist": "Clinical Psychology & Counseling",
  "shrink": "Psychiatry",
  "psychiatrist": "Psychiatry",
};

export function normalizeSpecialty(input: string | null | undefined): string {
  if (!input) return "";
  const trimmed = input.trim();
  if ((SPECIALTIES as readonly string[]).includes(trimmed)) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (SPECIALTY_ALIASES[lower]) {
    return SPECIALTY_ALIASES[lower];
  }
  return trimmed;
}

export function isStandardSpecialty(input: string | null | undefined): boolean {
  if (!input) return false;
  return (SPECIALTIES as readonly string[]).includes(input.trim());
}
