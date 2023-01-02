// @ts-nocheck
import * as React from "react";
import { IconButton } from "ui";
import { Fullscreen, ExitFullscreen } from "../img/icons";
import { useState } from "react";

export const FullScreenButton = (props) => {
  const [isInFullScreen, setFullScreen] = useState(false);
  const icon = isInFullScreen ? <ExitFullscreen /> : <Fullscreen />;
  
  const eventTypes = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "msfullscreenchange",
  ];

  React.useEffect(() => {
    if (!props?.mainContainer?.current) return;
    eventTypes.forEach((eventType) =>
      props.mainContainer.current.addEventListener(eventType, (_event) => {
        setFullScreen(checkFullScreen());
      })
    );
  }, []);

  const checkFullScreen = () => {
    if (!document) return false;

    return (
      (document.fullscreenElement && document.fullscreenElement !== null) ||
      (document.webkitFullscreenElement &&
        document.webkitFullscreenElement !== null) ||
      (document.mozFullScreenElement &&
        document.mozFullScreenElement !== null) ||
      (document.msFullscreenElement && document.msFullscreenElement !== null)
    );
  };

  const onClick = () => {
    if (!document) return;
    const mainContainerElement = props.mainContainer.current;

    if (!isInFullScreen) {
      // setIcon(exitFullScreenImage.src);
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
      // setIcon(fullScreenImage.src);
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  return (
    <IconButton onClick={onClick}>
      { icon }
    </IconButton>
  )
};
