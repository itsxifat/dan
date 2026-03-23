import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLES = ["owner", "admin", "moderator", "viewer"];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // ── Admin route protection ──────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // Login and setup pages are always accessible
    if (pathname === "/admin/login" || pathname === "/admin/setup") return NextResponse.next();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    if (!ADMIN_ROLES.includes(token.role)) {
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
    }

    if (token.status && token.status !== "active") {
      return NextResponse.redirect(new URL("/admin/login?error=suspended", request.url));
    }

    return NextResponse.next();
  }

  // ── Existing protected routes (simple cookie check) ────────────────────
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/rooms");

  const sessionToken =
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  if (isProtected && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
