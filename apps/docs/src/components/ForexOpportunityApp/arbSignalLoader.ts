import type {
  ArbSceneAnchor,
  ArbSignalRecord,
  ArbChartSceneFocus,
  ArbSignalQuery,
  ArbSignalBundle,
} from "@exeria/charts";
import arbSignalsBundle from "./data/arb-signals-feed.json";

const STATIC_BUNDLE = arbSignalsBundle as ArbSignalBundle;

export function getStaticArbSignalBundle(): ArbSignalBundle {
  return STATIC_BUNDLE;
}

export function loadArbSignals(query: ArbSignalQuery = {}): ArbSignalRecord[] {
  let filtered = [...STATIC_BUNDLE.signals];

  if (query.category) {
    filtered = filtered.filter((signal) => signal.category === query.category);
  }

  if (query.instrument) {
    filtered = filtered.filter(
      (signal) => signal.chartScene.instrument === query.instrument,
    );
  }

  if (query.from != null) {
    filtered = filtered.filter((signal) => signal.detectedAt >= query.from!);
  }

  if (query.to != null) {
    filtered = filtered.filter((signal) => signal.detectedAt <= query.to!);
  }

  filtered.sort((left, right) => right.detectedAt - left.detectedAt);

  if (query.limit != null && query.limit > 0) {
    filtered = filtered.slice(0, query.limit);
  }

  return filtered;
}

export function findArbSignalById(id: string): ArbSignalRecord | undefined {
  return STATIC_BUNDLE.signals.find((signal) => signal.id === id);
}

export function findArbSignalByNewsId(newsId: string): ArbSignalRecord | undefined {
  return STATIC_BUNDLE.signals.find((signal) => signal.linkedNewsId === newsId);
}
