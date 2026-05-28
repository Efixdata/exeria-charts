import * as React from "react";
import { useEffect, useState } from "react";
import { IconButton } from "ui";
import { Lock, LockOpen } from "../../img/icons";
import type { NullableChartInstance } from "../../chartTypes";
import { useChartTranslate } from "../../hooks/useChartTranslate";

interface LockButtonProps {
  chart: NullableChartInstance;
}

export const LockButton = (props: LockButtonProps) => {
  const t = useChartTranslate(props.chart);
  const [allLocked, setAllLocked] = useState(false);

  useEffect(() => {
    if (props.chart?.getAllDrawingsLocked) {
      setAllLocked(props.chart.getAllDrawingsLocked());
    }

    const subscription = props.chart?.subscribe("DRAWINGS_LOCK_CHANGE", (data: { allLocked: boolean }) => {
      setAllLocked(data.allLocked);
    });

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  }, [props.chart]);

  const onClick = () => {
    if (!props.chart) return;

    if (allLocked) {
      props.chart.unlockAllDrawings?.();
    } else {
      props.chart.lockAllDrawings?.();
    }
  };

  const icon = allLocked ? <Lock /> : <LockOpen />;

  return (
    <IconButton
      onClick={onClick}
      active={allLocked}
      themeContext="toolbar"
      title={
        allLocked
          ? t("drawings_unlock_all", "Unlock all drawings")
          : t("drawings_lock_all", "Lock all drawings")
      }
      tooltipPlacement="right"
    >
      {icon}
    </IconButton>
  );
};
