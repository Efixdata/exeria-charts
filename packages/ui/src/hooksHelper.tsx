import * as React from "react";

export const CHART_UI_OVERLAY_ATTRIBUTE = "data-chart-ui-overlay";

const isChartUiOverlayClick = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest(`[${CHART_UI_OVERLAY_ATTRIBUTE}]`));
};

export function useOnClick(ref: any, handler: any) {
  React.useEffect(() => {
    const listener = (event: any) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }

      if (isChartUiOverlayClick(event.target)) {
        return;
      }

      handler(event);
    };

    document.addEventListener("mousedown", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [handler, ref]);
}
