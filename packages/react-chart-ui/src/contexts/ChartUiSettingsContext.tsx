import * as React from "react";
import type { ChartUITheme } from "../chartTypes";

export interface ApplyUiThemeOptions {
  /** Replace accumulated overrides instead of merging (used by theme presets). */
  replace?: boolean;
}

export interface ChartUiSettingsContextValue {
  applyUiTheme?: (theme: Partial<ChartUITheme>, options?: ApplyUiThemeOptions) => void;
}

export const ChartUiSettingsContext = React.createContext<ChartUiSettingsContextValue>({});

export const useChartUiSettings = () => React.useContext(ChartUiSettingsContext);
