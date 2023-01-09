// @ts-nocheck
import * as React from "react";
import { TextButton, Modal } from "ui";
import { Indicators } from "../img/icons";
import { useState } from "react";
import { IndicatorsDialog } from "./IndicatorsDialog";
import styled from "styled-components";

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
      <TextButton onClick={onClick}>
        <Indicators style={{ marginRight: 6 }} /> <IndicatorsText>Indicators</IndicatorsText>
      </TextButton>

      <Modal
        visible={isModalVisible}
        onCloseOutsideClick={true}
        onClose={onClose}
      >
        <IndicatorsDialog onClose={onClose} indicators={indicators} chart={props.chart}/>
      </Modal>
    </>
  );
};
