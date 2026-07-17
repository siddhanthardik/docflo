import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // Public routes that never need auth
  const publicRoutes = ["/", "/login", "/register", "/report", "/api", "/book"];
  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/") || pathname.startsWith("/api/"));

  // If user is authenticated and hitting the root "/" public landing page, redirect to their portal
  if (session?.user && pathname === "/") {
    const role = session.user.role;
    if (role === "SUPERADMIN" || role === "ADMIN" || role === "SALES" || role === "ACCOUNTS" || role === "MARKETING") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    // DOCTOR or staff → dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
