import { describe, expect, it } from "vitest";
import {
  mapTimeSeriesValuesToCandles,
  parseTwelveDataDatetime,
} from "../src/candles";

describe("parseTwelveDataDatetime", () => {
  it("parses Twelve Data datetime strings", () => {
    const stamp = parseTwelveDataDatetime("2021-09-16 15:59:00");
    expect(stamp).toBe(Date.parse("2021-09-16T15:59:00Z"));
  });
});

describe("mapTimeSeriesValuesToCandles", () => {
  it("maps and sorts candles ascending by stamp", () => {
    expect(
      mapTimeSeriesValuesToCandles([
        {
          datetime: "2021-09-16 16:00:00",
          open: "2",
          high: "3",
          low: "1",
          close: "2.5",
          volume: "10",
        },
        {
          datetime: "2021-09-16 15:59:00",
          open: "1",
          high: "2",
          low: "0.5",
          close: "1.5",
          volume: "5",
        },
      ]),
    ).toEqual([
      {
        stamp: Date.parse("2021-09-16T15:59:00Z"),
        o: 1,
        h: 2,
        l: 0.5,
        c: 1.5,
        v: 5,
      },
      {
        stamp: Date.parse("2021-09-16T16:00:00Z"),
        o: 2,
        h: 3,
        l: 1,
        c: 2.5,
        v: 10,
      },
    ]);
  });
});
