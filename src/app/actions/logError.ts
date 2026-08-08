"use server";

import { logSystemError } from "@/lib/logger";

export async function logErrorAction(errorPayload: any, context?: any) {
  try {
    await logSystemError(errorPayload, context);
  } catch (err) {
    console.error("Failed to execute logErrorAction:", err);
  }
}
