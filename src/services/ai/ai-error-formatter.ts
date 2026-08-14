/**
  * Human-Friendly AI Error Formatter
  * Translates technical SDK/HTTP errors (503, 429, 404, etc.) into clear, polite messages for clinic doctors.
  */
export function toHumanFriendlyAIError(error: any): string {
  if (!error) return "Unable to generate AI response right now. Please try again.";

  const message = typeof error === "string" ? error : error.message || error.toString() || "";

  if (
    message.includes("503") ||
    message.includes("Service Unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded")
  ) {
    return "The AI assistant is currently experiencing heavy traffic. Please try again in a few seconds.";
  }

  if (
    message.includes("429") ||
    message.includes("Quota") ||
    message.includes("Rate limit") ||
    message.includes("RESOURCE_EXHAUSTED")
  ) {
    return "AI monthly usage limit reached. Please wait a moment or check your plan under Billing.";
  }

  if (
    message.includes("InsufficientAICreditsError") ||
    message.includes("Insufficient AI Credits")
  ) {
    return "You have used all AI credits for this month. Please upgrade your plan under Billing to unlock more credits.";
  }

  if (
    message.includes("ModuleAccessDeniedError") ||
    message.includes("MODULE_NOT_INCLUDED")
  ) {
    return "AI features are not included in your current subscription plan. Please upgrade your plan to unlock AI features.";
  }

  if (
    message.includes("API key not valid") ||
    message.includes("API_KEY_INVALID")
  ) {
    return "AI service key configuration issue. Please contact support.";
  }

  return "Unable to generate AI response right now. Please try again in a few moments.";
}
