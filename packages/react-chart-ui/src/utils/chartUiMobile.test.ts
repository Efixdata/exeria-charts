import { describe, expect, it, vi } from "vitest";

vi.mock("@efixdata/exeria-chart", () => ({
  configureChartEnvironment: vi.fn(),
}));

vi.mock("ui/designTokens", () => ({
  UI_TOOLBAR: { mobileBreakpoint: 600 },
}));

import { getChartUiSafeAreaPadding } from "./chartUiMobile";

describe("getChartUiSafeAreaPadding", () => {
  it("returns safe-area env() padding when edgeInset is zero", () => {
    expect(getChartUiSafeAreaPadding(0)).toEqual({
      paddingTop: "env(safe-area-inset-top, 0px)",
      paddingRight: "env(safe-area-inset-right, 0px)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      paddingLeft: "env(safe-area-inset-left, 0px)",
    });
  });

  it("adds edgeInset to each safe-area side", () => {
    expect(getChartUiSafeAreaPadding(8)).toEqual({
      paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
      paddingRight: "calc(env(safe-area-inset-right, 0px) + 8px)",
      paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
      paddingLeft: "calc(env(safe-area-inset-left, 0px) + 8px)",
    });
  });
});
