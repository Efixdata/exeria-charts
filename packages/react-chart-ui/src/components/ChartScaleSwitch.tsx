/* eslint-disable @next/next/no-img-element */
import React, {useState} from "react";
import styled from "styled-components";
import { ButtonSelect, IconButton, TextButton } from "ui";

interface ChartScaleSwitchProps {
  chart: any;
  style?: React.CSSProperties;
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

export const ChartScaleSwitch = (props: ChartScaleSwitchProps) => {
  const modes = ["lin", "log", "%"];
  const defaultMode = props.chart ? props.chart.getValueAxisMode() : "lin";

  const [selectedMode, setSelectedMode] = useState(defaultMode);
  

  const changeMode = (mode: string) => {
    props.chart.setValueAxisMode(mode);
    setSelectedMode(mode);
  };

  const renderScaleModes = () => {
    const buttons = [];

    for (let mode of modes) {
      buttons.push(
        <TextButton
          onClick={() => {
            changeMode(mode);
          }}
          active={selectedMode == mode || (selectedMode === 'perc' && mode === '%')}
        >
          {mode}
        </TextButton>
      );
    }

    return buttons;
  };

  return <Container style={props.style}>{renderScaleModes()}</Container>;
};
