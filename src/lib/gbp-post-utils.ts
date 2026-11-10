/**
 * Tier 2 Deterministic Code Sanitizer for Google Business Profile Posts
 * Enforces Google Maps Content Policies and scrubs robotic, commercial, or spam clichés.
 */
export function sanitizeGbpPost(rawContent: string, preferredCta: string = "CALL", doctorOrClinic: string = "our clinic"): string {
  let text = (rawContent || "").trim();

  // 1. Remove codeblock fences (``` or ```markdown)
  text = text.replace(/^```[a-zA-Z]*\n?/g, "").replace(/\n?```$/g, "");

  // 2. Strip surrounding quotes
  text = text.replace(/^["']+|["']+$/g, "");

  // 3. Strip Markdown bold, italics, strikethrough, backticks, and headers
  text = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "");

  // 4. Strip markdown links [Anchor Text](http...) -> Anchor Text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 5. Strip raw URLs (http:// or https://)
  text = text.replace(/https?:\/\/[^\s]+/gi, "");

  // 6. Strip phone numbers (Google strictly bans phone numbers in post body text to prevent spam)
  text = text.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}/g, "");

  // 7. Tier 2 Banned Words Gatekeeper: Scrub commercial marketing words & robotic AI clichés
  text = text
    // Commercial / Marketing Hype
    .replace(/\bgreat\s+deal\b/gi, "trusted care")
    .replace(/\bbest\s+deal\b/gi, "quality care")
    .replace(/\bexclusive\s+offer\b/gi, "specialized care")
    .replace(/\bunbeatable\s+price\b/gi, "accessible care")
    .replace(/\bspecial\s+discount\b/gi, "patient consultation")
    .replace(/\b50%\s+off\b/gi, "")
    .replace(/\bvalue\s+for\s+money\b/gi, "patient-first care")
    // Robotic AI Clichés & Buzzwords
    .replace(/\bgame-changer\b/gi, "meaningful step forward")
    .replace(/\bgame\s+changer\b/gi, "meaningful step forward")
    .replace(/\bunwavering\s+commitment\b/gi, "dedication")
    .replace(/\bstrive\s+for\s+excellence\b/gi, "focus on quality care")
    .replace(/\bstriving\s+for\s+excellence\b/gi, "focusing on quality care")
    .replace(/\bbeacon\s+of\s+hope\b/gi, "supportive care center")
    .replace(/\bexceptional\s+healthcare\s+journey\b/gi, "care and recovery")
    .replace(/\bhealthcare\s+journey\b/gi, "treatment and wellness")
    .replace(/\btestament\s+to\b/gi, "reflection of")
    .replace(/\blook\s+no\s+further\b/gi, "our team is here for you")
    .replace(/\bin\s+today's\s+fast-paced\s+world\b/gi, "today")
    .replace(/\bdelighted\s+to\s+announce\b/gi, "pleased to share")
    .replace(/\bthrilled\s+to\s+(?:share|announce)\b/gi, "pleased to share")
    .replace(/\bexcited\s+to\s+share\b/gi, "pleased to share")
    .replace(/\bdive\s+deep\s+into\b/gi, "explore")
    .replace(/\blet's\s+dive\s+into\b/gi, "let's look at")
    .replace(/\brest\s+assured\b/gi, "you can be confident")
    .replace(/\bkudos\b/gi, "our sincere appreciation")
    // Medical Ethics & Miracle Claims
    .replace(/\bguaranteed\s+cure\b/gi, "evidence-based treatment")
    .replace(/\b100%\s+cure\b/gi, "proven care")
    .replace(/\bmiracle\s+(?:cure|treatment|healing)\b/gi, "advanced care");

  // 8. Clean excessive whitespace
  text = text.replace(/[ \t]+/g, " ");

  // 9. Normalize paragraph breaks (ensure clean 2-3 paragraph separation with blank lines)
  text = text.replace(/\n{3,}/g, "\n\n");

  // Ensure clean paragraph break before concluding CTA phrases if squashed into a single block
  const ctaPhrases = [
    "Tap 'Call Now'",
    "Tap 'Book'",
    "Tap 'Learn More'",
    "Tap Call Now",
    "Tap Book",
    "Tap Learn More",
    "Schedule your consultation",
    "Book your appointment"
  ];
  for (const cta of ctaPhrases) {
    const reg = new RegExp(`([.!?])\\s*(${cta})`, "gi");
    text = text.replace(reg, "$1\n\n$2");
  }

  return text.trim();
}
