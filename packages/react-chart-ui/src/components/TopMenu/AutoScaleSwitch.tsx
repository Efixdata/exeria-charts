/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { useEffect, useState } from "react";
import { TextButton } from "ui";
import type { NullableChartInstance } from "../../chartTypes";

interface AutoScaleSwitchProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties;
}

export const AutoScaleSwitch = (props: AutoScaleSwitchProps) => {
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
    <TextButton
      //@ts-ignore
      style={props.style}
      onClick={() => {
        changeMode();
      }}
      active={autoScale}
      themeContext="toolbar"
    >
      auto scale
    </TextButton>
  );
};
