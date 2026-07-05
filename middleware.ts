import { NextRequest, NextResponse } from "next/server";

const REALM = 'Basic realm="Trackros"';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": REALM,
    },
  });
}

function parseBasicAuth(header: string): { user: string; password: string } | null {
  if (!header.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    if (separator === -1) {
      return null;
    }

    return {
      user: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const expectedUser = process.env.APP_BASIC_AUTH_USER;
  const expectedPassword = process.env.APP_BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }

    return new NextResponse("Basic auth is not configured", { status: 500 });
  }

  const credentials = parseBasicAuth(request.headers.get("authorization") ?? "");
  const authorized =
    !!credentials &&
    timingSafeEqual(credentials.user, expectedUser) &&
    timingSafeEqual(credentials.password, expectedPassword);

  if (!authorized) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
