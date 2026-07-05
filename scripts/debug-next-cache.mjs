import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

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

let requireError = null;
if (documentExists && documentRequiresTurbopack && !runtimeExists) {
  try {
    await import(pathToFileURL(documentPath).href);
  } catch (error) {
    requireError = error instanceof Error ? error.message : String(error);
  }
}

console.log(
  JSON.stringify(
    {
      runtimeExists,
      documentRequiresTurbopack,
      ssrFileCount: ssrFiles.length,
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
