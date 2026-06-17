/**
 * One-shot local search setup for `docusaurus start`:
 * - symlink search worker for webpack
 * - copy search index into static/ when a build artifact exists
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, "..");

const workerTarget = path.join(
  docsRoot,
  "node_modules/@easyops-cn/docusaurus-search-local/dist/client/client/theme/worker.js",
);
const workerLink = path.join(docsRoot, "src/search/worker.js");

if (fs.existsSync(workerTarget)) {
  try {
    fs.unlinkSync(workerLink);
  } catch {
    // not created yet
  }
  fs.symlinkSync(workerTarget, workerLink);
  console.log("[setup-local-search] linked search worker");
} else {
  console.warn("[setup-local-search] search plugin worker missing — run npm install in apps/docs");
}

const sync = spawnSync("node", ["scripts/sync-search-index.mjs"], {
  cwd: docsRoot,
  stdio: "inherit",
});

if (sync.status !== 0) {
  process.exit(sync.status ?? 1);
}
