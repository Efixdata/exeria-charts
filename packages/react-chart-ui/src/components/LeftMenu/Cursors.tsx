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

export const Cursors = (props: CursorsProps) => {
  const t = useChartTranslate(props.chart);
  const [selectedCursor, setSelectedCursor] = useState("DEFAULT");

  useEffect(() => {
    const subscription = props?.chart?.subscribe("CURSOR_CHANGE", (data: { cursor: string }) => {
      if (data.cursor === "STAGE") {
        setSelectedCursor("DEFAULT");
      } else {
        setSelectedCursor(data.cursor);
      }
    });

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  }, [props.chart]);

  const onCursorClick = (id: string) => {
    const next = selectedCursor === id && id !== "DEFAULT" ? "DEFAULT" : id;
    setSelectedCursor(next);
    props.chart?.setCursor(next);
  };

  const pointerLabel = t("toolbar_cursor_pointer", "Pointer");
  const crosshairLabel = t("toolbar_cursor_crosshair", "Crosshair");

  return (
    <>
      <IconButton
        id="DEFAULT"
        active={selectedCursor === "DEFAULT"}
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
        active={selectedCursor === "CROSSHAIR"}
        themeContext="toolbar"
        onClick={() => onCursorClick("CROSSHAIR")}
        title={crosshairLabel}
        ariaLabel={crosshairLabel}
        tooltipPlacement="right"
      >
        <Cross />
      </IconButton>
    </>
  );
};
