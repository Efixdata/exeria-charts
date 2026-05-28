import * as React from "react";
import styled from "styled-components";
import { Cursors } from "./Cursors";
import {
  AnnotationToolsSplit,
  DrawingToolsProvider,
  MainDrawingTools,
} from "./DrawingTools";
import { LockButton } from "./LockButton";
import { MagnetButton } from "./MagnetButton";
import type { NullableChartInstance } from "../../chartTypes";
import toolbarStyles from "../toolbar/toolbarLayout.module.css";
import { useChartTranslate } from "../../hooks/useChartTranslate";

const Container = styled.div`
  box-sizing: border-box;
  background: ${(props) => props.theme.toolbar.background || "#100c22"};
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: var(--ui-left-menu-width, 44px);
  height: 100%;
  min-height: 0;
  overflow: visible;
`;

interface LeftMenuProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties;
}

export const LeftMenu = (props: LeftMenuProps) => {
  const t = useChartTranslate(props.chart);

  return (
    <Container style={props.style} role="toolbar" aria-label={t("toolbar_drawing_tools", "Drawing tools")}>
      <DrawingToolsProvider chart={props.chart}>
        <div className={toolbarStyles.leftMenuScroll}>
          <div className={toolbarStyles.leftMenuStack}>
            <div className={toolbarStyles.leftMenuSection}>
              <Cursors chart={props.chart} />
              <MagnetButton chart={props.chart} />
              <LockButton chart={props.chart} />
            </div>

            <div className={toolbarStyles.leftMenuDivider} aria-hidden="true" />

            <AnnotationToolsSplit />

            <div className={toolbarStyles.leftMenuDivider} aria-hidden="true" />

            <div className={toolbarStyles.leftMenuSection}>
              <MainDrawingTools />
            </div>
          </div>
        </div>
      </DrawingToolsProvider>
    </Container>
  );
};
