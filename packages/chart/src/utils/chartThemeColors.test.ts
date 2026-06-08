import { describe, expect, it } from "vitest";
import { getContrastColor, resolveChartTipThemeColors } from "./chartThemeColors";

describe("resolveChartTipThemeColors", () => {
  it("uses dark text on light paper-like tooltip background", () => {
    const colors = resolveChartTipThemeColors({
      backgroundColor: "#FFFDF8",
      axisTextColor: "#3D3929",
      crosshairColor: "#B45309",
      gridColor: "#E8E4DC",
      isLight: true,
    });

    expect(getContrastColor(colors.tipBackground)).toBe("#08111B");
    expect(colors.tipTextColor).toBe("#08111B");
    expect(colors.tipTitleColor).toBe("#08111B");
  });

  it("uses light text on dark tooltip background", () => {
    const colors = resolveChartTipThemeColors({
      backgroundColor: "#131722",
      axisTextColor: "#D1D4DC",
      crosshairColor: "#2962FF",
      gridColor: "#2A2E39",
      isLight: false,
    });

    expect(colors.tipTextColor).toBe("#FFFFFF");
  });
});
