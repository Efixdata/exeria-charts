import type { Tick } from "@efixdata/exeria-chart";
import type { MassiveCandleBar } from "./types";

function toStampMs(value: number): number {
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

export function mapBarToTick(bar: MassiveCandleBar): Tick {
  const stamp = toStampMs(bar.t);

  return {
    stamp,
    c: bar.c,
    price: bar.c,
    o: bar.o,
    h: bar.h,
    l: bar.l,
    v: bar.v ?? 0,
  };
}
