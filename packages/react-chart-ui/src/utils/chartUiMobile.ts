import type { CSSProperties } from "react";
import { UI_TOOLBAR } from "ui/designTokens";
import { configureChartEnvironment } from "@efixdata/exeria-chart";
import type { NullableChartInstance } from "../chartTypes";

export function applyChartUiEnvironmentOptions(options?: {
  compactBreakpoint?: number;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const compactBreakpoint = options?.compactBreakpoint ?? UI_TOOLBAR.mobileBreakpoint;

  if (typeof compactBreakpoint === "number" && compactBreakpoint > 0) {
    configureChartEnvironment({
      compactBreakpoint: Math.round(compactBreakpoint),
    });
  }
}

export function syncChartInstanceLayout(chart: NullableChartInstance): void {
  chart?.setLayoutMode?.("auto");
  chart?.fit?.();
  chart?.render?.();
  chart?.renderOverlay?.();
}

export function getChartUiSafeAreaPadding(edgeInset = 0): CSSProperties {
  if (edgeInset > 0) {
    return {
      paddingTop: `calc(env(safe-area-inset-top, 0px) + ${edgeInset}px)`,
      paddingRight: `calc(env(safe-area-inset-right, 0px) + ${edgeInset}px)`,
      paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${edgeInset}px)`,
      paddingLeft: `calc(env(safe-area-inset-left, 0px) + ${edgeInset}px)`,
    };
  }

  return {
    paddingTop: "env(safe-area-inset-top, 0px)",
    paddingRight: "env(safe-area-inset-right, 0px)",
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    paddingLeft: "env(safe-area-inset-left, 0px)",
  };
}

export function isChartUiFullscreenElement(element: HTMLElement | null): boolean {
  if (!element || typeof document === "undefined") {
    return false;
  }

  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };

  const active =
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement;

  return active === element;
}
