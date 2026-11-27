import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /cashier and /accounting routes from unauthenticated access
  if (pathname.startsWith("/cashier") || pathname.startsWith("/accounting")) {
    const authCookie = request.cookies.get("tce_auth");
    if (!authCookie || authCookie.value !== "cashier@t-cloudeats.com") {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If visiting /login while already authenticated with cookie, redirect to /cashier
  if (pathname === "/login") {
    const authCookie = request.cookies.get("tce_auth");
    if (authCookie && authCookie.value === "cashier@t-cloudeats.com") {
      return NextResponse.redirect(new URL("/cashier", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cashier/:path*", "/accounting/:path*", "/login"],
};
