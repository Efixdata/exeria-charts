import * as React from "react";
import { TextButton, Modal } from "ui";
import { Indicators } from "../../../img/icons";
import { useState } from "react";
import { IndicatorsDialog } from "./IndicatorsDialog";
import styled from "styled-components";
import { Portal } from "react-portal";
import { usePortalNode } from "../../../hooks/usePortalNode";
import { Icon } from "ui/src/Icon";
import type { NullableChartInstance } from "../../../chartTypes";
import type { IndicatorDefinition } from "./IndicatorsDialog";

const IndicatorsText = styled.span`
  @media (max-width: 600px) {
    display: none;
  }
`;

interface IndicatorsButtonProps {
  chart: NullableChartInstance;
}

export const IndicatorsButton = (props: IndicatorsButtonProps) => {
  interface Script extends IndicatorDefinition {
    quickAdd?: boolean;
  }

  const [isModalVisible, setModalVisible] = useState(false);
  const [indicators, setIndicators] = useState<Script[]>([]);
  const [strategies, setStrategies] = useState<Script[]>([]);
  const [functions, setFunctions] = useState<Script[]>([]);

  const initializeScripts = () => {
    if (functions.length > 0 && indicators.length > 0 && strategies.length > 0) return;

    const scripts = props?.chart?.getScripts() || {};

    const tempIndicators: Script[] = [];
    const tempStrategies: Script[] = [];
    const tempFunctions: Script[] = [];

    for (let i in scripts) {
      const script = scripts[i];

      if (script.quickAdd === false) continue;

      script.key = i;
      script.title = script.title || i;
      script.description = script.description || "";

      if (script.type === "indicators") {
        tempIndicators.push(script as Script);
      } else if (script.type === "strategies") {
        tempStrategies.push(script as Script);
      } else if (script.type === "functions") {
        tempFunctions.push(script as Script);
      }
    }

    setIndicators(tempIndicators);
    setStrategies(tempStrategies);
    setFunctions(tempFunctions);
  };

  const onClick = () => {
    setModalVisible(true);
    initializeScripts();
  };

  const onClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <TextButton themeContext="toolbar" onClick={onClick}>
        <Icon themeContext="toolbar" style={{ marginLeft: -6 }}>
          <Indicators />
        </Icon>
        <IndicatorsText>Indicators</IndicatorsText>
      </TextButton>
      <Portal node={usePortalNode(document)}>
        <Modal visible={isModalVisible} onCloseOutsideClick={true} onClose={onClose}>
          <IndicatorsDialog onClose={onClose} indicators={indicators} chart={props.chart} />
        </Modal>
      </Portal>
    </>
  );
};
