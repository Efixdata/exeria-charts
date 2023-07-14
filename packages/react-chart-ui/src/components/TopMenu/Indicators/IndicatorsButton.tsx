// @ts-nocheck
import * as React from "react";
import { TextButton, Modal } from "ui";
import { Indicators } from "../../../img/icons";
import { useState } from "react";
import { IndicatorsDialog } from "./IndicatorsDialog";
import styled from "styled-components";
import { Portal } from 'react-portal';
import { usePortalNode } from "../../../hooks/usePortalNode";
import { Icon } from "ui/src/Icon";

const IndicatorsText = styled.span`
  @media (max-width: 600px) {
    display: none;
  }
`

export const IndicatorsButton = (props) => {
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [indicators, setIndicators] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [functions, setFunctions] = useState([]);

  const initializeScripts = () => {
    if (functions.length > 0 && indicators.length > 0 && strategies.length > 0) return;

    const scripts = props?.chart?.getScripts();

    const tempIndicators = [];
    const tempStrategies = [];
    const tempFunctions = [];

    for (let i in scripts) {
      const script = scripts[i];

      if (script.quickAdd === false) continue;

      script.key = i;

      if (script.type === 'indicators') {
        tempIndicators.push(script);
      } else if (script.type === 'strategies') {
        tempStrategies.push(script);
      } else if (script.type === 'functions') {
        tempFunctions.push(script);
      }
    }

    setIndicators(tempIndicators);
    setStrategies(tempStrategies);
    setFunctions(tempFunctions);
  }

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
        <Icon themeContext="toolbar" style={{ marginLeft: -6 }}><Indicators/></Icon> <IndicatorsText>Indicators</IndicatorsText>
      </TextButton>
      <Portal node={usePortalNode(document)}>
        <Modal
          visible={isModalVisible}
          onCloseOutsideClick={true}
          onClose={onClose}
        >
          <IndicatorsDialog onClose={onClose} indicators={indicators} chart={props.chart}/>
        </Modal>
      </Portal>
    </>
  );
};
