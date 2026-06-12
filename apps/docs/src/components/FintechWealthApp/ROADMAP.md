# Nova Wealth demo — 5-step roadmap

Implementation plan covering the product review, developer experience, and wealth-UX ideas. Work through each phase before starting the next.

---

## Phase 1 — Market realism & portfolio model

**Goal:** Demo feels like a real EU wealth app, not a crypto chart in disguise.

- [x] Crypto / Equities toggle with separate asset presets
- [x] Static mock CSV historical data for equity symbols (AAPL, VWCE, SPY, MSFT, NVDA, GOOGL)
- [x] Portfolio value = sum(positions × last price), not a fixed mock base
- [x] Cash row (“Available to invest” + invested breakdown)
- [x] Correct symbol formatting per market (ticker vs pair)
- [x] Period slicing aligned with equity daily bars

**Exit criteria:** Switching markets reloads chart, holdings, and watchlist; equity mode works offline from `/data/fintech-equity/*.csv`; portfolio total = cash + Σ(qty × price).

**Status: Phase 1 complete.**

---

## Phase 2 — Developer starter parity

**Goal:** What you see in the live demo is what you get when you copy or download.

- [x] Developer content on `/starters/fintech-integration` only (no Source button in live app)
- [x] Getting started steps + What you get (crypto-terminal pattern)
- [x] Downloadable ZIP with `src/App.tsx`, equity CSV fixtures, snippets/
- [x] Integration map / file layout snippet
- [x] StackBlitz / GitHub template links + run locally commands
- [ ] Starter snippets mirror full `fintechCompareChartSetup.ts` (multi-overlay, focus, chrome)

**Exit criteria:** A developer can go from landing page to running app in under 5 minutes without reading the monorepo.

**Status: Phase 2 largely complete** — ZIP + docs page done; full chart-setup parity optional follow-up.

---

## Phase 3 — Chart depth & trust UX

**Goal:** Charts answer “how am I doing vs the market?” and fit both neo-broker and bank brands.

- [x] Benchmark overlay (SPY equities / BTC market crypto as dashed comparison line)
- [x] Light / dark theme toggle (neo-broker vs private banking)
- [x] Hide balance (toggle on portfolio value + cash row)
- [x] Pull-to-refresh on mobile scroll body
- [x] Smoother period transitions on the compare chart (veil + canvas fade)

**Exit criteria:** Two visual brands (dark + light) and benchmark visible on overview chart.

**Status: Phase 3 complete.**

---

## Phase 4 — Wealth product patterns

**Goal:** Screen reads like robo-advisory / retail wealth, not a price chart only.

- [x] Rebalance suggestion card (current vs target allocation from live weights)
- [x] Sector breakdown (stacked bar under allocation ring)
- [x] Activity feed (dividend, buy, deposit — mock events from holdings)
- [x] Savings goal tied to live portfolio value (insight card + remaining EUR)
- [x] Goal line on chart (% return needed from period start to reach goal)

**Exit criteria:** Insight strip and allocation section use computed portfolio data, not static copy.

**Status: Phase 4 complete.**

---

## Phase 5 — Polish, routes & distribution

**Goal:** Production-ready inspiration page for sales and integrators.

- [ ] First-visit onboarding tooltips (deferred)
- [x] `/starters/fintech-integration/app-bank` light retail banking route
- [x] Theme preset export — **Copy theme** button (chart + shell JSON)
- [x] Accessibility pass (focus-visible, aria labels, live regions, sr-only)
- [x] E2E smoke test — market toggle and chart mount (`e2e/fintech-wealth-app.spec.ts`)

**Exit criteria:** Demo is demo-ready for client calls; docs and live app stay in sync.

**Status: Phase 5 complete** (onboarding skipped by request).

---

## Regenerating equity fixtures

```bash
node apps/docs/scripts/generate-fintech-equity-csv.mjs
```

Output: `apps/docs/static/data/fintech-equity/{SYMBOL}.csv`
