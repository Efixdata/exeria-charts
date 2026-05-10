import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const baselinePath = path.join(repoRoot, "scripts", "ts-suppressions-baseline.json");
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

const EXCLUDED_DIRS = new Set([
  "node_modules",
  "dist",
  ".next",
  ".turbo",
  ".git",
  "coverage",
  "build",
]);

const TARGET_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);
const roots = ["apps", "packages"];
const markerPattern = /@ts-ignore|@ts-nocheck/g;

function walk(relDir, output) {
  const absDir = path.join(repoRoot, relDir);
  if (!fs.existsSync(absDir)) return;

  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walk(relPath, output);
      continue;
    }

    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (!TARGET_EXT.has(ext)) continue;

    const absPath = path.join(repoRoot, relPath);
    const content = fs.readFileSync(absPath, "utf8");
    const matches = content.match(markerPattern);
    if (matches && matches.length > 0) {
      output[relPath.replace(/\\/g, "/")] = matches.length;
    }
  }
}

const actual = {};
for (const root of roots) {
  walk(root, actual);
}

const failures = [];

for (const [file, count] of Object.entries(actual)) {
  const allowed = baseline[file] ?? 0;
  if (count > allowed) {
    failures.push(`${file}: found ${count}, allowed ${allowed}`);
  }
}

if (failures.length > 0) {
  console.error("New TypeScript suppression markers detected. Please remove or explicitly rebaseline.");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("TypeScript suppression guard passed.");
