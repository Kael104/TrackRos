import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { isSameOriginRequest } from "@/lib/csrf";

function makeRequest(
  url: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(new URL(url), { headers });
}

describe("isSameOriginRequest", () => {
  it("allows same-origin requests with matching Origin", () => {
    const request = makeRequest("http://localhost:3000/api/food/search?q=apple", {
      "sec-fetch-site": "same-origin",
      origin: "http://localhost:3000",
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("allows requests with no origin headers (non-browser clients)", () => {
    const request = makeRequest("http://localhost:3000/api/food/search?q=apple");

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("blocks Sec-Fetch-Site: cross-site", () => {
    const request = makeRequest("http://localhost:3000/api/food/search?q=apple", {
      "sec-fetch-site": "cross-site",
      origin: "http://localhost:3000",
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("blocks mismatched Origin host", () => {
    const request = makeRequest("http://localhost:3000/api/food/search?q=apple", {
      origin: "https://evil.com",
    });

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("allows requests when Referer matches host and Origin is absent", () => {
    const request = makeRequest("http://localhost:3000/api/food/suggest?q=ap", {
      referer: "http://localhost:3000/log",
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("respects x-forwarded-host when comparing Origin", () => {
    const request = makeRequest("http://localhost:3000/api/food/search?q=apple", {
      "x-forwarded-host": "trackros.example.com",
      origin: "https://trackros.example.com",
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });
});
