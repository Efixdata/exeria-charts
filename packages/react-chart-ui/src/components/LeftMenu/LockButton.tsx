import * as React from "react";
import { IconButton } from "ui";
import { Lock, LockOpen } from "../../img/icons";
import { useState, useEffect } from "react";
import type { NullableChartInstance } from "../../chartTypes";

interface LockButtonProps {
  chart: NullableChartInstance;
}

export const LockButton = (props: LockButtonProps) => {
  const [isObjectSelectionAllowed, setObjectSelectionAllowed] = useState(false);
  const icon = isObjectSelectionAllowed ? <LockOpen /> : <Lock />;

  useEffect(() => {
    const subscription = props?.chart?.subscribe(
      "OBJECT_SELECTION_ALLOWED_CHANGE",
      (data: boolean) => {
        setObjectSelectionAllowed(data);
      }
    );

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  });

  const onClick = () => {
    if (!props.chart) return;

    if (isObjectSelectionAllowed) {
      props.chart.setObjectSelectionAllowed(false);
      setObjectSelectionAllowed(false);
    } else {
      props.chart.setObjectSelectionAllowed(true);
      setObjectSelectionAllowed(true);
    }
  };

  return (
    <IconButton onClick={onClick} themeContext="toolbar">
      {icon}
    </IconButton>
  );
};
