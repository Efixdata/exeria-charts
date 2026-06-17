import { useEffect, useState } from "react";
import {
  getChartEnvironment,
  subscribeChartEnvironment,
  type ChartEnvironmentSnapshot,
} from "@efixdata/exeria-chart";

const SERVER_SNAPSHOT: ChartEnvironmentSnapshot = {
  layoutMode: "desktop",
  isCompact: false,
  isTouch: false,
  isCoarsePointer: false,
  isNarrowViewport: false,
  hitTolerance: 4,
  compactBreakpoint: 600,
};

function readEnvironmentSnapshot(): ChartEnvironmentSnapshot {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }

  return getChartEnvironment();
}

/**
 * Subscribes to global chart environment (viewport, pointer, layout mode).
 * Re-renders when breakpoints or pointer capabilities change.
 */
export function useChartEnvironment(): ChartEnvironmentSnapshot {
  const [environment, setEnvironment] = useState<ChartEnvironmentSnapshot>(readEnvironmentSnapshot);

  useEffect(() => {
    setEnvironment(readEnvironmentSnapshot());
    return subscribeChartEnvironment(() => {
      setEnvironment(readEnvironmentSnapshot());
    });
  }, []);

  return environment;
}
