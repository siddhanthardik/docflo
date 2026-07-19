/**
 * shadowCheck
 *
 * A fire-and-forget helper that wraps EntitlementService module/limit checks
 * for Shadow Mode. It NEVER throws, NEVER blocks the calling route, and
 * NEVER alters the response. All failures are written to the
 * ShadowEntitlementLog table for offline review.
 *
 * Usage:
 *   shadowCheck(doctorId, { module: "CLINIC_CORE", limit: "MAX_PATIENTS" }, req);
 *
 * The returned promise is intentionally ignored by callers.
 */
import { EntitlementService } from "@/services/entitlement.service";
import { ModuleName, LimitName } from "@prisma/client";
import crypto from "crypto";

export interface ShadowCheckOptions {
  module?: ModuleName;
  limit?: LimitName;
}

export function shadowCheck(
  doctorId: string,
  options: ShadowCheckOptions,
  req: Request | any
): void {
  // Build context from the Request object. This is completely sync
  // so it never delays the route handler.
  const requestId = crypto.randomUUID();
  const route = (() => {
    try {
      // Works for NextRequest and standard Request
      return req.nextUrl?.pathname || new URL(req.url).pathname;
    } catch {
      return req.url || "unknown";
    }
  })();
  const method = req.method || "UNKNOWN";

  const context = {
    route,
    method,
    requestId,
    // clinicId is the same as doctorId in current architecture (single-tenant clinic)
    clinicId: doctorId,
  };

  // Kick off async work — the void cast makes the fire-and-forget explicit
  void (async () => {
    try {
      const checks: Promise<void>[] = [];

      if (options.module) {
        checks.push(EntitlementService.requireModule(doctorId, options.module, context));
      }
      if (options.limit) {
        checks.push(EntitlementService.requireLimit(doctorId, options.limit, context));
      }

      // allSettled: never rejects, each check handles its own logging internally
      await Promise.allSettled(checks);
    } catch (err) {
      // Last-resort safety net — should never be reached
      console.error("[ShadowMode] Unexpected error in shadowCheck:", err);
    }
  })();
}
