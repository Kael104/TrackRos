#!/usr/bin/env node
/**
 * Post-deploy security verification for Trackros.
 *
 * Usage:
 *   DEPLOY_URL=https://trackros.vercel.app node scripts/post-deploy-verify.mjs
 *   node scripts/post-deploy-verify.mjs https://trackros.vercel.app
 */

import fs from "node:fs";
import path from "node:path";

const STACK_TRACE_MARKERS = [
  /\n\s+at\s+/,
  /Error:\s.+\n\s+at\s+/,
  /\/Users\/[^\s<]+/,
  /[A-Z]:\\[^\s<]+/,
  /node_modules[\\/]/,
  /\.tsx?:\d+:\d+/,
];

const SECRET_PUBLIC_PREFIX =
  /NEXT_PUBLIC_(?:SUPABASE|GEMINI|API_KEY|SECRET|PASSWORD|SERVICE_ROLE)/i;

const RAW_KEY_PATTERNS = [
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, // JWT-like
  /AIza[0-9A-Za-z_-]{35}/, // Google API key prefix
];

const SCAN_IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "coverage",
]);

const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

function parseDeployUrl() {
  const arg = process.argv[2]?.trim();
  const env = process.env.DEPLOY_URL?.trim();
  const raw = arg || env;

  if (!raw) {
    console.error(
      "Missing deploy URL. Pass as CLI arg or set DEPLOY_URL, e.g. https://trackros.vercel.app",
    );
    process.exit(1);
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    console.error(`Invalid deploy URL: ${raw}`);
    process.exit(1);
  }

  if (url.protocol !== "https:") {
    console.error("Deploy URL must use https://");
    process.exit(1);
  }

  return url;
}

function record(results, name, passed, detail = "") {
  results.push({ name, passed, detail });
  const icon = passed ? "PASS" : "FAIL";
  const suffix = detail ? ` — ${detail}` : "";
  console.log(`[${icon}] ${name}${suffix}`);
}

function hasStackTraceLeak(body) {
  return STACK_TRACE_MARKERS.some((pattern) => pattern.test(body));
}

async function fetchWithRedirect(url, options = {}) {
  return fetch(url, { redirect: "manual", ...options });
}

