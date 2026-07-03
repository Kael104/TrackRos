import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
      location: "scripts/debug-next-cache.mjs",
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
const ssrDir = path.join(nextDir, "server", "chunks", "ssr");

const runtimeExists = fs.existsSync(runtimePath);
const documentExists = fs.existsSync(documentPath);
let documentRequiresTurbopack = false;
if (documentExists) {
  const documentSource = fs.readFileSync(documentPath, "utf8");
  documentRequiresTurbopack = documentSource.includes("[turbopack]_runtime.js");
}

const ssrFiles = fs.existsSync(ssrDir) ? fs.readdirSync(ssrDir) : [];
const webpackAppChunk = path.join(
  nextDir,
  "static",
  "chunks",
  "pages",
  "_app-82835f42865034fa.js",
);
const turbopackAppChunk = path.join(
  nextDir,
  "static",
  "chunks",
  "turbopack-pages__app_6961bd01._.js",
);
const hasMixedArtifacts =
  fs.existsSync(webpackAppChunk) && fs.existsSync(turbopackAppChunk);

log("A", "turbopack runtime presence", {
  runtimeExists,
  documentExists,
  documentRequiresTurbopack,
  ssrFileCount: ssrFiles.length,
});

log("B", "mixed build artifact check", {
  hasMixedArtifacts,
  hasDevelopmentManifest: fs.existsSync(
    path.join(nextDir, "static", "development", "_buildManifest.js"),
  ),
  hasProductionPages: fs.existsSync(webpackAppChunk),
});

log("C", "project path info", {
  projectPath: root,
  pathHasSpaces: root.includes(" "),
  runtimePath,
});

let requireError = null;
if (documentExists && documentRequiresTurbopack && !runtimeExists) {
  try {
    await import(pathToFileURL(documentPath).href);
  } catch (error) {
    requireError = error instanceof Error ? error.message : String(error);
  }
}
log("D", "direct _document load when runtime missing", { requireError });

log("E", "environment hints", {
  port: process.env.PORT ?? "default",
  npmLifecycleEvent: process.env.npm_lifecycle_event ?? "unknown",
});

console.log(
  JSON.stringify(
    {
      runtimeExists,
      documentRequiresTurbopack,
      hasMixedArtifacts,
      requireError,
      corrupt:
        documentRequiresTurbopack && !runtimeExists
          ? "missing-turbopack-runtime"
          : hasMixedArtifacts
            ? "mixed-build-artifacts"
            : null,
    },
    null,
    2,
  ),
);
