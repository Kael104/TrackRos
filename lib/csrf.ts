import { NextRequest, NextResponse } from "next/server";

function requestHost(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    return forwardedHost.split(",")[0]?.trim() ?? request.nextUrl.host;
  }

  return request.nextUrl.host;
}

function originHost(originOrReferer: string): string | null {
  try {
    return new URL(originOrReferer).host;
  } catch {
    return null;
  }
}

/**
 * Returns true when the request appears to originate from the same site.
 * Blocks cross-site browser requests (CSRF) while allowing non-browser clients
 * that omit Origin/Referer/Sec-Fetch-Site headers.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  const host = requestHost(request);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    const originHostValue = originHost(origin);
    return originHostValue !== null && originHostValue === host;
  }

  if (referer) {
    const refererHostValue = originHost(referer);
    return refererHostValue !== null && refererHostValue === host;
  }

  return true;
}

export function csrfDenied(): NextResponse {
  return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
}
