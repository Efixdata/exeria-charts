import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHART_COMPACT_BREAKPOINT_PX,
  configureChartEnvironment,
  getChartEnvironment,
  hitTolerance,
  resetChartEnvironmentForTests,
  subscribeChartEnvironment,
} from "./chartEnvironment";

type MediaQueryListener = (event: { matches: boolean }) => void;

function createMatchMedia(matchesByQuery: Record<string, boolean>) {
  const listeners = new Map<string, Set<MediaQueryListener>>();
  const instances = new Map<string, { matches: boolean; dispatch: (matches: boolean) => void }>();

  const matchMedia = vi.fn((query: string) => {
    if (instances.has(query)) {
      return instances.get(query);
    }

    const mql = {
      matches: matchesByQuery[query] ?? false,
      media: query,
      addEventListener: (_event: string, listener: MediaQueryListener) => {
        const set = listeners.get(query) ?? new Set();
        set.add(listener);
        listeners.set(query, set);
      },
      removeEventListener: (_event: string, listener: MediaQueryListener) => {
        listeners.get(query)?.delete(listener);
      },
      addListener: (listener: MediaQueryListener) => {
        const set = listeners.get(query) ?? new Set();
        set.add(listener);
        listeners.set(query, set);
      },
      removeListener: (listener: MediaQueryListener) => {
        listeners.get(query)?.delete(listener);
      },
      dispatch(matches: boolean) {
        mql.matches = matches;
        matchesByQuery[query] = matches;
        listeners.get(query)?.forEach((listener) => listener({ matches }));
      },
    };

    instances.set(query, mql);
    return mql;
  });

  return matchMedia;
}

function stubBrowser(matchesByQuery: Record<string, boolean>) {
  vi.stubGlobal("window", {
    matchMedia: createMatchMedia(matchesByQuery),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("document", {
    documentElement: {},
  });
}

describe("chartEnvironment", () => {
  beforeEach(() => {
    resetChartEnvironmentForTests();
    stubBrowser({});
    configureChartEnvironment({});
  });

  afterEach(() => {
    resetChartEnvironmentForTests();
    vi.unstubAllGlobals();
  });

  it("uses 600px compact breakpoint aligned with UI toolbar", () => {
    expect(CHART_COMPACT_BREAKPOINT_PX).toBe(600);
  });

  it("selects compact layout on narrow viewport", () => {
    resetChartEnvironmentForTests();
    stubBrowser({
      [`(max-width: ${CHART_COMPACT_BREAKPOINT_PX}px)`]: true,
    });

    const env = getChartEnvironment();
    expect(env.layoutMode).toBe("compact");
    expect(env.isCompact).toBe(true);
    expect(env.isNarrowViewport).toBe(true);
  });

  it("selects touch layout on coarse pointer when viewport is wide", () => {
    resetChartEnvironmentForTests();
    stubBrowser({
      [`(max-width: ${CHART_COMPACT_BREAKPOINT_PX}px)`]: false,
      "(pointer: coarse)": true,
    });
    vi.stubGlobal("document", {
      documentElement: { ontouchstart: true },
    });

    const env = getChartEnvironment();
    expect(env.layoutMode).toBe("touch");
    expect(env.isTouch).toBe(true);
    expect(env.hitTolerance).toBe(15);
    expect(hitTolerance).toBe(15);
  });

  it("honours per-instance layout mode override", () => {
    resetChartEnvironmentForTests();
    stubBrowser({
      [`(max-width: ${CHART_COMPACT_BREAKPOINT_PX}px)`]: true,
    });

    const env = getChartEnvironment("desktop");
    expect(env.layoutMode).toBe("desktop");
    expect(env.isCompact).toBe(false);
  });

  it("notifies subscribers when media queries change", () => {
    const matches: Record<string, boolean> = {
      [`(max-width: ${CHART_COMPACT_BREAKPOINT_PX}px)`]: false,
    };
    const matchMedia = createMatchMedia(matches);
    resetChartEnvironmentForTests();
    vi.stubGlobal("window", {
      matchMedia,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("document", {
      documentElement: {},
    });

    const listener = vi.fn();
    const unsubscribe = subscribeChartEnvironment(listener);
    const narrowQuery = matchMedia(`(max-width: ${CHART_COMPACT_BREAKPOINT_PX}px)`);
    narrowQuery?.dispatch(true);

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
