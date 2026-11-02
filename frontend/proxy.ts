import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIES, ROLE_DASHBOARDS } from "@/lib/constants";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Session cookies are set at login and renewed on every token refresh; they hold
  // the refresh token's expiry and the user's role, not credentials.
  const sessionExp = request.cookies.get(AUTH_COOKIES.SESSION)?.value;
  const userRole = request.cookies.get(AUTH_COOKIES.ROLE)?.value;

  // No session, or it has expired: redirect to login
  if (!sessionExp || Date.now() >= parseInt(sessionExp)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Root path: redirect to role dashboard
  if (pathname === "/") {
    const dashboard = userRole
      ? ROLE_DASHBOARDS[userRole as keyof typeof ROLE_DASHBOARDS]
      : "/login";
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Role-based protection
  if (pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARDS[(userRole as keyof typeof ROLE_DASHBOARDS) ?? "student"] ?? "/login", request.url)
    );
  }
  if (pathname.startsWith("/teacher") && userRole !== "teacher") {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARDS[(userRole as keyof typeof ROLE_DASHBOARDS) ?? "student"] ?? "/login", request.url)
    );
  }
  if (pathname.startsWith("/student") && userRole !== "student") {
    return NextResponse.redirect(
      new URL(ROLE_DASHBOARDS[(userRole as keyof typeof ROLE_DASHBOARDS) ?? "student"] ?? "/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\.png|.*\.svg).*)",
  ],
};
