import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const adapterRoot = path.join(repoRoot, "packages/adapter-eodhd");
const adapterBundle = path.join(adapterRoot, "dist/index.js");

if (existsSync(adapterBundle)) {
  process.exit(0);
}

console.log(
  "[ensure-adapter-eodhd-dist] Building @efixdata/connector-eodhd (dist is missing)...",
);

const result = spawnSync("npm", ["run", "build"], {
  cwd: adapterRoot,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
