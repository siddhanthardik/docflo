import { NextRequest, NextResponse } from "next/server";
import { 
  EntitlementService, 
  ModuleAccessDeniedError, 
  UsageLimitExceededError, 
  InsufficientAICreditsError 
} from "@/services/entitlement.service";
import { auth } from "@/lib/auth";
import { ModuleName, LimitName } from "@prisma/client";
import crypto from "crypto";

type RouteHandler = (req: any, ...args: any[]) => Promise<NextResponse> | NextResponse | Promise<Response> | Response;

export function withEntitlements(
  handler: RouteHandler,
  options: { module?: ModuleName; limit?: LimitName }
): RouteHandler {
  return async (req: any, ...args: any[]) => {
    try {
      const session = await auth();
      if (session?.user?.id && session.user.role === "DOCTOR") {
        const requestId = crypto.randomUUID();
        const route = req.nextUrl?.pathname || req.url;
        const method = req.method;

        const context = {
          route,
          method,
          requestId,
          clinicId: (session.user as any).clinicId || undefined
        };

        if (options.module) {
          await EntitlementService.requireModule(session.user.id, options.module, context);
        }
        if (options.limit) {
          await EntitlementService.requireLimit(session.user.id, options.limit, context);
        }
      }
    } catch (error: any) {
      if (error instanceof ModuleAccessDeniedError) {
        return NextResponse.json({
          success: false,
          error: "MODULE_NOT_INCLUDED",
          message: error.message
        }, { status: error.status });
      } else if (error instanceof UsageLimitExceededError) {
        return NextResponse.json({
          success: false,
          error: "LIMIT_EXCEEDED",
          limit: error.limit,
          allowed: error.allowed,
          current: error.current
        }, { status: error.status });
      } else if (error instanceof InsufficientAICreditsError) {
        return NextResponse.json({
          success: false,
          error: "LIMIT_EXCEEDED",
          message: error.message
        }, { status: error.status });
      }
      
      console.error("[Entitlements] check failed unexpectedly:", error);
    }
    
    // Always call the original handler if no typed error was thrown
    return handler(req, ...args);
  };
}

/**
 * Inline entitlement guard for use inside named route handlers (GET, POST, etc.)
 * Returns a NextResponse (block) or null (pass).
 *
 * Usage:
 *   const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
 *   if (block) return block;
 */
export async function entitlementGuard(
  doctorId: string,
  req: Request,
  options: { module?: ModuleName; limit?: LimitName }
): Promise<NextResponse | null> {
  try {
    const requestId = crypto.randomUUID();
    let pathname = "/unknown";
    try { pathname = new URL(req.url).pathname; } catch {}
    const context = { route: pathname, method: req.method, requestId };

    if (options.module) {
      await EntitlementService.requireModule(doctorId, options.module, context);
    }
    if (options.limit) {
      await EntitlementService.requireLimit(doctorId, options.limit, context);
    }
    return null;
  } catch (error: any) {
    if (error instanceof ModuleAccessDeniedError) {
      return NextResponse.json({
        success: false,
        error: "MODULE_NOT_INCLUDED",
        message: error.message
      }, { status: 403 });
    }
    if (error instanceof UsageLimitExceededError) {
      return NextResponse.json({
        success: false,
        error: "LIMIT_EXCEEDED",
        limit: error.limit,
        allowed: error.allowed,
        current: error.current
      }, { status: 409 });
    }
    if (error instanceof InsufficientAICreditsError) {
      return NextResponse.json({
        success: false,
        error: "INSUFFICIENT_AI_CREDITS",
        message: error.message
      }, { status: 409 });
    }
    console.error("[EntitlementGuard] unexpected error:", error);
    return null; // fail open on unexpected errors — don't crash the route
  }
}
