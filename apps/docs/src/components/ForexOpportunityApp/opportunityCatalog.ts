import type { ArbSignalRecord } from "@exeria/charts";
import type { OpportunityFilter } from "./constants";
import { loadArbSignals } from "./arbSignalLoader";
import { getArbSignalTimeframe } from "./applyArbSignalScene";
import type { ForexTimeframeId } from "./forexInstruments";

/** @deprecated Use ArbSignalRecord from @exeria/charts */
export type ForexOpportunity = ArbSignalRecord;

export const FOREX_OPPORTUNITIES: ArbSignalRecord[] = loadArbSignals();

export function getSignalSymbol(signal: ArbSignalRecord): string {
  return signal.chartScene.instrument;
}

export function getSignalTimeframeId(signal: ArbSignalRecord): ForexTimeframeId {
  return getArbSignalTimeframe(signal);
}

export function filterOpportunities(
  opportunities: ArbSignalRecord[],
  filter: OpportunityFilter,
): ArbSignalRecord[] {
  if (filter === "all") {
    return opportunities;
  }

  if (filter === "events") {
    return opportunities.filter((item) => item.category === "event");
  }

  if (filter === "signals") {
    return opportunities.filter((item) => item.category === "signal");
  }

  return opportunities.filter((item) => item.category === filter);
}

export function formatOpportunityAge(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