async function checkHttpsRedirect(deployUrl, results) {
  const httpUrl = `http://${deployUrl.host}${deployUrl.pathname === "/" ? "" : deployUrl.pathname}`;

  try {
    const response = await fetchWithRedirect(httpUrl);
    const location = response.headers.get("location") ?? "";
    const redirectsToHttps =
      (response.status === 301 || response.status === 308) &&
      location.startsWith("https://");

    record(
      results,
      "HTTPS redirect (HTTP → HTTPS)",
      redirectsToHttps,
      redirectsToHttps
        ? `${response.status} → ${location}`
        : `status=${response.status}, location=${location || "(none)"}`,
    );
  } catch (error) {
    record(
      results,
      "HTTPS redirect (HTTP → HTTPS)",
      false,
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function checkHttpsResponse(deployUrl, results) {
  try {
    const response = await fetch(deployUrl.origin, { redirect: "follow" });
    record(
      results,
      "HTTPS reachable",
      response.ok || response.status === 401,
      `status=${response.status}`,
    );
    return response;
  } catch (error) {
    record(
      results,
      "HTTPS reachable",
      false,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

function checkSecurityHeaders(response, results) {
  const required = [
    ["Strict-Transport-Security", (value) => value.includes("max-age=")],
    ["X-Content-Type-Options", (value) => value.toLowerCase() === "nosniff"],
    ["X-Frame-Options", (value) => value.length > 0],
    ["Referrer-Policy", (value) => value.length > 0],
    ["Content-Security-Policy", (value) => value.includes("default-src")],
  ];

  for (const [header, validate] of required) {
    const value = response.headers.get(header) ?? "";
    const passed = validate(value);
    record(
      results,
      `Header: ${header}`,
      passed,
      passed ? value : value || "(missing)",
    );
  }
}

async function checkAuthGate(deployUrl, results) {
  try {
    const response = await fetchWithRedirect(`${deployUrl.origin}/`);
    const wwwAuth = response.headers.get("www-authenticate") ?? "";
    const passed =
      response.status === 401 && wwwAuth.toLowerCase().includes("basic");

    record(
      results,
      "Basic Auth gate (unauthenticated → 401)",
      passed,
      `status=${response.status}, www-authenticate=${wwwAuth || "(none)"}`,
    );
  } catch (error) {
    record(
      results,
      "Basic Auth gate (unauthenticated → 401)",
      false,
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function checkCorsAndCsrf(deployUrl, results) {
  const apiUrl = `${deployUrl.origin}/api/food/search?q=apple`;

  try {
    const corsResponse = await fetch(apiUrl, {
      headers: { Origin: "https://evil.example" },
      redirect: "manual",
    });

    const acao = corsResponse.headers.get("access-control-allow-origin") ?? "";
    const reflectsOrigin =
      acao === "*" || acao.toLowerCase() === "https://evil.example";

    record(
      results,
      "CORS: no reflected/wildcard ACAO",
      !reflectsOrigin,
      acao ? `access-control-allow-origin=${acao}` : "no ACAO header",
    );
  } catch (error) {
    record(
      results,
      "CORS: no reflected/wildcard ACAO",
      false,
      error instanceof Error ? error.message : String(error),
    );
  }

  try {
    const csrfResponse = await fetch(apiUrl, {
      headers: { "Sec-Fetch-Site": "cross-site" },
      redirect: "manual",
    });

    const passed = csrfResponse.status === 403;
    record(
      results,
      "CSRF: cross-site API request blocked (403)",
      passed,
      `status=${csrfResponse.status}`,
    );
  } catch (error) {
    record(
      results,
      "CSRF: cross-site API request blocked (403)",
      false,
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function checkGenericErrors(deployUrl, results) {
  const paths = [
    "/this-route-does-not-exist-trackros-verify",
    "/api/food/search?q=",
  ];

  for (const route of paths) {
    try {
      const response = await fetch(`${deployUrl.origin}${route}`, {
        redirect: "manual",
      });
      const body = await response.text();
      const leaked = hasStackTraceLeak(body);

      record(
        results,
        `Generic error page (${route})`,
        !leaked,
        leaked
          ? "response contains stack-trace markers"
          : `status=${response.status}, no stack trace`,
      );
    } catch (error) {
      record(
        results,
        `Generic error page (${route})`,
        false,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

function collectSourceFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SCAN_IGNORE_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, files);
      continue;
    }

    if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkEnvHygiene(results) {
  const root = process.cwd();
  const files = collectSourceFiles(root);
  const findings = [];

  for (const file of files) {
    const relative = path.relative(root, file);
    const content = fs.readFileSync(file, "utf8");

    if (SECRET_PUBLIC_PREFIX.test(content)) {
      findings.push(`${relative}: client-exposed secret prefix (NEXT_PUBLIC_*)`);
    }

    for (const pattern of RAW_KEY_PATTERNS) {
      if (pattern.test(content)) {
        findings.push(`${relative}: possible hardcoded API key/JWT`);
        break;
      }
    }
  }

  record(
    results,
    "Env hygiene: no client-exposed secret prefixes in source",
    findings.length === 0,
    findings.length === 0 ? `scanned ${files.length} files` : findings.join("; "),
  );
}

async function main() {
  const deployUrl = parseDeployUrl();
  const results = [];

  console.log(`\nTrackros post-deploy security verification`);
  console.log(`Target: ${deployUrl.origin}\n`);

  console.log("--- Remote checks ---");
  await checkHttpsRedirect(deployUrl, results);
  const httpsResponse = await checkHttpsResponse(deployUrl, results);

  if (httpsResponse) {
    checkSecurityHeaders(httpsResponse, results);
  }

  await checkAuthGate(deployUrl, results);
  await checkCorsAndCsrf(deployUrl, results);
  await checkGenericErrors(deployUrl, results);

  console.log("\n--- Local checks ---");
  checkEnvHygiene(results);

  const failed = results.filter((result) => !result.passed);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length > 0) {
    console.error("\nFailed checks:");
    for (const result of failed) {
      console.error(`  - ${result.name}${result.detail ? `: ${result.detail}` : ""}`);
    }
    process.exit(1);
  }

  console.log("\nAll post-deploy security checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
