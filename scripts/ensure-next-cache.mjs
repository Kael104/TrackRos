import fs from "node:fs";
import net from "node:net";
import path from "node:path";

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

  if (fs.existsSync(path.join(nextDir, "BUILD_ID"))) {
    return { corrupt: true, reason: "production-build-cache" };
  }

  const pagesAppManifest = path.join(
    nextDir,
    "server",
    "pages",
    "_app",
    "build-manifest.json",
  );
  const pagesDir = path.join(nextDir, "server", "pages");
  if (fs.existsSync(pagesDir) && !fs.existsSync(pagesAppManifest)) {
    return { corrupt: true, reason: "missing-build-manifest" };
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
const port3000InUse = await isPortInUse(3000);

if (port3000InUse) {
  console.warn(
    "[trackros] Port 3000 is already in use. Stop the old dev server first, or you may get a white screen on http://localhost:3000.",
  );
}

if (status.corrupt) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.warn(
    `[trackros] Removed corrupt .next cache (${status.reason}). Starting fresh.`,
  );
} else {
  console.log(`[trackros] .next cache looks healthy (${status.reason}).`);
}
