import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_KEYS, ROLE_DASHBOARDS } from "@/lib/constants";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for access token in cookie (set by login page after localStorage write)
  // We use a cookie for SSR-compatible auth check
  const accessToken = request.cookies.get(TOKEN_KEYS.ACCESS)?.value;
  const userRole = request.cookies.get("inspired_minds_role")?.value;
  const tokenExp = request.cookies.get(`${TOKEN_KEYS.ACCESS}_exp`)?.value;

  // No token: redirect to login
  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Expired token: redirect to login
  if (tokenExp && Date.now() >= parseInt(tokenExp)) {
    const loginUrl = new URL("/login", request.url);
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
