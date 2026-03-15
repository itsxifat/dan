import { NextResponse } from "next/server";

// 1. The function MUST now be named 'proxy' instead of 'middleware'
export function proxy(request) {
  const path = request.nextUrl.pathname;

  // 2. Define the routes that strictly require an Admin login
  const isAdminRoute = path.startsWith('/dashboard') || 
                       path.startsWith('/bookings') || 
                       path.startsWith('/rooms');

  // 3. Check for the NextAuth session token in the cookies
  const token = request.cookies.get("__Secure-next-auth.session-token")?.value || 
                request.cookies.get("next-auth.session-token")?.value;

  // 4. The Gatekeeper Logic
  if (isAdminRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// 5. Configure the matcher to skip static files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};