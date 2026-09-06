/**
 * Patient Salutation and Cultural Gender Resolution Helper
 * 
 * Rules:
 * - Infants (< 1 year or months): "Baby [Name]"
 * - Children (1 to 12 years): Boys -> "Master [Name]", Girls -> "Baby [Name]" (or "Miss [Name]")
 * - Adults (>= 12 years): Males -> "Mr. [Name]", Females -> "Ms. [Name]"
 * - Unconfirmed Gender:
 *   - In Hindi / Hinglish: Respectful "Ji" honorific (e.g. "Namaste Siddhant ji 🙏")
 *   - In English: Respectful direct name (e.g. "Hi Siddhant") without misgendering
 */

export interface SalutationOptions {
  gender?: string | null; // MALE, FEMALE, OTHER
  age?: number | null;
  dateOfBirth?: Date | string | null;
  language?: "en" | "hi" | "auto";
}

export interface FormattedSalutationResult {
  salutation: string; // "Mr.", "Ms.", "Baby", "Master", or ""
  fullNameWithSalutation: string; // e.g. "Mr. Rahul Verma", "Baby Aarav"
  greetingName: string; // e.g. "Mr. Siddhant", "Baby Aarav", "Siddhant"
  conversationalGreeting: string; // e.g. "Hi Mr. Siddhant", "Namaste Siddhant ji 🙏"
}

export function calculateAgeFromDob(dob?: Date | string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function formatPatientSalutation(
  patient: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    gender?: string | null;
    dateOfBirth?: Date | string | null;
    age?: number | null;
  },
  language: "en" | "hi" | "auto" = "auto"
): FormattedSalutationResult {
  let pFirst = (patient.firstName || "").trim();
  let pLast = (patient.lastName || "").trim();

  // If combined name is passed without explicit first/last
  if (!pFirst && patient.name) {
    const parts = patient.name.trim().split(/\s+/);
    pFirst = parts[0] || "";
    pLast = parts.slice(1).join(" ");
  }
  
  // Clean first and last name
  const cleanFirst = (pFirst && pFirst.toLowerCase() !== "patient") ? pFirst : "";
  const cleanLast = (pLast && !pLast.startsWith("+") && pLast.toLowerCase() !== "patient" && pLast.toLowerCase() !== cleanFirst.toLowerCase()) ? pLast : "";
  
  const baseName = cleanLast ? `${cleanFirst} ${cleanLast}`.trim() : cleanFirst;
  const firstNameOnly = cleanFirst || "Patient";

  // Determine age
  let effectiveAge = patient.age ?? calculateAgeFromDob(patient.dateOfBirth);

  // Normalize Gender
  const rawG = (patient.gender || "").trim().toUpperCase();
  const isMale = rawG === "MALE" || rawG === "M";
  const isFemale = rawG === "FEMALE" || rawG === "F";

  let salutation = "";

  if (effectiveAge !== null && effectiveAge !== undefined) {
    if (effectiveAge < 1) {
      // Infant / Neonate
      salutation = "Baby";
    } else if (effectiveAge < 12) {
      // Pediatric child
      if (isMale) {
        salutation = "Master";
      } else if (isFemale) {
        salutation = "Baby";
      } else {
        salutation = "Baby";
      }
    } else {
      // Adult (>= 12 yrs)
      if (isMale) salutation = "Mr.";
      else if (isFemale) salutation = "Ms.";
    }
  } else {
    // Age unknown: treat adult rules if gender is confirmed
    if (isMale) salutation = "Mr.";
    else if (isFemale) salutation = "Ms.";
  }

  // Full name with salutation
  const fullNameWithSalutation = salutation 
    ? (baseName ? `${salutation} ${baseName}` : salutation)
    : (baseName || "Patient");

  // Greeting short name: e.g. "Mr. Siddhant" or "Baby Aarav"
  const greetingName = salutation 
    ? `${salutation} ${firstNameOnly}`
    : firstNameOnly;

  // Conversational greetings
  let conversationalGreeting = "";
  if (language === "hi") {
    // In Hindi / Hinglish:
    if (salutation === "Baby" || salutation === "Master") {
      conversationalGreeting = `Namaste ${salutation} ${firstNameOnly} ji 🙏`;
    } else if (salutation) {
      conversationalGreeting = `Namaste ${salutation} ${firstNameOnly} 🙏`;
    } else {
      // Unconfirmed gender in Hindi: The gold-standard respectful "Ji"
      conversationalGreeting = `Namaste ${firstNameOnly} ji 🙏`;
    }
  } else {
    // In English / Default:
    if (salutation) {
      conversationalGreeting = `Hi ${salutation} ${firstNameOnly}`;
    } else {
      conversationalGreeting = `Hi ${firstNameOnly}`;
    }
  }

  return {
    salutation,
    fullNameWithSalutation,
    greetingName,
    conversationalGreeting
  };
}

export function formatPatientDisplayNameWithAge(
  patient: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    gender?: string | null;
    dateOfBirth?: Date | string | null;
    age?: number | null;
  }
): string {
  const sal = formatPatientSalutation(patient);
  const calculatedAge = patient.age ?? calculateAgeFromDob(patient.dateOfBirth);
  const ageString = calculatedAge !== null && calculatedAge !== undefined 
    ? (calculatedAge < 1 ? " (Infant)" : ` (Age ${calculatedAge})`) 
    : "";
  return `${sal.fullNameWithSalutation}${ageString}`;
}
