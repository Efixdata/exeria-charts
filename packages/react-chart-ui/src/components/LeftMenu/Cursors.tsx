import * as React from "react";
import { useEffect, useState } from "react";
import { IconButton } from "ui";
import { Cross, Default } from "../../img/icons/cursors";
import type { NullableChartInstance } from "../../chartTypes";
import { useChartTranslate } from "../../hooks/useChartTranslate";

interface CursorsProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties;
}

const normalizeCursor = (cursor: string) => (cursor === "STAGE" ? "DEFAULT" : cursor);

export const Cursors = (props: CursorsProps) => {
  const t = useChartTranslate(props.chart);
  const [chartCursor, setChartCursor] = useState("DEFAULT");

  useEffect(() => {
    const subscription = props.chart?.subscribe("CURSOR_CHANGE", (data: { cursor: string }) => {
      setChartCursor(normalizeCursor(data.cursor));
    });

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  }, [props.chart]);

  const setCursor = (id: string) => {
    setChartCursor(id);
    props.chart?.setCursor(id);
  };

  const onCursorClick = (id: string) => {
    const next = chartCursor === id && id !== "DEFAULT" ? "DEFAULT" : id;
    setCursor(next);
  };

  const pointerLabel = t("toolbar_cursor_pointer", "Pointer");
  const crosshairLabel = t("toolbar_cursor_crosshair", "Crosshair");

  return (
    <>
      <IconButton
        id="DEFAULT"
        active={chartCursor === "DEFAULT"}
        suppressHoverBackground
        themeContext="toolbar"
        onClick={() => onCursorClick("DEFAULT")}
        title={pointerLabel}
        ariaLabel={pointerLabel}
        tooltipPlacement="right"
      >
        <Default />
      </IconButton>
      <IconButton
        id="CROSSHAIR"
        active={chartCursor === "CROSSHAIR"}
        suppressHoverBackground
        themeContext="toolbar"
        onClick={(event) => {
          if (event.detail >= 2) {
            return;
          }
          onCursorClick("CROSSHAIR");
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setCursor("DEFAULT");
          if (event.currentTarget instanceof HTMLButtonElement) {
            event.currentTarget.blur();
          }
        }}
        title={crosshairLabel}
        ariaLabel={crosshairLabel}
        tooltipPlacement="right"
      >
        <Cross />
      </IconButton>
    </>
  );
};
