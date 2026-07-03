import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const LOG_ENDPOINT =
  "http://127.0.0.1:7480/ingest/76e8e424-2f5e-40c0-837a-cc42d78f81b4";
const SESSION_ID = "0ee88e";

function log(hypothesisId, message, data) {
  // #region agent log
  fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      runId: process.env.DEBUG_RUN_ID ?? "pre-fix",
      hypothesisId,
      location: "scripts/ensure-next-cache.mjs",
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

const root = process.cwd();
const nextDir = path.join(root, ".next");
const runtimePath = path.join(
  nextDir,
  "server",
  "chunks",
  "ssr",
  "[turbopack]_runtime.js",
);
const documentPath = path.join(nextDir, "server", "pages", "_document.js");

function findMixedArtifacts() {
  const staticPagesDir = path.join(nextDir, "static", "chunks", "pages");
  const staticChunksDir = path.join(nextDir, "static", "chunks");
  if (!fs.existsSync(staticPagesDir) || !fs.existsSync(staticChunksDir)) {
    return false;
  }

  const hasWebpackPages = fs
    .readdirSync(staticPagesDir)
    .some((file) => /^_(app|error|document)-[a-f0-9]+\.js$/.test(file));
  const hasTurbopackPages = fs
    .readdirSync(staticChunksDir)
    .some((file) => file.startsWith("turbopack-pages__"));

  return hasWebpackPages && hasTurbopackPages;
}

function isCorrupt() {
  if (!fs.existsSync(nextDir)) {
    return { corrupt: false, reason: "no-cache" };
  }

  if (fs.existsSync(documentPath)) {
    const documentSource = fs.readFileSync(documentPath, "utf8");
    const requiresTurbopack = documentSource.includes("[turbopack]_runtime.js");
    const runtimeExists = fs.existsSync(runtimePath);
    if (requiresTurbopack && !runtimeExists) {
      return { corrupt: true, reason: "missing-turbopack-runtime" };
    }
  }

  if (findMixedArtifacts()) {
    return { corrupt: true, reason: "mixed-build-artifacts" };
  }

  return { corrupt: false, reason: "ok" };
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, "127.0.0.1");
  });
}

const status = isCorrupt();
log("A", "cache health check", status);

const port3000InUse = await isPortInUse(3000);
log("F", "port 3000 availability", { port3000InUse });

if (port3000InUse) {
  console.warn(
    "[trackros] Port 3000 is already in use. Stop the old dev server first, or you may get a white screen on http://localhost:3000.",
  );
}

if (status.corrupt) {
  log("A", "removing corrupt .next cache", { reason: status.reason });
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.warn(
    `[trackros] Removed corrupt .next cache (${status.reason}). Starting fresh.`,
  );
} else {
  console.log(`[trackros] .next cache looks healthy (${status.reason}).`);
}
