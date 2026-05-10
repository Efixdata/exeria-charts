# Chart Contributor Guide

This guide is for engineers contributing to the chart runtime.

## Scope

This package contains the chart engine and rendering/interactions runtime used by apps in this repo.

- Public API entry: src/index.ts
- Main runtime orchestrator: src/Chart.ts
- Rendering pipeline: src/Renderer.ts
- Interaction pipeline: src/InteractionsController.ts
- Fusion runtime and scripts plumbing: src/fusion.ts

## Local setup

From repository root:

```bash
npm --prefix packages/chart install
```

Main development commands:

```bash
npm --prefix packages/chart run build:types
npm --prefix packages/chart run lint
```

## Validation workflow

Before opening a PR, run these in order:

1. Type validation

```bash
npm --prefix packages/chart run build:types
```

## Where to make changes

- Add or adjust object render and hit behavior in src/objects/series and src/objects/shapes.
- Keep interactor mode logic in src/InteractionsController.ts.
- Keep chart orchestration and lifecycle logic in src/Chart.ts.
- Keep renderer object registry and panel render flow in src/Renderer.ts.
- Keep script runtime/build/load logic in src/fusion.ts.
- Keep adapters for legacy globals in src/adapters.

## Rules that keep refactors safe

- Avoid adding new direct global seams in runtime files. Use adapters in src/adapters.
- Prefer narrow internal contracts in src/internal-types over new broad any maps.
- Keep legacy compatibility exceptions local and explicit.
- Do not change public API behavior in src/types.ts unless the change is intentional and documented.

## PR checklist

- Build passes: build:types
- Manual scenarios validated
- Contributor-facing docs updated when behavior or workflow changes
