import { NextResponse } from "next/server";

/**
 * Forces the browser to drop cached HTTP Basic credentials by returning 401
 * with a WWW-Authenticate challenge. Navigate here to "log out".
 *
 * CSRF note: this is intentionally GET (navigation-based logout). A cross-site
 * request could force logout, but impact is low (annoyance only, no data change).
 */
export function GET() {
  return new NextResponse("Logged out", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Trackros"',
    },
  });
}
