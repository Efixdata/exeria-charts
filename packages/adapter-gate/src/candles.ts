import type { Candle, Tick } from "@efixdata/exeria-chart";
import type { GateCandleRow, GateCandlestickUpdate } from "./types";

export function mapGateCandleRow(row: GateCandleRow): Candle {
  const stampSec = Number(row[0] ?? 0);

  return {
    stamp: stampSec * 1000,
    o: parseFloat(row[5] ?? "0"),
    h: parseFloat(row[3] ?? "0"),
    l: parseFloat(row[4] ?? "0"),
    c: parseFloat(row[2] ?? "0"),
    v: parseFloat(row[6] ?? row[1] ?? "0"),
  };
}

export function mapGateCandleRows(rows: GateCandleRow[]): Candle[] {
  return rows.map(mapGateCandleRow).sort((a, b) => a.stamp - b.stamp);
}

export function mapGateCandleUpdateToTick(update: GateCandlestickUpdate): Tick {
  const price = parseFloat(update.c ?? "0");
  const stampSec = Number(update.t ?? 0);

  return {
    stamp: stampSec * 1000,
    o: parseFloat(update.o ?? "0"),
    h: parseFloat(update.h ?? "0"),
    l: parseFloat(update.l ?? "0"),
    c: price,
    price,
    v: parseFloat(update.a ?? update.v ?? "0"),
  };
}
