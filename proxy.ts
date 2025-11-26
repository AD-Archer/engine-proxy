import { NextResponse, type NextRequest } from "next/server";

import {
  getRedirectParamName,
  getSessionCookieName,
  hasValidSession,
  sanitizeRedirectPath,
} from "@/lib/auth";

const protectedPrefixes = ["/admin", "/api/shortcuts"] as const;
const adminSigninPath = "/admin/sign-in";

const buildSignInRedirect = (request: NextRequest) => {
  const redirectUrl = new URL(adminSigninPath, request.url);
  const normalized = sanitizeRedirectPath(
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  if (normalized && normalized !== adminSigninPath) {
    redirectUrl.searchParams.set(getRedirectParamName(), normalized);
  }

  return redirectUrl;
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresAuth = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isSignInRoute = pathname.startsWith(adminSigninPath);

  if (!requiresAuth || isSignInRoute) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Admin credentials are not configured", {
      status: 500,
    });
  }

  const sessionCookie = request.cookies.get(getSessionCookieName())?.value;
  const sessionIsValid = await hasValidSession(
    sessionCookie,
    username,
    password
  );

  if (sessionIsValid) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      {
        status: 401,
      }
    );
  }

  const redirectUrl = buildSignInRedirect(request);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/shortcuts/:path*"],
};
