import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Admin paths that do NOT require authentication
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/setup"];

// Rate-limit store (in-memory, resets on cold start — use Redis for production)
const rateLimitMap = new Map();
const UPLOAD_WINDOW_MS = 60_000; // 1 minute
const UPLOAD_MAX       = 30;     // max 30 uploads per window per IP

function rateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > UPLOAD_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true; // allowed
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= UPLOAD_MAX;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // ── Security headers on every response ─────────────────────────────────────
  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };

  // ── Protect /api/upload ─────────────────────────────────────────────────────
  if (pathname === "/api/upload") {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    if (!rateLimit(ip)) {
      return new NextResponse(JSON.stringify({ error: "Too many uploads. Try again later." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      });
    }
  }

  // ── Protect all /admin/* routes ─────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const isPublic = PUBLIC_ADMIN_PATHS.some(p => pathname.startsWith(p));
    if (!isPublic) {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

      if (!token) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("callbackUrl", encodeURIComponent(pathname));
        return NextResponse.redirect(loginUrl);
      }

      // Block banned or suspended users at the edge
      if (token.status === "banned" || token.status === "suspended") {
        const res = NextResponse.redirect(
          new URL("/admin/login?error=AccountSuspended", request.url)
        );
        res.cookies.delete("next-auth.session-token");
        res.cookies.delete("__Secure-next-auth.session-token");
        return res;
      }

      // Block users with no admin role
      const adminRoles = ["owner", "admin", "moderator", "viewer"];
      if (!adminRoles.includes(token.role)) {
        return NextResponse.redirect(new URL("/admin/login?error=AccessDenied", request.url));
      }
    }
  }

  // ── Continue with security headers applied ──────────────────────────────────
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, val]) => response.headers.set(key, val));
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/upload",
    // Exclude static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|uploads/).*)",
  ],
};
