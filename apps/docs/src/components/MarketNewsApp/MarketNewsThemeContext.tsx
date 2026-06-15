"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MarketNewsLayoutTheme } from "./marketNewsTheme";

const MarketNewsThemeContext = createContext<MarketNewsLayoutTheme>("light");

export function MarketNewsThemeProvider({
  theme,
  children,
}: {
  theme: MarketNewsLayoutTheme;
  children: ReactNode;
}) {
  return <MarketNewsThemeContext.Provider value={theme}>{children}</MarketNewsThemeContext.Provider>;
}

export function useMarketNewsLayoutTheme(): MarketNewsLayoutTheme {
  return useContext(MarketNewsThemeContext);
}
