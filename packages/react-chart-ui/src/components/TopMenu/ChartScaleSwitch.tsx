/* eslint-disable @next/next/no-img-element */
import React, {useState} from "react";
import { TextButton, RadioButton, SelectButton } from "ui";
import styled from "styled-components";

interface ChartScaleSwitchProps {
  chart: any;
  style?: React.CSSProperties;
}

const SelectWrapper = styled.div`
  display: none;
  @media (max-width: 600px) {
    display: flex;
  }
`

const RadioWrapper = styled.div`
  @media (max-width: 600px) {
    display: none;
  }
`

export const ChartScaleSwitch = (props: ChartScaleSwitchProps) => {
  const modes = ["lin", "log", "%"];
  const defaultMode = props.chart ? props.chart.getValueAxisMode() : "lin";

  const [selectedMode, setSelectedMode] = useState(defaultMode);
  const radioButtons = [];
  const selectButtons : any = {};

  for (let mode of modes) {
    radioButtons.push(
      <TextButton
        key={mode}
        id={mode}
        active={selectedMode == mode || (selectedMode === 'perc' && mode === '%')}
        themeContext="radioButton"
      >
        {mode}
      </TextButton>
    );

    selectButtons[mode] = {
      id: mode,
      text: <TextButton themeContext="radioButton">{mode}</TextButton>
    }
  }

  return <>
    <RadioWrapper>
      <RadioButton
        buttons={radioButtons}
        defaultButton="lin"
        currentButton={selectedMode}
        horizontal
        onSelect={changeMode}
      />
    </RadioWrapper>
    <SelectWrapper>
      <SelectButton
        options={selectButtons}
        onSelect={changeMode}
        selectedOption={selectedMode}
      />
    </SelectWrapper>
  </>

  function changeMode(mode: string | undefined) {
    if (mode) {
      props.chart.setValueAxisMode(mode);
      setSelectedMode(mode);
    }
  }
};
