/// <reference path="../../../types/react-portal.d.ts" />

import * as React from "react";
import { useState } from "react";
import { IconButton } from "ui";
import { Settings } from "../../../img/icons";
import { Portal } from "react-portal";
import { Modal } from "ui";
import { usePortalNode } from "../../../hooks/usePortalNode";
import type { NullableChartInstance } from "../../../chartTypes";
import { ChartSettingsDialog } from "./ChartSettingsDialog";
import { useChartTranslate } from "../../../hooks/useChartTranslate";

interface ChartSettingsButtonProps {
  chart: NullableChartInstance;
}

export const ChartSettingsButton = (props: ChartSettingsButtonProps) => {
  const t = useChartTranslate(props.chart);
  const [isModalVisible, setModalVisible] = useState(false);
  const label = t("toolbar_chart_settings", "Chart settings");

  return (
    <>
      <IconButton
        themeContext="toolbar"
        onClick={() => setModalVisible(true)}
        title={label}
        ariaLabel={label}
      >
        <Settings />
      </IconButton>
      <Portal node={usePortalNode(document)}>
        <Modal visible={isModalVisible} onCloseOutsideClick onClose={() => setModalVisible(false)}>
          {isModalVisible ? (
            <ChartSettingsDialog chart={props.chart} onClose={() => setModalVisible(false)} />
          ) : null}
        </Modal>
      </Portal>
    </>
  );
};
