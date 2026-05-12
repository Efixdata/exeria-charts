import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();

const packageDirs = [
  "packages/chart",
  "packages/react-chart-ui",
];

const workspaceManifests = collectWorkspaceManifests();
const releaseIssues = [];
const releaseWarnings = [];

const changesetsConfig = readJson(path.join(repoRoot, ".changeset", "config.json"));
if (changesetsConfig.access !== "public") {
  releaseIssues.push(
    `Workspace changesets access is ${JSON.stringify(
      changesetsConfig.access
    )}; public npm publishing should use \"public\".`
  );
}

for (const packageDir of packageDirs) {
  verifyPackage(packageDir);
}

if (releaseIssues.length > 0) {
  console.error("Release verification failed.\n");

  for (const issue of releaseIssues) {
    console.error(`- ${issue}`);
  }

  if (releaseWarnings.length > 0) {
    console.error("\nWarnings:");
    for (const warning of releaseWarnings) {
      console.error(`- ${warning}`);
    }
  }

  process.exit(1);
}

console.log("Release verification passed.");

if (releaseWarnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of releaseWarnings) {
    console.log(`- ${warning}`);
  }
}

function verifyPackage(packageDir) {
  const packageRoot = path.join(repoRoot, packageDir);
  const manifestPath = path.join(packageRoot, "package.json");
  const manifest = readJson(manifestPath);
  const packageLabel = manifest.name || packageDir;

  runPackageBuild(packageRoot, packageLabel);

  const requiredManifestFields = ["name", "version", "main", "module", "types", "exports", "files"];
  for (const fieldName of requiredManifestFields) {
    if (!(fieldName in manifest)) {
      releaseIssues.push(`${packageLabel}: missing required manifest field ${fieldName}.`);
    }
  }

  if (manifest.license === "UNLICENSED") {
    releaseIssues.push(`${packageLabel}: license is UNLICENSED.`);
  }

  if (manifest.publishConfig?.registry?.includes("npm.pkg.github.com")) {
    releaseIssues.push(`${packageLabel}: publishConfig.registry still targets GitHub Packages.`);
  }

  const repositoryUrl = manifest.repository?.url;
  if (typeof repositoryUrl === "string" && repositoryUrl.startsWith("ssh://git@github.com/")) {
    releaseWarnings.push(`${packageLabel}: repository URL uses SSH; public package metadata should prefer HTTPS.`);
  }

  const readmePath = path.join(packageRoot, "README.md");
  if (!existsSync(readmePath)) {
    releaseIssues.push(`${packageLabel}: README.md is missing.`);
  }

  const licensePath = path.join(packageRoot, "LICENSE");
  const rootLicensePath = path.join(repoRoot, "LICENSE");
  if (!existsSync(licensePath) && !existsSync(rootLicensePath)) {
    releaseIssues.push(`${packageLabel}: LICENSE is missing at both the package root and repository root.`);
  }

  if (!Array.isArray(manifest.files) || !manifest.files.includes("dist")) {
    releaseIssues.push(`${packageLabel}: files must include dist.`);
  }

  if (!Array.isArray(manifest.files) || !manifest.files.includes("README.md")) {
    releaseIssues.push(`${packageLabel}: files must include README.md.`);
  }

  if (Array.isArray(manifest.files) && !manifest.files.includes("LICENSE")) {
    releaseWarnings.push(`${packageLabel}: files does not include LICENSE.`);
  }

  assertReferencedFileExists(packageRoot, packageLabel, "main", manifest.main);
  assertReferencedFileExists(packageRoot, packageLabel, "module", manifest.module);
  assertReferencedFileExists(packageRoot, packageLabel, "types", manifest.types);

  const rootExport = manifest.exports?.["."];
  if (!rootExport || typeof rootExport !== "object") {
    releaseIssues.push(`${packageLabel}: exports[\".\"] is missing or invalid.`);
  } else {
    const exportFields = ["import", "require", "types"];
    for (const exportField of exportFields) {
      if (!(exportField in rootExport)) {
        releaseIssues.push(`${packageLabel}: exports[\".\"].${exportField} is missing.`);
        continue;
      }

      assertReferencedFileExists(packageRoot, packageLabel, `exports[\".\"].${exportField}`, rootExport[exportField]);
    }
  }

  verifyWorkspaceDependencies(packageLabel, manifest);
  verifyPackOutput(packageRoot, packageLabel);
}

