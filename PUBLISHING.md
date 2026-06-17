# Publishing to npm

This monorepo publishes **16 public packages** under the [`@efixdata`](https://www.npmjs.com/org/efixdata) scope.

| Package | Version (current) | License |
| --- | --- | --- |
| `@efixdata/exeria-chart` | see `packages/chart/package.json` | AGPL-3.0-or-later |
| `@efixdata/exeria-chart-ui-react` | see `packages/react-chart-ui/package.json` | AGPL-3.0-or-later |
| `@efixdata/connector-binance` | 1.0.0 | MIT |
| `@efixdata/connector-bybit` | 1.0.0 | MIT |
| `@efixdata/connector-okx` | 1.0.0 | MIT |
| `@efixdata/connector-kraken` | 1.0.0 | MIT |
| `@efixdata/connector-kucoin` | 1.0.0 | MIT |
| `@efixdata/connector-coinbase` | 1.0.0 | MIT |
| `@efixdata/connector-gate` | 1.0.0 | MIT |
| `@efixdata/connector-ccxt` | 1.0.0 | MIT |
| `@efixdata/connector-coingecko` | 1.0.0 | MIT |
| `@efixdata/connector-twelve-data` | 1.0.0 | EULA |
| `@efixdata/connector-finage` | 1.0.0 | EULA |
| `@efixdata/connector-finnhub` | 1.0.0 | EULA |
| `@efixdata/connector-eodhd` | 1.0.0 | EULA |
| `@efixdata/connector-massive` | 1.0.0 | EULA |

Licensing details: [`LICENSING.md`](LICENSING.md).

## Prerequisites

1. **npm organization** — `@efixdata` must exist and your account must be allowed to publish scoped packages.
2. **Automation token** — create an npm [granular access token](https://docs.npmjs.com/creating-and-viewing-access-tokens) with **Publish** permission for the `@efixdata` scope (type: *Automation* for CI).
3. **GitHub secret** — add `NPM_TOKEN` to the repository secrets (Settings → Secrets and variables → Actions).
4. **Built artifacts** — `npm run verify:release` builds every package and validates `npm pack --dry-run` output.

## Pre-publish checklist

Run locally before the first publish (or before merging a release PR):

```bash
npm ci
npm run verify:release          # build + pack contract for all 16 packages
npm run test:mobile             # chart + react-chart-ui unit tests
npm run verify:starters         # generate starter ZIPs and type-check against tarballs
```

Optional but recommended:

```bash
npm --prefix apps/docs run build   # Docusaurus site (broken links throw)
```

CI (`.github/workflows/ci.yml`) runs `verify:release` and tests on every PR and `main` push.

## First publish

Versions are already set in each `package.json`. Changesets is configured (`.changeset/config.json`, `access: public`).

### Option A — GitHub Actions (recommended)

1. Add `NPM_TOKEN` secret.
2. Merge to `main`.
3. The **Release** workflow (`.github/workflows/release.yml`) runs `changesets/action`:
   - If there are pending `.changeset/*.md` files → opens a **Version Packages** PR.
   - If there are **no** pending changesets → runs `npm run release` (`turbo build` + `changeset publish`) and publishes any package version not yet on npm.

For a **controlled first publish**, either:

- Push `main` once with no changeset files (publishes current versions), or
- Add a changeset first (`npm run changeset`), merge the Version PR, then let publish run.

### Option B — Manual publish

```bash
npm ci
npm run build:packages
npm run release
```

You must be logged in (`npm login`) with publish rights to `@efixdata`.

To publish a single package:

```bash
cd packages/chart
npm publish --access public
```

## Subsequent releases

1. Make your changes.
2. Add a changeset describing the bump:

   ```bash
   npm run changeset
   ```

3. Commit the new file under `.changeset/`.
4. Merge to `main` → Release workflow opens **Version Packages** PR.
5. Merge that PR → packages publish automatically.

Root scripts:

| Script | Purpose |
| --- | --- |
| `npm run changeset` | Create a changeset interactively |
| `npm run version-packages` | Apply changesets and bump versions |
| `npm run release` | Build packages + `changeset publish` |

## Docs site (`exeria.dev`)

The documentation app lives in `apps/docs`. Deploy it separately (static host, CDN, or your CI) after packages are on npm so install snippets resolve:

```bash
npm --prefix apps/docs run build
```

Site URL is configured in `apps/docs/docusaurus.config.ts` (`url: https://exeria.dev`).

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `402 Payment Required` / scope error | Token lacks publish access to `@efixdata` |
| `403 Forbidden` on publish | Package name already owned by another org/user |
| `verify:release` fails on `files` | `dist/` missing — run `npm run build:packages` |
| Starter ZIP typecheck fails | Regenerate after changing `@efixdata/*` APIs; run `npm run verify:starters` |
