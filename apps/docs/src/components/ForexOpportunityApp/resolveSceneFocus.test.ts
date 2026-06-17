import { describe, expect, it } from "vitest";
import { resolveSceneFocusBarIndex } from "./resolveSceneFocus";
import type { Candle } from "@efixdata/exeria-chart";

const candles: Candle[] = [
  { stamp: 1_000_000, o: 1.1, h: 1.11, l: 1.09, c: 1.105 },
  { stamp: 1_000_900, o: 1.105, h: 1.12, l: 1.1, c: 1.115 },
  { stamp: 1_001_800, o: 1.115, h: 1.13, l: 1.11, c: 1.125 },
];

describe("resolveSceneFocusBarIndex", () => {
  it("resolves detectedAt to nearest bar", () => {
    const index = resolveSceneFocusBarIndex(
      candles,
      { at: "detectedAt" },
      1_000_950,
    );

    expect(index).toBe(1);
  });

  it("applies barOffset from detectedAt anchor", () => {
    const index = resolveSceneFocusBarIndex(
      candles,
      { at: "barOffset", barOffset: 1 },
      1_000_000,
    );

    expect(index).toBe(1);
  });
});
