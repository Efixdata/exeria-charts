import * as React from "react";
import { IconButton } from "ui";
import { Fullscreen, ExitFullscreen } from "../../img/icons";
import { useState } from "react";
import type { NullableChartInstance } from "../../chartTypes";
import { useChartTranslate } from "../../hooks/useChartTranslate";

interface FullScreenButtonProps {
  mainContainer: React.RefObject<HTMLElement>;
  chart?: NullableChartInstance;
}

export const FullScreenButton = (props: FullScreenButtonProps) => {
  const t = useChartTranslate(props.chart);
  const [isInFullScreen, setFullScreen] = useState(false);
  const icon = isInFullScreen ? <ExitFullscreen /> : <Fullscreen />;
  const label = isInFullScreen
    ? t("toolbar_fullscreen_exit", "Exit full screen")
    : t("toolbar_fullscreen_enter", "Full screen");

  const eventTypes = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "msfullscreenchange",
  ];

  React.useEffect(() => {
    const container = props?.mainContainer?.current;
    if (!container) return;
    eventTypes.forEach((eventType) =>
      container.addEventListener(eventType, () => {
        setFullScreen(checkFullScreen());
      })
    );
  }, []);

  const checkFullScreen = () => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    };

    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  };

  const isFullScreenAvailable = () => {
    const doc = document as Document & {
      webkitFullscreenEnabled?: boolean;
      msFullscreenEnabled?: boolean;
    };

    return (
      doc.fullscreenEnabled /* Standard syntax */ ||
      !!doc.webkitFullscreenEnabled /* Safari */ ||
      !!doc.msFullscreenEnabled /* IE11 */
    );
  };

  const onClick = () => {
    if (!document) return;
    const mainContainerElement = props.mainContainer.current as (HTMLElement & {
      mozRequestFullScreen?: () => void;
      webkitRequestFullScreen?: () => void;
      msRequestFullscreen?: () => void;
    }) | null;
    if (!mainContainerElement) return;

    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      mozCancelFullScreen?: () => void;
      msExitFullscreen?: () => Promise<void> | void;
    };

    if (!isInFullScreen) {
      if (mainContainerElement.requestFullscreen) {
        mainContainerElement.requestFullscreen();
      } else if (mainContainerElement.mozRequestFullScreen) {
        mainContainerElement.mozRequestFullScreen();
      } else if (mainContainerElement.webkitRequestFullScreen) {
        mainContainerElement.webkitRequestFullScreen();
      } else if (mainContainerElement.msRequestFullscreen) {
        mainContainerElement.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  if (isFullScreenAvailable()) {
    return (
      <IconButton
        onClick={onClick}
        themeContext="toolbar"
        title={label}
        ariaLabel={label}
        ariaPressed={isInFullScreen}
      >
        {icon}
      </IconButton>
    );
  }

  return null;
};
