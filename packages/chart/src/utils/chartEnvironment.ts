/**
 * Reactive chart environment: viewport width, pointer capabilities, and layout mode.
 * Breakpoint matches UI_TOOLBAR.mobileBreakpoint (600px).
 */

export const CHART_COMPACT_BREAKPOINT_PX = 600;

export type ChartLayoutMode = "desktop" | "compact" | "touch";

export type ChartLayoutModeOverride = "auto" | ChartLayoutMode;

export interface ChartEnvironmentOptions {
  compactBreakpoint?: number;
  layoutMode?: ChartLayoutModeOverride;
}

export interface ChartEnvironmentSnapshot {
  layoutMode: ChartLayoutMode;
  isCompact: boolean;
  isTouch: boolean;
  isCoarsePointer: boolean;
  isNarrowViewport: boolean;
  hitTolerance: number;
  compactBreakpoint: number;
}

const DESKTOP_HIT_TOLERANCE = 4;
const TOUCH_HIT_TOLERANCE = 15;

const SSR_SNAPSHOT: ChartEnvironmentSnapshot = {
  layoutMode: "desktop",
  isCompact: false,
  isTouch: false,
  isCoarsePointer: false,
  isNarrowViewport: false,
  hitTolerance: DESKTOP_HIT_TOLERANCE,
  compactBreakpoint: CHART_COMPACT_BREAKPOINT_PX,
};

let globalOptions: ChartEnvironmentOptions = {};
let snapshot: ChartEnvironmentSnapshot = { ...SSR_SNAPSHOT };
const listeners = new Set<() => void>();
let mediaQueryListenersAttached = false;

function readMatchMedia(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(query).matches;
}

function detectTouchCapable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (typeof window.matchMedia === "function") {
    if (readMatchMedia("(pointer: coarse)")) {
      return true;
    }
    if (readMatchMedia("(hover: none) and (pointer: fine)")) {
      return true;
    }
  }

  if (typeof document !== "undefined" && document.documentElement) {
    return "ontouchstart" in document.documentElement;
  }

  return false;
}

function computeSnapshot(
  options: ChartEnvironmentOptions = globalOptions,
  layoutModeOverride?: ChartLayoutModeOverride,
): ChartEnvironmentSnapshot {
  const compactBreakpoint = options.compactBreakpoint ?? CHART_COMPACT_BREAKPOINT_PX;
  const isNarrowViewport = readMatchMedia(`(max-width: ${compactBreakpoint}px)`);
  const isCoarsePointer = readMatchMedia("(pointer: coarse)");
  const isTouchCapable = detectTouchCapable();
  const isTouch = isCoarsePointer || isTouchCapable;

  const forcedMode = layoutModeOverride ?? options.layoutMode ?? "auto";
  let layoutMode: ChartLayoutMode;

  if (forcedMode === "desktop" || forcedMode === "compact" || forcedMode === "touch") {
    layoutMode = forcedMode;
  } else if (isNarrowViewport) {
    layoutMode = "compact";
  } else if (isTouch) {
    layoutMode = "touch";
  } else {
    layoutMode = "desktop";
  }

  const isCompact = layoutMode === "compact";
  const hitTolerance = isTouch ? TOUCH_HIT_TOLERANCE : DESKTOP_HIT_TOLERANCE;

  return {
    layoutMode,
    isCompact,
    isTouch,
    isCoarsePointer,
    isNarrowViewport,
    hitTolerance,
    compactBreakpoint,
  };
}

function refreshSnapshot(layoutModeOverride?: ChartLayoutModeOverride): void {
  const next = computeSnapshot(globalOptions, layoutModeOverride);
  const prev = snapshot;
  snapshot = next;

  hitTolerance = next.hitTolerance;

  if (
    prev.layoutMode !== next.layoutMode ||
    prev.hitTolerance !== next.hitTolerance ||
    prev.isCompact !== next.isCompact ||
    prev.isNarrowViewport !== next.isNarrowViewport
  ) {
    notifyListeners();
  }
}

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("[chartEnvironment] listener failed", error);
    }
  });
}

function attachMediaQueryListeners(): void {
  if (mediaQueryListenersAttached || typeof window === "undefined" || !window.matchMedia) {
    return;
  }

  mediaQueryListenersAttached = true;
  const compactBreakpoint = globalOptions.compactBreakpoint ?? CHART_COMPACT_BREAKPOINT_PX;
  const queries = [
    `(max-width: ${compactBreakpoint}px)`,
    "(pointer: coarse)",
    "(hover: none)",
  ];

  for (const query of queries) {
    const mql = window.matchMedia(query);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onMediaChange);
    } else {
      mql.addListener(onMediaChange);
    }
  }

  window.addEventListener("orientationchange", onMediaChange);
  window.addEventListener("resize", onMediaChange);
}

function onMediaChange(): void {
  refreshSnapshot();
}

function ensureChartEnvironment(): void {
  if (typeof window === "undefined") {
    return;
  }
  attachMediaQueryListeners();
  refreshSnapshot();
}

export function configureChartEnvironment(options: ChartEnvironmentOptions): void {
  globalOptions = { ...globalOptions, ...options };
  ensureChartEnvironment();
  refreshSnapshot();
}

export function getChartEnvironment(
  layoutModeOverride?: ChartLayoutModeOverride,
): ChartEnvironmentSnapshot {
  if (typeof window === "undefined") {
    return { ...SSR_SNAPSHOT, compactBreakpoint: globalOptions.compactBreakpoint ?? CHART_COMPACT_BREAKPOINT_PX };
  }

  ensureChartEnvironment();

  if (layoutModeOverride && layoutModeOverride !== "auto") {
    return computeSnapshot(globalOptions, layoutModeOverride);
  }

  refreshSnapshot();
  return { ...snapshot };
}

export function subscribeChartEnvironment(listener: () => void): () => void {
  ensureChartEnvironment();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** @internal Resets module state between unit tests. */
export function resetChartEnvironmentForTests(): void {
  globalOptions = {};
  snapshot = { ...SSR_SNAPSHOT };
  listeners.clear();
  mediaQueryListenersAttached = false;
  hitTolerance = DESKTOP_HIT_TOLERANCE;
}

export function isCompactLayout(layoutModeOverride?: ChartLayoutModeOverride): boolean {
  return getChartEnvironment(layoutModeOverride).isCompact;
}

export function isTouchEnvironment(): boolean {
  return getChartEnvironment().isTouch;
}

/** @deprecated Use getChartEnvironment().isNarrowViewport */
export function isSmallScreen(): boolean {
  return getChartEnvironment().isNarrowViewport;
}

/** @deprecated Use isTouchEnvironment() */
export function isTouchDevice(): boolean {
  return isTouchEnvironment();
}

export function getHitTolerance(): number {
  if (typeof window === "undefined") {
    return DESKTOP_HIT_TOLERANCE;
  }
  ensureChartEnvironment();
  refreshSnapshot();
  return snapshot.hitTolerance;
}

/** Mutable export kept for legacy imports; updated when environment changes. */
export let hitTolerance = DESKTOP_HIT_TOLERANCE;

export function syncLegacyHitTolerance(): void {
  hitTolerance = snapshot.hitTolerance;
}
