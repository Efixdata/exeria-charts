import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, "..");

const workerTarget = path.join(
  docsRoot,
  "node_modules/@easyops-cn/docusaurus-search-local/dist/client/client/theme/worker.js",
);
const workerLink = path.join(docsRoot, "src/search/worker.js");

if (!fs.existsSync(workerTarget)) {
  console.warn("[ensure-search-worker-link] search plugin worker not found — run npm install in apps/docs");
  process.exit(0);
}

try {
  const existing = fs.lstatSync(workerLink);
  if (existing.isSymbolicLink() || existing.isFile()) {
    fs.unlinkSync(workerLink);
  }
} catch {
  // link does not exist yet
}

fs.symlinkSync(workerTarget, workerLink);
console.log("[ensure-search-worker-link] linked src/search/worker.js");
