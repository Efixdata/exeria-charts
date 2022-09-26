/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import styled from "styled-components";
import { IconButton } from "ui";

interface DrawingToolProps {
    onToolSelected: () => void;
    onDrawingFinished: () => void;
    imageSource: string;
    chart: any;
    tool: any;
    style?: React.CSSProperties;
    active?: boolean;
}


export const DrawingTool = (props: DrawingToolProps) => {

  const onClick = () => {
    const interactor = props.chart.getInteractor();
		if (interactor.currentMode && interactor.currentMode.onCancel) interactor.currentMode.onCancel();
		interactor.setMode('STAGE', { ...props.tool }, props.onDrawingFinished);

    props.onToolSelected();
		// this.setActiveTool();
		// this.setActiveTool(tool);
  }

  return (<IconButton 
    image={props.imageSource}
    onClick={onClick}
    active={props.active}
  />);
};
