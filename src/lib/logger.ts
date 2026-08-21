import { prisma as db } from "./prisma";

// Option A: Algorithmic Error Dictionary
const ERROR_DICTIONARY: Record<string, string> = {
  // Prisma Errors
  P2002: "Unique constraint failed. Solution: A record with this unique field (e.g. email or phone) already exists. Check the database to ensure you are not inserting a duplicate.",
  P2025: "Record not found. Solution: The record you are trying to update or delete does not exist. Check the ID being passed in the query.",
  P2003: "Foreign key constraint failed. Solution: You are trying to insert or update a record that references a non-existent parent ID. Ensure the parent record exists.",
  P1001: "Can't reach database server. Solution: Check your DATABASE_URL environment variable and ensure the database is running and accepting connections.",
  P2011: "Null constraint violation. Solution: A required field is missing in your insert/update payload.",

  // Common Next.js / React Errors
  NEXT_NOT_FOUND: "Page not found. Solution: The requested route does not exist. Ensure the URL is correct or the dynamic route parameter is valid.",
  NEXT_REDIRECT: "Redirected. Solution: Not an error. The user was redirected to another page.",
  UNHANDLED_RUNTIME_ERROR: "Unhandled runtime error in client component. Solution: Check the stack trace to identify which component crashed. Often caused by reading properties of undefined or null in a render function.",

  // Authentication Errors
  AUTH_NO_SESSION: "No active session. Solution: User tried to access a protected route without being logged in. Ensure middleware is redirecting properly.",
  AUTH_UNAUTHORIZED: "Unauthorized action. Solution: User does not have the required role (e.g. Admin) to perform this action.",

  // Payment Errors
  RAZORPAY_SIGNATURE_MISMATCH: "Invalid payment signature. Solution: The webhook payload signature did not match the expected secret. Check RAZORPAY_WEBHOOK_SECRET in environment variables.",
  STRIPE_WEBHOOK_FAILED: "Stripe webhook failed. Solution: Check STRIPE_WEBHOOK_SECRET and ensure the endpoint is publicly accessible.",

  // WhatsApp Business & AI Receptionist Errors
  WA_TERMINAL_AUTH_FAILURE: "WhatsApp authentication failed or session expired. Solution: Clear session in Settings > WhatsApp and re-scan the QR code.",
  WA_MESSAGE_PROCESSING_ERROR: "WhatsApp incoming message handler crashed. Solution: Check patient message payload, database connectivity, or AI agent configuration.",
  WA_SEND_FAILED: "WhatsApp outbound message delivery failed. Solution: Verify that the WhatsApp Business phone is online and connected.",
  WA_CONNECTION_ERROR: "WhatsApp connection error. Solution: Verify internet connection and ensure Baileys multi-file auth credentials on disk are not corrupted.",
  WA_CONCIERGE_ERROR: "Superadmin WhatsApp concierge bot exception. Solution: Check Google Places API key and audit scan services.",
};

function determineSolution(errorCode: string | null, errorMessage: string): string {
  if (errorCode && ERROR_DICTIONARY[errorCode]) {
    return ERROR_DICTIONARY[errorCode];
  }

  // Fallback pattern matching
  if (errorMessage.includes("WhatsApp") || errorMessage.includes("Baileys")) {
    if (errorMessage.includes("loggedOut") || errorMessage.includes("badSession") || errorMessage.includes("401") || errorMessage.includes("405")) {
      return "WhatsApp session logged out or expired. Solution: Scan the QR code in Clinic Settings to reconnect the WhatsApp Business number.";
    }
    return "WhatsApp service encountered an issue. Solution: Verify WhatsApp device connection status in Clinic Settings.";
  }
  if (errorMessage.includes("ECONNREFUSED")) {
    return "Connection refused. Solution: A service you are trying to reach is down or blocking requests. Check database, Redis, or third-party API status.";
  }
  if (errorMessage.includes("Cannot read properties of undefined")) {
    return "Type Error. Solution: You are trying to access a property on an undefined object. Add optional chaining (?.) or a null check before accessing the property.";
  }
  if (errorMessage.includes("fetch failed") || errorMessage.includes("timeout")) {
    return "Network timeout. Solution: An external API request failed or timed out. Check the URL and the external service status.";
  }

  return "No predefined solution found. Review the stack trace and the exact error message to debug the issue.";
}

export async function logSystemError(error: any, context?: { path?: string; method?: string; metadata?: any }) {
  try {
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || error?.name || null;
    const stackTrace = error?.stack || null;
    
    // Ignore harmless Next.js errors
    if (errorMessage.includes("NEXT_REDIRECT") || errorMessage.includes("NEXT_NOT_FOUND") || errorCode === "NEXT_REDIRECT") {
      return;
    }

    const solution = determineSolution(errorCode, errorMessage);

    await db.systemErrorLog.create({
      data: {
        errorCode: typeof errorCode === 'string' ? errorCode : null,
        errorMessage: errorMessage.substring(0, 5000), // Prevent DB overflow
        stackTrace: stackTrace?.substring(0, 10000),
        path: context?.path || null,
        method: context?.method || null,
        metadata: context?.metadata || null,
        solution,
      },
    });

  } catch (loggingError) {
    // If the logger itself fails (e.g. DB is down), log to standard output as a last resort
    console.error("FATAL: Failed to log system error to database.", loggingError);
    console.error("Original Error:", error);
  }
}
