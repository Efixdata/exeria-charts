import * as React from "react";
import type { ChartUITheme } from "../chartTypes";

export interface ChartUiSettingsContextValue {
  applyUiTheme?: (theme: Partial<ChartUITheme>) => void;
}

export const ChartUiSettingsContext = React.createContext<ChartUiSettingsContextValue>({});

export const useChartUiSettings = () => React.useContext(ChartUiSettingsContext);
