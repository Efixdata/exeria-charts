// @ts-nocheck
import * as React from "react";
import { IconButton } from "ui";
import fullScreenImage from "../img/icons/fullscreen_white.svg";
import exitFullScreenImage from "../img/icons/fullscreen-exit_white.svg";
import { useState } from "react";
export const FullScreenButton = (props) => {
  const [icon, setIcon] = useState(fullScreenImage.src);

  React.useEffect(() => {
    if (!props?.mainContainer?.current) return;

    props.mainContainer.current.addEventListener(
      "fullscreenchange",
      (_event) => {
        if (isInFullScreen()) {
          setIcon(exitFullScreenImage.src);
        } else {
          setIcon(fullScreenImage.src);
        }
      }
    );
  }, []);

  const isInFullScreen = () => {
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

    if (!isInFullScreen()) {
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

  return <IconButton image={icon} onClick={onClick} />;
};
