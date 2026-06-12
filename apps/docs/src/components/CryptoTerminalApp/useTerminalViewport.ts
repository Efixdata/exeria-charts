import { useEffect, useState } from "react";
import type { ChartInstance } from "@exeria/charts";

export type TerminalViewport = "desktop" | "tablet" | "mobile";

const TABLET_MAX = 1280;
const MOBILE_MAX = 1024;

function readViewport(): TerminalViewport {
  if (typeof window === "undefined") {
    return "desktop";
  }

  const width = window.innerWidth;
  if (width <= MOBILE_MAX) {
    return "mobile";
  }

  if (width <= TABLET_MAX) {
    return "tablet";
  }

  return "desktop";
}

export function useTerminalViewport() {
  const [viewport, setViewport] = useState<TerminalViewport>(() => readViewport());

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    viewport,
    isMobile: viewport === "mobile",
    isTablet: viewport === "tablet",
    isCompact: viewport !== "desktop",
  };
}

export function useTerminalFullscreenLayout() {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-crypto-terminal-app", "");

    return () => {
      html.removeAttribute("data-crypto-terminal-app");
    };
  }, []);
}

export function useChartRerenderOnLayoutChange(
  chart: ChartInstance | null,
  layoutKey: string,
) {
  useEffect(() => {
    if (!chart) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const runtime = chart as ChartInstance & { rerender?: () => void };
      runtime.rerender?.();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [chart, layoutKey]);
}
