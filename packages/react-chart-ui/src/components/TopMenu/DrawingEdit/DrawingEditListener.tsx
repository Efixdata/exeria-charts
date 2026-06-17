import * as React from "react";
import { useEffect, useState } from "react";
import { Modal } from "ui";
import { Portal } from "react-portal";
import { usePortalNode } from "../../../hooks/usePortalNode";
import type { NullableChartInstance } from "../../../chartTypes";
import { DrawingSettingsDialog } from "./DrawingSettingsDialog";

interface DrawingEditListenerProps {
  chart: NullableChartInstance;
}

export const DrawingEditListener = (props: DrawingEditListenerProps) => {
  const [objectId, setObjectId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!props.chart?.subscribe) {
      return;
    }

    const subscription = props.chart.subscribe("DRAWING_EDIT_REQUEST", (data) => {
      setObjectId(data.objectId);
    });

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  }, [props.chart]);

  const onClose = () => {
    setObjectId(null);
  };

  if (objectId == null) {
    return null;
  }

  return (
    <Portal node={usePortalNode(document)}>
      <Modal visible onCloseOutsideClick onClose={onClose}>
        <DrawingSettingsDialog
          key={String(objectId)}
          chart={props.chart}
          objectId={objectId}
          onClose={onClose}
        />
      </Modal>
    </Portal>
  );
};
