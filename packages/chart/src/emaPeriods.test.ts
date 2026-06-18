import { describe, expect, it } from "vitest";
import FUSION from "./fusion";
import { mergeScriptInputProto } from "./scriptInputUtils";
import type { RuntimeScriptInput } from "./internal-types/scripts";
import type { RuntimeScriptConfig } from "./internal-types/scripts";

const EMA_PERIODS_TEMPLATE: RuntimeScriptInput = {
  type: "integer",
  name: "periods",
  properties: { max: 200, min: 0 },
  value: 14,
};

function buildCloseSeries(closes: number[]) {
  const values = closes.map((c, index) => ({ stamp: index, c }));
  return {
    getValue(index: number) {
      if (index < 0 || index >= values.length) return null;
      return values[index]?.c ?? null;
    },
  };
}

function buildEmaOutputSeries() {
  const values: Array<number | null> = [];
  return {
    getValue(index: number) {
      if (index < 0 || index >= values.length) return null;
      return values[index] ?? null;
    },
    setValue(index: number, value: unknown) {
      values[index] = typeof value === "number" ? value : null;
    },
    values,
  };
}

function calculateEma(closes: number[], periods: number) {
  const close = buildCloseSeries(closes);
  const ema = buildEmaOutputSeries();

  for (let index = 0; index < closes.length; index++) {
    ema.setValue(
      index,
      FUSION.lib.getEMA(close, index, periods, ema),
    );
  }

  return ema.values;
}

function resolveModelPeriods(modelValue: unknown, templateValue = 14): number {
  if (typeof modelValue === "number") {
    return modelValue;
  }

  if (
    typeof modelValue === "object" &&
    modelValue !== null &&
    "value" in modelValue &&
    typeof (modelValue as { value: unknown }).value === "number"
  ) {
    return (modelValue as { value: number }).value;
  }

  return templateValue;
}

function buildSampleCloses(length = 80) {
  return Array.from({ length }, (_, index) => 100 + Math.sin(index / 4) * 5);
}

describe("EMA period wiring", () => {
  it("merges nested proto PERIODS overrides from quant preset style", () => {
    const merged = mergeScriptInputProto(EMA_PERIODS_TEMPLATE, { value: 28, type: "integer" });
    expect(merged.value).toBe(28);
  });

  it("produces different series for period 14 vs 28", () => {
    const closes = buildSampleCloses();
    const ema14 = calculateEma(closes, 14);
    const ema28 = calculateEma(closes, 28);

    const last14 = ema14[ema14.length - 1];
    const last28 = ema28[ema28.length - 1];

    expect(last14).not.toBeNull();
    expect(last28).not.toBeNull();
    expect(last14).not.toBeCloseTo(last28!, 4);
  });

  it("shows object PERIODS in model breaks EMA math (NaN values)", () => {
    const closes = buildSampleCloses(40);
    const brokenPeriods = { type: "integer", value: 28 } as unknown as number;
    const values: Array<number | null> = [];

    const close = buildCloseSeries(closes);
    const ema = buildEmaOutputSeries();

    for (let index = 0; index < closes.length; index++) {
      const next = FUSION.lib.getEMA(close, index, brokenPeriods, ema);
      values.push(typeof next === "number" && Number.isFinite(next) ? next : null);
    }

    const valid = values.filter((value) => value !== null);
    expect(valid.length).toBe(0);
  });

  it("resolveModelPeriods reads both flat and nested model values", () => {
    expect(resolveModelPeriods(28)).toBe(28);
    expect(resolveModelPeriods({ value: 28, type: "integer" })).toBe(28);
    expect(resolveModelPeriods(undefined)).toBe(14);
  });

  it("fusion engine calculates EMA(28) when model stores flat scalar PERIODS", () => {
    const closes = buildSampleCloses();
    const engine = new FUSION.engine() as InstanceType<typeof FUSION.engine>;
    const mainSeriesId = FUSION.uniqueId();

    engine.model.instrumentsSeries = [
      {
        seriesId: mainSeriesId,
        title: "TEST",
        data: closes.map((c, index) => ({
          o: c,
          h: c + 0.5,
          l: c - 0.5,
          c,
          v: 1,
          stamp: index,
        })),
        instrument: {
          id: "TEST",
          symbol: "TEST",
          tradable: true,
        },
      } as any,
    ];
    engine.model.mainSeries = mainSeriesId as any;
    engine.seriesManager[mainSeriesId] = engine.model.instrumentsSeries[0] as any;

    const emaConfig: any = {
      key: "EMA",
      id: "EMA",
      inputs: {
        CLOSE: `${mainSeriesId}:c`,
        PERIODS: 28 as any,
      },
      outputs: {},
      pane: "1",
      userName: "EMA 28",
      visible: true,
    };

    engine.addScript(emaConfig);
    engine.calculateAll();

    const emaScript = Object.values(engine.scriptsManager).find((entry) => entry.outputs?.EMA);
    expect(emaScript?.PERIODS).toBe(28);

    const emaSeriesId = emaScript?.outputs?.EMA as string;
    const plotted = engine.seriesManager[emaSeriesId]?.data?.map((row: any) => row.EMA) ?? [];
    const expected = calculateEma(closes, 28);

    expect(plotted[plotted.length - 1]).toBeCloseTo(expected[expected.length - 1]!, 8);
    expect(plotted[plotted.length - 1]).not.toBeCloseTo(
      calculateEma(closes, 14)[expected.length - 1]!,
      4,
    );
  });

  it("fusion engine calculates EMA(28) when model stores nested PERIODS object", () => {
    const closes = buildSampleCloses();
    const engine = new FUSION.engine() as InstanceType<typeof FUSION.engine>;
    const mainSeriesId = FUSION.uniqueId();

    engine.model.instrumentsSeries = [
      {
        seriesId: mainSeriesId,
        title: "TEST",
        data: closes.map((c, index) => ({
          o: c,
          h: c + 0.5,
          l: c - 0.5,
          c,
          v: 1,
          stamp: index,
        })),
        instrument: {
          id: "TEST",
          symbol: "TEST",
          tradable: true,
        },
      } as any,
    ];
    engine.model.mainSeries = mainSeriesId as any;
    engine.seriesManager[mainSeriesId] = engine.model.instrumentsSeries[0] as any;

    const emaConfig: any = {
      key: "EMA",
      id: "EMA",
      inputs: {
        CLOSE: `${mainSeriesId}:c`,
        PERIODS: { type: "integer", value: 28, name: "periods", properties: { max: 200, min: 0 } } as any,
      },
      outputs: {},
      pane: "1",
      userName: "EMA 28",
      visible: true,
    };

    engine.addScript(emaConfig);
    engine.calculateAll();

    const emaScript = Object.values(engine.scriptsManager).find((entry) => entry.outputs?.EMA);
    expect(emaScript?.PERIODS).toBe(28);

    const emaSeriesId = emaScript?.outputs?.EMA as string;
    const plotted = engine.seriesManager[emaSeriesId]?.data?.map((row: any) => row.EMA) ?? [];
    const expected = calculateEma(closes, 28);

    expect(plotted[plotted.length - 1]).toBeCloseTo(expected[expected.length - 1]!, 8);
  });
});
