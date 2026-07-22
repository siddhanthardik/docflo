import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isPlatformRole } from "@/lib/permissions";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  
  // 1. Check Guest Routes
  const isAuthRoute = pathname.startsWith("/login") || 
                      pathname.startsWith("/register") || 
                      pathname.startsWith("/forgot-password") || 
                      pathname.startsWith("/reset-password");
  
  if (isAuthRoute) {
    if (isLoggedIn) {
      // Redirect authenticated users away from guest pages
      const role = req.auth?.user?.role;
      if (role && isPlatformRole(role)) {
        return NextResponse.redirect(new URL("/admin", req.nextUrl));
      }
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  // 2. Resolve root "/" behaviour
  if (pathname === "/") {
    if (isLoggedIn) {
      const role = req.auth?.user?.role;
      if (role && isPlatformRole(role)) {
        return NextResponse.redirect(new URL("/admin", req.nextUrl));
      }
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    // Allow public landing page
    return NextResponse.next();
  }

  // 3. Protect Application Routes
  const isProtectedRoute = pathname.startsWith("/dashboard") || 
                           pathname.startsWith("/admin") || 
                           pathname.startsWith("/settings");

  if (isProtectedRoute && !isLoggedIn) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.nextUrl)
    );
  }

  // 4. Role-Based Authorization
  if (isLoggedIn && pathname.startsWith("/admin")) {
    const role = req.auth?.user?.role;
    if (role && !isPlatformRole(role)) {
      // Clinic/Staff users cannot access /admin
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  if (isLoggedIn && pathname.startsWith("/dashboard")) {
    const role = req.auth?.user?.role;
    if (role && isPlatformRole(role)) {
      // Platform users should not access clinic dashboard directly
      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
  }

  // 5. Email Verification Grace Period (7 days)
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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