function verifyWorkspaceDependencies(packageLabel, manifest) {
  for (const dependencyType of ["dependencies", "peerDependencies", "optionalDependencies"]) {
    const dependencies = manifest[dependencyType];

    if (!dependencies || typeof dependencies !== "object") {
      continue;
    }

    for (const [dependencyName, dependencyVersion] of Object.entries(dependencies)) {
      const workspaceManifest = workspaceManifests.get(dependencyName);

      if (!workspaceManifest) {
        continue;
      }

      if (workspaceManifest.private) {
        releaseIssues.push(
          `${packageLabel}: ${dependencyType} references private workspace package ${dependencyName}.`
        );
      }

      if (dependencyVersion === "*") {
        releaseIssues.push(
          `${packageLabel}: ${dependencyType} uses wildcard version for workspace dependency ${dependencyName}.`
        );
      }
    }
  }
}

function verifyPackOutput(packageRoot, packageLabel) {
  let rawPackOutput = "";

  try {
    rawPackOutput = execFileSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: packageRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    const stdout = error.stdout?.toString().trim();
    releaseIssues.push(
      `${packageLabel}: npm pack --dry-run failed${stderr || stdout ? ` (${stderr || stdout})` : "."}`
    );
    return;
  }

  const packEntries = JSON.parse(rawPackOutput);
  const packEntry = Array.isArray(packEntries) ? packEntries[0] : undefined;
  const packedFiles = new Set(packEntry?.files?.map((file) => file.path));

  for (const requiredPackedFile of ["package.json", "README.md"]) {
    if (!packedFiles.has(requiredPackedFile)) {
      releaseIssues.push(`${packageLabel}: packed tarball is missing ${requiredPackedFile}.`);
    }
  }

  if (!Array.from(packedFiles).some((filePath) => filePath === "LICENSE" || filePath.endsWith("/LICENSE"))) {
    releaseWarnings.push(`${packageLabel}: packed tarball does not include a LICENSE file.`);
  }

  const requiredDistFiles = [
    normalizePackPath(readPackageField(packageRoot, "main")),
    normalizePackPath(readPackageField(packageRoot, "module")),
    normalizePackPath(readPackageField(packageRoot, "types")),
  ];

  for (const requiredDistFile of requiredDistFiles) {
    if (!packedFiles.has(requiredDistFile)) {
      releaseIssues.push(`${packageLabel}: packed tarball is missing ${requiredDistFile}.`);
    }
  }
}

function runPackageBuild(packageRoot, packageLabel) {
  try {
    execFileSync("npm", ["run", "build"], {
      cwd: packageRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    const stdout = error.stdout?.toString().trim();
    releaseIssues.push(
      `${packageLabel}: npm run build failed${stderr || stdout ? ` (${stderr || stdout})` : "."}`
    );
  }
}

function readPackageField(packageRoot, fieldName) {
  const manifest = readJson(path.join(packageRoot, "package.json"));
  return manifest[fieldName];
}

function normalizePackPath(filePath) {
  return String(filePath).replace(/^\.\//, "");
}

function assertReferencedFileExists(packageRoot, packageLabel, fieldName, filePath) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    releaseIssues.push(`${packageLabel}: ${fieldName} must be a non-empty string.`);
    return;
  }

  const resolvedPath = path.join(packageRoot, filePath.replace(/^\.\//, ""));
  if (!existsSync(resolvedPath)) {
    releaseIssues.push(`${packageLabel}: ${fieldName} points to missing file ${filePath}.`);
  }
}

function collectWorkspaceManifests() {
  const manifests = new Map();
  const workspaceRoots = [path.join(repoRoot, "packages"), path.join(repoRoot, "apps")];

  for (const workspaceRoot of workspaceRoots) {
    if (!existsSync(workspaceRoot)) {
      continue;
    }

    for (const childName of execFileSync("find", [workspaceRoot, "-maxdepth", "2", "-name", "package.json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean)) {
      const manifest = readJson(childName);
      if (typeof manifest.name === "string") {
        manifests.set(manifest.name, {
          private: Boolean(manifest.private),
          path: childName,
        });
      }
    }
  }

  return manifests;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}