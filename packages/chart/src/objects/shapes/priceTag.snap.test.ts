import { describe, expect, it } from "vitest";
import { Shape } from "../../Objects2";
import { PriceTagObject } from "./priceTag";
import type { ShapeRuntime } from "./_sharedTypes";

describe("priceTag OHLC snap", () => {
  const shapeBase = new Shape();
  PriceTagObject.prototype = shapeBase;
  const shape = new (PriceTagObject as unknown as new () => ShapeRuntime)() as unknown as InstanceType<typeof Shape> & {
    stageDown: (...args: unknown[]) => { selected: number; anchors: unknown[] };
  };

  const panel = {
    id: "main",
    main: true,
    _height: 400,
    _offset: 0,
    vMin: 20000,
    vMax: 21000,
    valueAxisMode: "lin",
    precision: 2,
    objects: [{ type: "SeriesObject", renderAs: "OHLC" }],
  };

  const model = {
    mainSeries: "btc",
    instrumentsSeries: [{ seriesId: "btc" }],
    viewportLeft: 60,
    periodWidth: 10,
    _midOffset: 0,
  };

  const seriesManager = {
    btc: {
      data: [{ stamp: 1, o: 20400, h: 20550, l: 20350, c: 20480 }],
      interval: { milis: 3600000 },
    },
  };

  const renderer = {
    getPointIndex: () => 0,
    getPrecision: () => 2,
    getPriceRenderingOptions: () => ({ zerosToReduce: 0 }),
    getYCoordinateForPrice: (price: number, opts: { minValue: number; maxValue: number; panelHeight: number }) => {
      const range = opts.maxValue - opts.minValue;
      return opts.panelHeight - ((price - opts.minValue) / range) * opts.panelHeight;
    },
    getPriceForYCoordinate: (y: number, opts: { minValue: number; maxValue: number; panelHeight: number }) => {
      const range = opts.maxValue - opts.minValue;
      return opts.minValue + ((opts.panelHeight - y) / opts.panelHeight) * range;
    },
    getIndexPoint: () => 0,
    getStampIndex: () => 0,
    getIndexStamp: () => 0,
  };

  const interactor = {
    currentAnchor: null,
    getMainPanel: () => panel,
    getPanel: () => panel,
  };

  it("snaps anchor value to close when pointer is near close", () => {
    const closeY =
      renderer.getYCoordinateForPrice(20480, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
      }) + panel._offset;

    const staging: Record<string, any> = {
      type: "priceTag",
      sticky: true,
      anchors: [{ stamp: 0, offset: 0, value: 0, _index: 0 }],
    };

    shape.stageDown(
      { _offset: { offsetX: 0, offsetY: closeY + 6 } },
      staging,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
    );

    expect(staging.anchors[0].value).toBe(20480);
  });

  it("places anchor on indicator panel scale (not main OHLC prices)", () => {
    const indicatorPanel = {
      id: "rsi",
      main: false,
      _height: 120,
      _offset: 500,
      vMin: 0,
      vMax: 100,
      valueAxisMode: "lin",
      precision: 2,
      objects: [
        {
          type: "IndicatorObject",
          dataLink: "rsi",
          dataField: "rsi",
        },
      ],
    };

    const model = {
      mainSeries: "btc",
      instrumentsSeries: [{ seriesId: "btc" }],
      viewportLeft: 60,
      periodWidth: 10,
      _midOffset: 0,
    };

    const seriesManager = {
      btc: {
        data: [{ stamp: 1, o: 20400, h: 20550, l: 20350, c: 20480 }],
        interval: { milis: 3600000 },
      },
      rsi: {
        data: [{ stamp: 1, rsi: 55 }],
        interval: { milis: 3600000 },
      },
    };

    const staging: Record<string, any> = {
      type: "priceTag",
      sticky: true,
      anchors: [{ stamp: 0, offset: 0, value: 0, _index: 0 }],
    };

    shape.stageDown(
      { _offset: { offsetX: 0, offsetY: 550 } },
      staging,
      renderer,
      { ...interactor, getPanel: () => indicatorPanel },
      model,
      indicatorPanel,
      seriesManager,
    );

    expect(staging.reference).toBe("rsi:rsi");
    expect(staging.anchors[0].value).toBeGreaterThan(0);
    expect(staging.anchors[0].value).toBeLessThan(100);
  });
});
