import { NextRequest, NextResponse } from "next/server";

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
]);

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Extract base domain and subdomain
  // Handles gyrex.in, *.gyrex.in, localhost:3000, *.localhost:3000
  const currentHost = hostname.replace(/:\d+$/, "").toLowerCase(); // strip port
  
  // Exclude raw IPs or direct system hostnames
  if (/^\d+\.\d+\.\d+\.\d+$/.test(currentHost)) {
    return NextResponse.next();
  }

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
  } else {
    // Potential custom domain (e.g. drsharma.com)
    if (!currentHost.includes("gyrex.in") && !currentHost.includes("localhost")) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-custom-domain", currentHost);
      return NextResponse.rewrite(new URL(`/sites/_custom/${encodeURIComponent(currentHost)}${url.pathname}`, req.url), {
        request: { headers: requestHeaders },
      });
    }
  }

  // If a valid clinic subdomain is detected and not in reserved list
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    const pathname = url.pathname;
    
    // Bypass internal next assets, uploads, and APIs
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

    // Rewrite to /sites/[subdomain]
    const rewriteUrl = new URL(`/sites/${encodeURIComponent(subdomain)}${pathname === "/" ? "" : pathname}`, req.url);
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded static media)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
