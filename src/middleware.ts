import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("lizto_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedPath = pathname.startsWith("/dashboard") || pathname.startsWith("/profile");
  const isAuthPath = pathname === "/login" || pathname === "/register";

  if (isProtectedPath && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/login", "/register"],
};
