import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chartRoot = path.join(repoRoot, "packages/chart");
const chartBundle = path.join(chartRoot, "dist/index.esm.js");

if (existsSync(chartBundle)) {
  process.exit(0);
}

console.log("[ensure-chart-dist] Building @efixdata/exeria-chart (dist is missing)...");

const result = spawnSync("npm", ["run", "build"], {
  cwd: chartRoot,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
