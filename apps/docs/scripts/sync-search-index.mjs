import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, "..");
const buildDir = path.join(docsRoot, "build");
const staticDir = path.join(docsRoot, "static");

const indexCandidates = ["search-index.json", "search-index-docs.json"];

function copyIfExists(filename) {
  const from = path.join(buildDir, filename);
  const to = path.join(staticDir, filename);

  if (!fs.existsSync(from)) {
    return false;
  }

  fs.mkdirSync(staticDir, { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`[sync-search-index] copied ${filename} → static/`);
  return true;
}

let copied = false;

for (const filename of indexCandidates) {
  if (copyIfExists(filename)) {
    copied = true;
  }
}

if (!copied) {
  console.warn(
    "[sync-search-index] no search index in build/ — run `npm run build` once for local search in dev.",
  );
}
