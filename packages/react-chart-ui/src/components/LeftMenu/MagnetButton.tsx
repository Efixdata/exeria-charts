import * as React from "react";
import { useEffect, useState } from "react";
import { IconButton } from "ui";
import { Magnet } from "../../img/icons";
import type { NullableChartInstance } from "../../chartTypes";
import { useChartTranslate } from "../../hooks/useChartTranslate";

interface MagnetButtonProps {
  chart: NullableChartInstance;
}

export const MagnetButton = (props: MagnetButtonProps) => {
  const t = useChartTranslate(props.chart);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (props.chart?.getDrawingMagnetEnabled) {
      setEnabled(props.chart.getDrawingMagnetEnabled());
    }

    const subscription = props.chart?.subscribe("DRAWING_MAGNET_CHANGE", (data: { enabled: boolean }) => {
      setEnabled(data.enabled);
    });

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  }, [props.chart]);

  const onClick = () => {
    if (!props.chart?.setDrawingMagnetEnabled) return;
    props.chart.setDrawingMagnetEnabled(!enabled);
  };

  return (
    <IconButton
      onClick={onClick}
      active={enabled}
      suppressHoverBackground
      themeContext="toolbar"
      title={
        enabled
          ? t("magnet_disable", "Disable magnet (OHLC snap)")
          : t("magnet_enable", "Enable magnet (OHLC snap)")
      }
      tooltipPlacement="right"
    >
      <Magnet />
    </IconButton>
  );
};
