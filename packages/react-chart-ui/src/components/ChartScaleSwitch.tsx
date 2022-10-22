/* eslint-disable @next/next/no-img-element */
import React, {useState} from "react";
import { TextButton, RadioButton } from "ui";

interface ChartScaleSwitchProps {
  chart: any;
  style?: React.CSSProperties;
}

export const ChartScaleSwitch = (props: ChartScaleSwitchProps) => {
  const modes = ["lin", "log", "%"];
  const defaultMode = props.chart ? props.chart.getValueAxisMode() : "lin";

  const [selectedMode, setSelectedMode] = useState(defaultMode);
  const buttons = [];

  for (let mode of modes) {
    buttons.push(
      <TextButton
        key={mode}
        id={mode}
        active={selectedMode == mode || (selectedMode === 'perc' && mode === '%')}
      >
        {mode}
      </TextButton>
    );
  }

  return <RadioButton
    buttons={buttons}
    defaultButton="lin"
    currentButton={selectedMode}
    horizontal
    onSelect={changeMode}
  />;

  function changeMode(mode: string) {
    props.chart.setValueAxisMode(mode);
    setSelectedMode(mode);
  }
};
