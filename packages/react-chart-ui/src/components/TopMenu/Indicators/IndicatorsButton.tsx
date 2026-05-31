/// <reference path="../../../types/react-portal.d.ts" />

import * as React from "react";
import { TextButton, Modal } from "ui";
import { Indicators } from "../../../img/icons";
import { useCallback, useEffect, useState } from "react";
import { IndicatorsDialog } from "./IndicatorsDialog";
import styled from "styled-components";
import { Portal } from "react-portal";
import { usePortalNode } from "../../../hooks/usePortalNode";
import { Icon } from "ui/src/Icon";
import type { NullableChartInstance } from "../../../chartTypes";
import { useChartTranslate } from "../../../hooks/useChartTranslate";
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
  const t = useChartTranslate(props.chart);

  interface Script extends IndicatorDefinition {
    quickAdd?: boolean;
    showAsType?: string;
  }

  const [isModalVisible, setModalVisible] = useState(false);
  const [editScriptId, setEditScriptId] = useState<string | number | null>(null);
  const [indicators, setIndicators] = useState<Script[]>([]);
  const [strategies, setStrategies] = useState<Script[]>([]);
  const [functions, setFunctions] = useState<Script[]>([]);

  const initializeScripts = useCallback(() => {
    if (!props.chart?.getScripts) {
      setIndicators([]);
      setStrategies([]);
      setFunctions([]);
      return;
    }

    const scripts = props.chart.getScripts();

    const tempIndicators: Script[] = [];
    const tempStrategies: Script[] = [];
    const tempFunctions: Script[] = [];

    for (const key in scripts) {
      const script = scripts[key];

      if (!script) {
        continue;
      }

      const showAsStrategies = script.showAsType === "strategies";
      const isCatalogVisible = script.quickAdd !== false || showAsStrategies;

      if (!isCatalogVisible) {
        continue;
      }

      script.key = key;
      script.title = script.title || key;
      script.description = script.description || "";

      if (showAsStrategies) {
        tempStrategies.push(script as Script);
      } else if (script.type === "indicators") {
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
  }, [props.chart]);

  useEffect(() => {
    if (!isModalVisible || !props.chart) {
      return;
    }

    initializeScripts();
  }, [initializeScripts, isModalVisible, props.chart]);

  useEffect(() => {
    if (!props.chart?.subscribe) {
      return;
    }

    const subscription = props.chart.subscribe("INDICATOR_EDIT_REQUEST", (data) => {
      setEditScriptId(data.scriptId);
      setModalVisible(true);
    });

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  }, [props.chart]);

  useEffect(() => {
    if (!props.chart?.subscribe) {
      return;
    }

    const subscription = props.chart.subscribe("LOCALE_CHANGE", () => {
      if (isModalVisible) {
        initializeScripts();
      }
    });

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  }, [props.chart, initializeScripts, isModalVisible]);

  const onClick = () => {
    if (!props.chart) {
      return;
    }

    setEditScriptId(null);
    setModalVisible(true);
    initializeScripts();
  };

  const onClose = () => {
    setModalVisible(false);
    setEditScriptId(null);
  };

  return (
    <>
      <TextButton themeContext="toolbar" onClick={onClick}>
        <Icon themeContext="toolbar">
          <Indicators />
        </Icon>
        <IndicatorsText>{t("toolbar_indicators", "Indicators")}</IndicatorsText>
      </TextButton>
      <Portal node={usePortalNode(document)}>
        <Modal visible={isModalVisible} onCloseOutsideClick={true} onClose={onClose}>
          <IndicatorsDialog
            key={isModalVisible ? String(editScriptId ?? "browse") : "closed"}
            onClose={onClose}
            indicators={indicators}
            functions={functions}
            strategies={strategies}
            chart={props.chart}
            editScriptId={editScriptId}
          />
        </Modal>
      </Portal>
    </>
  );
};
