import type { CSSProperties } from "react";
import type { ChartUITheme } from "../chartTypes";
import { getUILayoutCssVars } from "ui/designTokens";

function parseHexColor(color: string): { r: number; g: number; b: number } | null {
  const normalized = color.trim();
  if (!normalized.startsWith("#")) {
    return null;
  }

  const hex =
    normalized.length === 4
      ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
      : normalized;
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!match) {
    return null;
  }

  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  };
}

export function isLightDialogBackground(color?: string): boolean {
  if (!color) {
    return false;
  }

  const rgb = parseHexColor(color);
  if (!rgb) {
    return false;
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.62;
}

function getTabActiveTokens(theme?: ChartUITheme) {
  const text = theme?.dialog?.textColor ?? "#D1D4DC";
  const accent = theme?.accentColor ?? "#2962FF";
  const isLight = isLightDialogBackground(theme?.dialog?.backgroundColor);
  const activeBg = theme?.buttons?.activeBackground ?? "rgba(41, 98, 255, 0.14)";
  const inputSurface = theme?.inputs?.backgroundColor ?? "#2A2E39";
  const divider = theme?.dialog?.dividerColor ?? "rgba(255, 255, 255, 0.12)";

  if (isLight) {
    return {
      color: accent,
      border: accent,
      background: activeBg,
    };
  }

  return {
    color: text,
    border: "#434651",
    background: inputSurface,
  };
}

function getSharedDialogCssVars(theme?: ChartUITheme): CSSProperties {
  const text = theme?.dialog?.textColor ?? "#D1D4DC";
  const muted = theme?.dialog?.itemSubTitleColor ?? "rgba(255, 255, 255, 0.65)";
  const divider = theme?.dialog?.dividerColor ?? "rgba(255, 255, 255, 0.12)";
  const tabActive = getTabActiveTokens(theme);
  const scrollBar = theme?.scrollBar;

  return {
    ...getUILayoutCssVars(),
    "--dialog-border": divider,
    "--dialog-muted": muted,
    "--dialog-text": text,
    "--dialog-tab-color": muted,
    "--dialog-tab-border": divider,
    "--dialog-tab-active-color": tabActive.color,
    "--dialog-tab-active-border": tabActive.border,
    "--dialog-tab-active-bg": tabActive.background,
    "--dialog-scrollbar-width": "8px",
    "--dialog-scrollbar-thumb": scrollBar?.thumbColor ?? "rgba(255, 255, 255, 0.22)",
    "--dialog-scrollbar-track": scrollBar?.trackColor ?? "rgba(255, 255, 255, 0.04)",
    "--dialog-scrollbar-thumb-hover": scrollBar?.thumbHoverColor ?? "rgba(255, 255, 255, 0.34)",
  } as CSSProperties;
}

export function getChartSettingsCssVars(theme?: ChartUITheme): CSSProperties {
  const text = theme?.dialog?.textColor ?? "#D1D4DC";
  const muted = theme?.dialog?.itemSubTitleColor ?? "rgba(255, 255, 255, 0.65)";
  const divider = theme?.dialog?.dividerColor ?? "rgba(255, 255, 255, 0.12)";
  const accent = theme?.accentColor ?? "#2962FF";
  const isLight = isLightDialogBackground(theme?.dialog?.backgroundColor);
  const tabActive = getTabActiveTokens(theme);

  return {
    ...getSharedDialogCssVars(theme),
    "--cs-border": divider,
    "--cs-border-subtle": isLight ? "rgba(19, 23, 34, 0.08)" : "rgba(255, 255, 255, 0.08)",
    "--cs-text": text,
    "--cs-muted": muted,
    "--cs-title": theme?.dialog?.titleColor ?? text,
    "--cs-accent": accent,
    "--cs-tab-active-color": tabActive.color,
    "--cs-tab-active-border": tabActive.border,
    "--cs-tab-active-bg": tabActive.background,
    "--cs-section-bg": isLight ? "rgba(19, 23, 34, 0.03)" : "rgba(255, 255, 255, 0.03)",
    "--cs-card-bg": isLight ? "rgba(19, 23, 34, 0.04)" : "rgba(0, 0, 0, 0.12)",
  } as CSSProperties;
}

export function getIndicatorDialogCssVars(theme?: ChartUITheme): CSSProperties {
  const chartVars = getChartSettingsCssVars(theme);
  const text = theme?.dialog?.textColor ?? "#D1D4DC";
  const muted = theme?.dialog?.itemSubTitleColor ?? "rgba(255, 255, 255, 0.65)";
  const accent = theme?.accentColor ?? "#2962FF";
  const divider = theme?.dialog?.dividerColor ?? "rgba(255, 255, 255, 0.12)";
  const hover = theme?.dialog?.itemHoverBackgroundColor ?? "rgba(255, 255, 255, 0.08)";

  return {
    ...chartVars,
    "--indicator-row-hover": hover,
    "--indicator-row-text": text,
    "--indicator-row-muted": muted,
    "--indicator-action-color": accent,
    "--indicator-divider": divider,
  } as CSSProperties;
}
