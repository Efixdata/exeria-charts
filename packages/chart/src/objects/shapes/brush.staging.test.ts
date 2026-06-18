import { describe, expect, it } from "vitest";
import { Shape } from "../../Objects2";
import { BrushObject } from "./brush";
import type { ShapeRuntime } from "./_sharedTypes";

describe("brush staging clicks", () => {
  const shapeBase = new Shape();
  BrushObject.prototype = shapeBase;
  const brush = new (BrushObject as unknown as new () => ShapeRuntime)() as unknown as InstanceType<typeof Shape> & {
    stageDown: (...args: unknown[]) => { selected: number; anchors: unknown[] };
    stageUp: (...args: unknown[]) => boolean;
  };

  const panel = {
    main: true,
    _height: 400,
    _offset: 0,
    vMin: 0,
    vMax: 100,
    valueAxisMode: "lin",
    precision: 2,
  };

  const model = {
    mainSeries: "s1",
    instrumentsSeries: [{ seriesId: "s1" }],
    viewportLeft: 0,
    periodWidth: 10,
    _midOffset: 0,
  };

  const seriesManager = {
    s1: {
      data: [{ stamp: 1, o: 10, h: 20, l: 5, c: 15 }],
      interval: { milis: 60000 },
    },
  };

  const renderer = {
    getPointIndex: (x: number) => x / 10,
    getPrecision: () => 2,
    getIndexStamp: () => 1,
    getIndexPoint: (index: number) => index * 10,
    getYCoordinateForPrice: (value: number) => 400 - value * 4,
    getPriceForYCoordinate: (y: number) => (400 - y) / 4,
  };

  const interactor = {
    currentAnchor: null as { selected: number; drag?: boolean; anchors?: unknown[] } | null,
    drawingMagnetEnabled: false,
  };

  const staging = {
    type: "brush",
    sticky: true,
    anchors: [{ stamp: 0, offset: 0, value: 0, _index: 0 }],
  };

  it("saves on second click without wiping the first stroke", () => {
    interactor.currentAnchor = brush.stageDown(
      { _offset: { offsetX: 10, offsetY: 50 } },
      staging,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
    );

    expect(staging.anchors).toHaveLength(1);
    expect(brush.stageUp(
      { _offset: { offsetX: 10, offsetY: 50 } },
      staging,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
    )).toBe(false);

    interactor.currentAnchor = brush.stageDown(
      { _offset: { offsetX: 30, offsetY: 80 } },
      staging,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
    );

    expect(staging.anchors.length).toBeGreaterThanOrEqual(2);

    expect(brush.stageUp(
      { _offset: { offsetX: 30, offsetY: 80 } },
      staging,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
    )).toBe(true);
  });
});
