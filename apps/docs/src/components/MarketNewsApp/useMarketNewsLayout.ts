import { useEffect } from "react";

const LAYOUT_ATTR = "data-market-news-app";

/** Hides docs chrome but keeps the page scrollable (unlike terminal starters). */
export function useMarketNewsLayout(): void {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute(LAYOUT_ATTR, "");

    return () => {
      html.removeAttribute(LAYOUT_ATTR);
    };
  }, []);
}
