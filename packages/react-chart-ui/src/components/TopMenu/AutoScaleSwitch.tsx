/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { useEffect, useState } from "react";
import { IconButton } from "ui";
import type { NullableChartInstance } from "../../chartTypes";
import { useChartTranslate } from "../../hooks/useChartTranslate";

interface AutoScaleSwitchProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties;
}

export const AutoScaleIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M10 4v12M6 8l4-4 4 4M6 12l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 17h14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity={active ? 1 : 0.45}
    />
  </svg>
);

export const AutoScaleSwitch = (props: AutoScaleSwitchProps) => {
  const t = useChartTranslate(props.chart);
  const defaultAutoScaleValue = props.chart ? props.chart.getAutoScale() : true;
  const [autoScale, setAutoScale] = useState(defaultAutoScaleValue);

  const changeMode = () => {
    props.chart?.setAutoScale(!autoScale);
    setAutoScale(!autoScale);
  };

  useEffect(() => {
    const subscription = props?.chart?.subscribe("AUTOSCALE", (data) => {
      setAutoScale(data.autoScale);
    });

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  });

  return (
    <IconButton
      style={props.style}
      onClick={changeMode}
      active={autoScale}
      suppressHoverBackground
      themeContext="toolbar"
      title={t("toolbar_auto_scale", "Auto scale")}
      ariaLabel={t("toolbar_auto_scale", "Auto scale")}
      ariaPressed={autoScale}
    >
      <AutoScaleIcon active={autoScale} />
    </IconButton>
  );
};
