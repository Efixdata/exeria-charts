# Chart Maintainer Architecture Notes

This document is a short runtime map for maintainers.

## Chart lifecycle and render loop

1. Chart.init creates canvas, overlay, and top layer elements.
2. Renderer is created and holds object render registry.
3. Fusion runtime is built from model data.
4. InteractionsController is initialized.
5. Rendering runs through Renderer.render and overlay passes.

Main files:

- src/Chart.ts
- src/Renderer.ts
- src/InteractionsController.ts
- src/fusion.ts

## Responsibilities by layer

- Chart.ts: orchestration, model lifecycle, cross-layer wiring.
- Renderer.ts: panel rendering, value/time axes, object render calls, overlay/post-overlay.
- InteractionsController.ts: pointer/touch mode state, staging/drag interactions, object hit/select.
- fusion.ts: script runtime model, series manager, loader, builder, engine logic.

## Series objects vs shape objects

- Series runtime objects live in src/objects/series.
- Shape runtime objects live in src/objects/shapes.
- Shared shape and series contracts are under src/objects/*/_sharedTypes.ts.

## Staged drawing flow vs dragging existing objects

- Staged creation is controlled by mode switching in InteractionsController.setMode and stage handlers.
- Existing object drag uses onMouseDrag/onRightMouseDrag and object-level handlers from renderer registry.
- Overlay preview paths are rendered through renderOverlayedObject and Renderer overlay passes.

## Public API types vs internal runtime types

- Public API: src/types.ts and src/index.ts exports.
- Internal runtime contracts: src/internal-types.
- Internal runtime contracts can evolve faster; public API types should remain stable unless intentionally changed.

## Validation expectations

Use these checks for every runtime refactor:

```bash
npm --prefix packages/chart run build:types
```

Then run manual browser checks
