/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { TextButton } from "ui";

interface AutoScaleSwitchProps {
  chart: any;
  style?: React.CSSProperties;
}

export const AutoScaleSwitch = (props: AutoScaleSwitchProps) => {
  const defaultAutoScaleValue = props.chart ? props.chart.getAutoScale() : true;

  const [autoScale, setAutoScale] = useState(defaultAutoScaleValue);

  const changeMode = () => {
    props.chart.setAutoScale(!autoScale);
    setAutoScale(!autoScale);
  };

  return (
    <TextButton
      style={props.style}
      onClick={() => {
        changeMode();
      }}
      active={autoScale}
    >
      auto scale
    </TextButton>
  );
};
