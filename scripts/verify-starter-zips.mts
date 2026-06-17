/**
 * Generate every docs-site starter ZIP, install @efixdata/* from local tarballs,
 * and run `tsc --noEmit` to catch broken download templates before release.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildStarterZipEntries } from "../apps/docs/src/components/CryptoTerminalApp/starterTemplateExport.ts";
import { buildFintechStarterZipEntries } from "../apps/docs/src/components/FintechWealthApp/fintechStarterTemplateExport.ts";
import { buildForexStarterZipEntries } from "../apps/docs/src/components/ForexOpportunityApp/forexStarterTemplateExport.ts";
import { buildMarketNewsZipEntries } from "../apps/docs/src/components/MarketNewsApp/marketNewsStarterExport.ts";
import { buildQuantStarterZipEntries } from "../apps/docs/src/components/QuantAnalyticsApp/quantStarterTemplateExport.ts";
import { buildSignalStarterZipEntries } from "../apps/docs/src/components/SignalTerminalApp/signalTerminalStarterTemplateExport.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const publishablePackages = [
  "packages/chart",
  "packages/react-chart-ui",
  "packages/adapter-binance",
  "packages/adapter-bybit",
  "packages/adapter-okx",
  "packages/adapter-kraken",
  "packages/adapter-kucoin",
  "packages/adapter-coinbase",
  "packages/adapter-gate",
  "packages/adapter-ccxt",
  "packages/adapter-coingecko",
  "packages/adapter-twelve-data",
  "packages/adapter-finage",
  "packages/adapter-finnhub",
  "packages/adapter-eodhd",
  "packages/adapter-massive",
];

type ZipEntry = { path: string; content: string };

type StarterCase = {
  id: string;
  getEntries: () => ZipEntry[] | Promise<ZipEntry[]>;
};

const starters: StarterCase[] = [
  {
    id: "crypto-terminal",
    getEntries: () => buildStarterZipEntries("BTCUSDT", "hour"),
  },
  {
    id: "market-news",
    getEntries: () => buildMarketNewsZipEntries(),
  },
  {
    id: "quant-analytics",
    getEntries: () => buildQuantStarterZipEntries(),
  },
  {
    id: "forex-platforms",
    getEntries: () => buildForexStarterZipEntries(),
  },
  {
    id: "fintech-integration",
    getEntries: () => buildFintechStarterZipEntries("1m", "equities"),
  },
  {
    id: "screener-signals",
    getEntries: () => buildSignalStarterZipEntries("BTCUSDT", "hour"),
  },
];

function packWorkspacePackages(tarballDir: string): Map<string, string> {
  const tarballByPackageName = new Map<string, string>();

  for (const packageDir of publishablePackages) {
    const packageRoot = path.join(repoRoot, packageDir);
    const manifest = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8")) as {
      name: string;
    };

    execFileSync("npm", ["run", "build"], { cwd: packageRoot, stdio: "inherit" });

    const packOutput = execFileSync("npm", ["pack", "--pack-destination", tarballDir], {
      cwd: packageRoot,
      encoding: "utf8",
    }).trim();

    const tarballName = packOutput.split("\n").pop()?.trim();
    if (!tarballName) {
      throw new Error(`npm pack produced no output for ${manifest.name}`);
    }

    tarballByPackageName.set(manifest.name, path.join(tarballDir, tarballName));
  }

  return tarballByPackageName;
}

function writeStarterProject(projectDir: string, entries: ZipEntry[]) {
  mkdirSync(projectDir, { recursive: true });

  for (const entry of entries) {
    const targetPath = path.join(projectDir, entry.path);
    mkdirSync(path.dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, entry.content, "utf8");
  }
}

function patchDependenciesToTarballs(
  projectDir: string,
  tarballByPackageName: Map<string, string>,
) {
  const manifestPath = path.join(projectDir, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  for (const dependencyType of ["dependencies", "devDependencies"] as const) {
    const deps = manifest[dependencyType];
    if (!deps) continue;

    for (const dependencyName of Object.keys(deps)) {
      const tarballPath = tarballByPackageName.get(dependencyName);
      if (tarballPath) {
        deps[dependencyName] = `file:${tarballPath}`;
      }
    }
  }

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function typecheckStarter(projectDir: string, starterId: string) {
  execFileSync("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: projectDir,
    stdio: "inherit",
  });

  execFileSync("npx", ["tsc", "-p", "tsconfig.json", "--noEmit"], {
    cwd: projectDir,
    stdio: "inherit",
  });

  console.log(`✓ ${starterId}`);
}

async function main() {
  const workDir = mkdtempSync(path.join(tmpdir(), "exeria-starter-verify-"));
  const tarballDir = path.join(workDir, "tarballs");
  mkdirSync(tarballDir, { recursive: true });

  console.log("Packing workspace packages…");
  const tarballByPackageName = packWorkspacePackages(tarballDir);

  const failures: Array<{ id: string; error: unknown }> = [];

  for (const starter of starters) {
    const projectDir = path.join(workDir, starter.id);
    console.log(`\nVerifying starter: ${starter.id}`);

    try {
      const entries = await starter.getEntries();
      writeStarterProject(projectDir, entries);
      patchDependenciesToTarballs(projectDir, tarballByPackageName);
      typecheckStarter(projectDir, starter.id);
    } catch (error) {
      failures.push({ id: starter.id, error });
      console.error(`✗ ${starter.id}`);
    }
  }

  if (process.env.KEEP_STARTER_VERIFY === "1") {
    console.log(`\nStarter verify artifacts kept at ${workDir}`);
  } else {
    rmSync(workDir, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error("\nStarter verification failed:\n");
    for (const failure of failures) {
      console.error(`- ${failure.id}:`, failure.error);
    }
    process.exit(1);
  }

  console.log(`\nAll ${starters.length} starter projects passed typecheck.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
