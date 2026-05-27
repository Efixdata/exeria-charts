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

interface ChartSettingsButtonProps {
  chart: NullableChartInstance;
}

export const ChartSettingsButton = (props: ChartSettingsButtonProps) => {
  const [isModalVisible, setModalVisible] = useState(false);

  return (
    <>
      <IconButton
        themeContext="toolbar"
        onClick={() => setModalVisible(true)}
        style={{ marginLeft: 0 }}
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
