/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const subscription = props?.chart?.subscribe("AUTOSCALE", (data: any) => {
      setAutoScale(data.autoScale);
    });

    return () => {
      subscription?.unsubscribe();
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
    >
      auto scale
    </TextButton>
  );
};
