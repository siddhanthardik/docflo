import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isPlatformRole } from "@/lib/permissions";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "admin",
  "app",
  "mail",
  "blog",
  "support",
  "billing",
  "webhook",
  "auth",
  "team",
  "affiliate",
  "affiliates",
  "status",
  "gyrex",
  "getgyrex",
  "help",
  "pricing",
  "contact",
  "terms",
  "privacy",
  "refund",
  "about",
  "login",
  "register",
  "signup",
  "dashboard",
  "sites",
  "public",
  "cdn",
  "staging",
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const currentHost = hostname.replace(/:\d+$/, "").toLowerCase();

  // ──────────────────────────────────────────────────────────────────────────
  // 1. MULTI-TENANT SUBDOMAIN & CUSTOM DOMAIN REWRITING
  // ──────────────────────────────────────────────────────────────────────────
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(currentHost)) {
    let subdomain: string | null = null;

    if (currentHost.includes("localhost")) {
      const parts = currentHost.split(".");
      if (parts.length > 1 && parts[0] !== "localhost") {
        subdomain = parts[0];
      }
    } else if (currentHost.endsWith("gyrex.in")) {
      const base = "gyrex.in";
      const sub = currentHost.slice(0, -(base.length + 1));
      if (sub && sub !== "www") {
        subdomain = sub;
      }
    } else if (!currentHost.includes("gyrex.in") && !currentHost.includes("localhost")) {
      // Potential custom domain (e.g. www.drvinaykumar.com)
      if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/uploads") ||
        pathname.includes(".")
      ) {
        return NextResponse.next();
      }

      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-custom-domain", currentHost);
      return NextResponse.rewrite(new URL(`/sites/_custom/${encodeURIComponent(currentHost)}${pathname === "/" ? "" : pathname}`, req.url), {
        request: { headers: requestHeaders },
      });
    }

    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      // Bypass internal Next assets, uploads, and APIs
      if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/uploads") ||
        pathname.includes(".")
      ) {
        return NextResponse.next();
      }

      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-subdomain", subdomain);

      const rewriteUrl = new URL(`/sites/${encodeURIComponent(subdomain)}${pathname === "/" ? "" : pathname}`, req.url);
      return NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. MAIN PLATFORM AUTH & ROLE ROUTING
  // ──────────────────────────────────────────────────────────────────────────
  const isLoggedIn = !!(req.auth && req.auth.user && (req.auth.user as any).id);

  // Guest Routes
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (isAuthRoute) {
    if (isLoggedIn) {
      const role = req.auth?.user?.role;
      if (role && isPlatformRole(role)) {
        return NextResponse.redirect(new URL("/admin", req.nextUrl));
      }
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Resolve root "/" behaviour
  if (pathname === "/") {
    if (isLoggedIn) {
      const role = req.auth?.user?.role;
      if (role && isPlatformRole(role)) {
        return NextResponse.redirect(new URL("/admin", req.nextUrl));
      }
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Protect Application Routes
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/website") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/whatsapp") ||
    pathname.startsWith("/patients") ||
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/billing");

  if (isProtectedRoute && !isLoggedIn) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.nextUrl));
  }

  // Role-Based Authorization
  if (isLoggedIn && pathname.startsWith("/admin")) {
    const role = req.auth?.user?.role;
    if (role && !isPlatformRole(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  if (isLoggedIn && pathname.startsWith("/dashboard")) {
    const role = req.auth?.user?.role;
    if (role && isPlatformRole(role)) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
  }

  // Email Verification Grace Period (7 days)
  if (isProtectedRoute && isLoggedIn && !pathname.startsWith("/verify-email/pending")) {
    const user = req.auth?.user as any;
    if (user && !user.emailVerified && user.createdAt) {
      const createdDate = new Date(user.createdAt);
      const gracePeriodMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - createdDate.getTime() > gracePeriodMs) {
        return NextResponse.redirect(new URL("/verify-email/pending", req.nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
