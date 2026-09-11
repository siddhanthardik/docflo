/**
 * Patient Salutation and Cultural Gender Resolution Helper
 * 
 * Rules:
 * - Infants (< 1 year or newborn): "Baby [Name]"
 * - Children (1 to 18 years): Boys -> "Master [Name]", Girls -> "Miss [Name]"
 * - Adults (>= 18 years): Males -> "Mr. [Name]", Females -> "Ms. [Name]"
 * - Minors (< 18 years) & Baby profiles:
 *   - NEVER append "ji" (e.g. No "Baby ji", No "Samarth ji")
 *   - Conversational greeting addresses the parent ("Hi Parent of Master Samarth") or uses clean direct name
 * - Unconfirmed Gender for Adults:
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
  salutation: string; // "Mr.", "Ms.", "Baby", "Master", "Miss", or ""
  fullNameWithSalutation: string; // e.g. "Mr. Rahul Verma", "Master Samarth", "Baby Vivaan"
  greetingName: string; // e.g. "Mr. Siddhant", "Master Samarth", "Baby Vivaan"
  conversationalGreeting: string; // e.g. "Dear Parent of Master Samarth", "Namaste Siddhant ji 🙏"
  isMinor: boolean;
  dynamicAgeString: string; // e.g. " (32 Months)", " (18 Days)", " (Age 28)"
}

export function calculateAgeDetailsFromDob(dob?: Date | string | null): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalMonths: number;
} | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  if (birthDate > today) return null;

  const diffMs = today.getTime() - birthDate.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let years = today.getFullYear() - birthDate.getFullYear();
  let m = today.getMonth() - birthDate.getMonth();
  let d = today.getDate() - birthDate.getDate();

  if (d < 0) {
    m--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    d += prevMonth.getDate();
  }
  if (m < 0) {
    years--;
    m += 12;
  }

  const totalMonths = Math.max(0, years * 12 + m);

  return {
    years: Math.max(0, years),
    months: Math.max(0, m),
    days: Math.max(0, d),
    totalDays,
    totalMonths
  };
}

export function calculateAgeFromDob(dob?: Date | string | null): number | null {
  const details = calculateAgeDetailsFromDob(dob);
  return details ? details.years : null;
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

  // Check if name already has a baby or B/O label
  const isBabyNamed = /^(baby\b|b\/o\b)/i.test(baseName);

  // Age calculations
  const ageDetails = calculateAgeDetailsFromDob(patient.dateOfBirth);
  let effectiveAgeYears = patient.age ?? (ageDetails ? ageDetails.years : null);

  // Dynamic Age String formatting
  let dynamicAgeString = "";
  if (ageDetails) {
    if (ageDetails.totalDays < 30) {
      dynamicAgeString = ` (${ageDetails.totalDays} Days)`;
    } else if (ageDetails.totalMonths < 24) {
      dynamicAgeString = ` (${ageDetails.totalMonths} Months)`;
    } else if (ageDetails.years < 5) {
      dynamicAgeString = ` (${ageDetails.totalMonths} Months)`;
    } else {
      dynamicAgeString = ` (Age ${ageDetails.years})`;
    }
  } else if (effectiveAgeYears !== null && effectiveAgeYears !== undefined) {
    dynamicAgeString = effectiveAgeYears < 1 ? " (Infant)" : ` (Age ${effectiveAgeYears})`;
  }

  // Normalize Gender
  const rawG = (patient.gender || "").trim().toUpperCase();
  const isMale = rawG === "MALE" || rawG === "M";
  const isFemale = rawG === "FEMALE" || rawG === "F";

  const isMinor = (effectiveAgeYears !== null && effectiveAgeYears < 18) || isBabyNamed;

  let salutation = "";

  if (isBabyNamed) {
    // If the name is already "Baby Vivaan" or "B/O Priyanka", do not prepend another salutation
    salutation = "";
  } else if (effectiveAgeYears !== null && effectiveAgeYears !== undefined) {
    if (effectiveAgeYears < 1 || (ageDetails && ageDetails.totalMonths < 12)) {
      salutation = "Baby";
    } else if (effectiveAgeYears < 18) {
      // Minor pediatric child
      if (isMale) {
        salutation = "Master";
      } else if (isFemale) {
        salutation = "Miss";
      } else {
        salutation = "Master/Miss";
      }
    } else {
      // Adult (>= 18 yrs)
      if (isMale) salutation = "Mr.";
      else if (isFemale) salutation = "Ms.";
    }
  } else {
    // Age unknown: fallback safely
    if (isMale) salutation = "Mr.";
    else if (isFemale) salutation = "Ms.";
  }

  // Full name with salutation
  let fullNameWithSalutation = "";
  if (isBabyNamed) {
    fullNameWithSalutation = baseName || "Baby";
  } else if (salutation) {
    fullNameWithSalutation = baseName ? `${salutation} ${baseName}` : salutation;
  } else {
    fullNameWithSalutation = baseName ? (isMinor ? baseName : `${baseName} ji`) : "Patient";
  }

  // Greeting short name
  let greetingName = "";
  if (isBabyNamed) {
    greetingName = baseName;
  } else if (salutation) {
    greetingName = `${salutation} ${firstNameOnly}`;
  } else {
    greetingName = isMinor ? firstNameOnly : `${firstNameOnly} ji`;
  }

  // Conversational greetings (Strictly suppressing "ji" for minors and babies)
  let conversationalGreeting = "";
  if (isMinor) {
    // Minors & Infants: Address the parent or use clean friendly greeting WITHOUT "ji"
    if (language === "hi") {
      if (salutation === "Baby" || isBabyNamed) {
        conversationalGreeting = `Namaste ${fullNameWithSalutation} ke parent 🙏`;
      } else {
        conversationalGreeting = `Namaste ${greetingName} 🙏`;
      }
    } else {
      if (salutation === "Baby" || isBabyNamed) {
        conversationalGreeting = `Dear Parent of ${fullNameWithSalutation} 👋`;
      } else {
        conversationalGreeting = `Dear Parent of ${greetingName} 👋`;
      }
    }
  } else {
    // Adults: Respectful standard greetings
    if (language === "hi") {
      if (salutation) {
        conversationalGreeting = `Namaste ${salutation} ${firstNameOnly} 🙏`;
      } else {
        conversationalGreeting = `Namaste ${firstNameOnly} ji 🙏`;
      }
    } else {
      if (salutation) {
        conversationalGreeting = `Hi ${salutation} ${firstNameOnly} 👋`;
      } else {
        conversationalGreeting = `Hi ${firstNameOnly} ji 👋`;
      }
    }
  }

  return {
    salutation,
    fullNameWithSalutation,
    greetingName,
    conversationalGreeting,
    isMinor,
    dynamicAgeString
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
  return `${sal.fullNameWithSalutation}${sal.dynamicAgeString}`;
}
