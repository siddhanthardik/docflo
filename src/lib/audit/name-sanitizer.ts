/**
 * Utility to sanitize doctor and clinic business names from Google Business Profiles.
 * Resolves repeated honorifics (e.g. "Dr. Dr." -> "Dr.") and separates clean entity names
 * from keyword-stuffed SEO titles.
 */

export interface SanitizedBusinessName {
  cleanDisplayName: string;
  fullRawTitle: string;
  doctorHonorific: string | null;
  isKeywordStuffed: boolean;
  stuffedKeywords: string[];
  detectedSpecialtyKeywords: string[];
}

export function sanitizeDoctorBusinessName(rawName: string | null | undefined): SanitizedBusinessName {
  if (!rawName || typeof rawName !== "string") {
    return {
      cleanDisplayName: "Your Clinic",
      fullRawTitle: "Your Clinic",
      doctorHonorific: null,
      isKeywordStuffed: false,
      stuffedKeywords: [],
      detectedSpecialtyKeywords: [],
    };
  }

  const original = rawName.trim();

  // 1. Deduplicate repeated doctor prefixes (e.g. "Dr. Dr.", "Dr.Dr.", "Dr Dr", "Doctor Dr.")
  let normalized = original
    .replace(/\b(dr\.?|doctor)\s*(dr\.?|doctor)\b/gi, "Dr.")
    .replace(/\b(dr\.?|doctor)\s+(dr\.?|doctor)\b/gi, "Dr.")
    .replace(/^dr\.\s*dr\.\s*/i, "Dr. ")
    .replace(/^dr\s*dr\s*/i, "Dr. ");

  // 2. Identify delimiters commonly used for Google Business Profile keyword stuffing
  // e.g. " | ", " - ", " : ", " • ", " – ", " / "
  const delimiterRegex = /\s*([|•–—]| - | : )\s*/;
  const segments = normalized.split(delimiterRegex).map(s => s.trim()).filter(s => s.length > 0 && !["|", "•", "–", "—", "-", ":"].includes(s));

  // The primary segment is usually the clinic or doctor name
  let primarySegment = segments[0] || normalized;

  // Cleanup honorific in primary segment if it has "Dr."
  primarySegment = primarySegment
    .replace(/\b(dr\.?|doctor)\s*(dr\.?|doctor)\b/gi, "Dr.")
    .replace(/^dr\s+/i, "Dr. ")
    .trim();

  // 3. Detect keyword stuffing and extracted keywords from remaining segments
  const marketingNoiseWords = [
    "consult with", "best", "near me", "top", "experienced", 
    "years of exp", "yrs of exp", "yrs. of exp", "expert in",
    "famous", "leading", "specialist in", "clinic near me",
    "doctor near me", "hospital near me"
  ];

  const stuffedKeywords: string[] = [];
  const detectedSpecialtyKeywords: string[] = [];

  const clinicalKeywords = [
    "family physician", "general physician", "physician", "general practitioner",
    "diabetes", "diabetologist", "high blood pressure", "hypertension",
    "cardiologist", "dermatologist", "skin specialist", "pediatrician",
    "child specialist", "orthopedic", "dentist", "dental", "gynecologist",
    "ent specialist", "ophthalmologist", "eye clinic", "physiotherapy",
    "neurologist", "urologist", "nephrologist", "gastroenterologist",
    "homeopath", "ayurveda", "surgeon"
  ];

  // Check segments for specialties and marketing noise
  if (segments.length > 1) {
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      stuffedKeywords.push(seg);

      const segLower = seg.toLowerCase();
      clinicalKeywords.forEach(kw => {
        if (segLower.includes(kw) && !detectedSpecialtyKeywords.includes(kw)) {
          detectedSpecialtyKeywords.push(kw);
        }
      });
    }
  }

  // Also check if primary segment itself has trailing noise like "Dr. Madhu Nigam (Best Doctor)"
  primarySegment = primarySegment
    .replace(/\s*\([^)]*(best|near me|expert|doctor|clinic)[^)]*\)/gi, "")
    .trim();

  const isKeywordStuffed = segments.length > 1 || marketingNoiseWords.some(w => original.toLowerCase().includes(w));

  // Determine honorific
  const hasDr = /^dr\.?\s+/i.test(primarySegment) || /^doctor\s+/i.test(primarySegment);

  return {
    cleanDisplayName: primarySegment,
    fullRawTitle: original.replace(/\b(dr\.?|doctor)\s*(dr\.?|doctor)\b/gi, "Dr."),
    doctorHonorific: hasDr ? "Dr." : null,
    isKeywordStuffed,
    stuffedKeywords,
    detectedSpecialtyKeywords,
  };
}
