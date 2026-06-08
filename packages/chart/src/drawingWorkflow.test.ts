import { describe, expect, it } from "vitest";
import { Shape } from "./Objects2";
import { isDrawingSnapEnabled } from "./drawingWorkflow";

describe("drawing magnet snap", () => {
  it("enables snap when magnet or sticky is on", () => {
    expect(isDrawingSnapEnabled({ sticky: true }, { drawingMagnetEnabled: false })).toBe(true);
    expect(isDrawingSnapEnabled({}, { drawingMagnetEnabled: true })).toBe(true);
    expect(isDrawingSnapEnabled({}, { drawingMagnetEnabled: false })).toBe(false);
  });

  it("Shape.stickToCandleValue picks closest OHLC level", () => {
    const shape = new Shape();
    const panel = {
      _height: 400,
      _offset: 0,
      vMin: 100,
      vMax: 200,
      valueAxisMode: "lin",
    };
    const renderer = {
      getPriceForYCoordinate: (y: number) => 200 - y / 2,
      getYCoordinateForPrice: (price: number) => (200 - price) * 2,
    };
    const candles = [{ o: 110, h: 150, l: 105, c: 140 }];
    const closeY = renderer.getYCoordinateForPrice(140);

    expect(shape.stickToCandleValue(closeY + 5, candles, panel, renderer, 120)).toBe(140);
    expect(shape.stickToCandleValue(closeY + 30, candles, panel, renderer, 120)).toBe(125);
  });
});
