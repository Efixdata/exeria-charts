type Rgb = { r: number; g: number; b: number };

function parseHexColor(color: string): Rgb {
  const normalized = color.trim().replace("#", "");
  if (normalized.length === 3) {
    return {
      r: Number.parseInt(normalized[0] + normalized[0], 16),
      g: Number.parseInt(normalized[1] + normalized[1], 16),
      b: Number.parseInt(normalized[2] + normalized[2], 16),
    };
  }

  if (normalized.length >= 6) {
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  return { r: 19, g: 23, b: 34 };
}

function toHexChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

export function mixColors(first: string, second: string, ratio: number): string {
  const from = parseHexColor(first);
  const to = parseHexColor(second);
  const weight = Math.min(1, Math.max(0, ratio));

  return `#${toHexChannel(from.r + (to.r - from.r) * weight)}${toHexChannel(
    from.g + (to.g - from.g) * weight,
  )}${toHexChannel(from.b + (to.b - from.b) * weight)}`;
}

export function withAlpha(color: string, alpha: number): string {
  const { r, g, b } = parseHexColor(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getContrastColor(color: string, dark = "#08111B", light = "#FFFFFF"): string {
  const { r, g, b } = parseHexColor(color);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 145 ? dark : light;
}

export interface ChartTipThemeColors {
  tipBackground: string;
  tipTextColor: string;
  tipTitleColor: string;
  tipLabelColor: string;
  tipUnderline: string;
  tipBorder: string;
  tipShadow: string;
}

export function resolveChartTipThemeColors(options: {
  backgroundColor: string;
  axisTextColor: string;
  crosshairColor: string;
  gridColor: string;
  isLight: boolean;
}): ChartTipThemeColors {
  const { backgroundColor, axisTextColor, crosshairColor, gridColor, isLight } = options;
  const tipBackground = mixColors(backgroundColor, crosshairColor, isLight ? 0.1 : 0.18);
  const tipTextColor = getContrastColor(tipBackground, "#08111B", "#FFFFFF");
  const tipBorderBase = mixColors(gridColor, backgroundColor, isLight ? 0.45 : 0.25);

  return {
    tipBackground,
    tipTextColor,
    tipTitleColor: tipTextColor,
    tipLabelColor: withAlpha(tipTextColor, isLight ? 0.62 : 0.72),
    tipUnderline: withAlpha(tipTextColor, 0.12),
    tipBorder: withAlpha(tipBorderBase, isLight ? 0.55 : 0.35),
    tipShadow: isLight ? "rgba(19, 23, 34, 0.14)" : "rgba(0, 0, 0, 0.38)",
  };
}
