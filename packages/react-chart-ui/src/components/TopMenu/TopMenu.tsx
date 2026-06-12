import * as React from "react";
import { useContext, useEffect, useRef, useState } from "react";
import styled, { ThemeContext } from "styled-components";
import { ChartLineUp, CurrencyCircleDollar, Gear, PencilLine } from "phosphor-react";
import { AutoScaleIcon } from "./AutoScaleSwitch";
import type { ValueAxisMode } from "@efixdata/exeria-chart";
import { IconButton, Modal } from "ui";
import { Portal } from "react-portal";
import { usePortalNode } from "../../hooks/usePortalNode";
import { ChartSettingsDialog } from "./ChartSettings/ChartSettingsDialog";
import { ChartScaleSwitch } from "./ChartScaleSwitch";
import { ChartSettingsButton } from "./ChartSettings/ChartSettingsButton";
import { AutoScaleSwitch } from "./AutoScaleSwitch";
import { MainChartTypeSelect } from "./MainChartTypeSelect";
import { FullScreenButton } from "./FullScreenButton";
import { CurrencySwitch } from "./CurrencySwitch";
import { IntervalSwitch } from "./IntervalSwitch";
import { ShareChartButton } from "./ShareChartButton";
import { IndicatorsButton } from "./Indicators/IndicatorsButton";
import { Indicators } from "../../img/icons";
import { Icon } from "ui/src/Icon";
import { TopMenuOverflowMenu, type TopMenuOverflowItem } from "./TopMenuOverflowMenu";
import overflowStyles from "./topMenuOverflow.module.css";
import type { ChartUIMobileLayout, NullableChartInstance, ShareConfig } from "../../chartTypes";
import toolbarStyles from "../toolbar/toolbarLayout.module.css";
import { useChartTranslate } from "../../hooks/useChartTranslate";
import { useChartEnvironment } from "../../hooks/useChartEnvironment";
import { useShareOverflowMenuItem } from "./useShareOverflowMenuItem";

type ScaleModeId = "lin" | "log" | "perc";

const SCALE_MODES: ScaleModeId[] = ["lin", "log", "perc"];

const SCALE_SHORT: Record<ScaleModeId, string> = {
  lin: "Lin",
  log: "Log",
  perc: "%",
};

const SCALE_LABEL_KEYS: Record<ScaleModeId, string> = {
  lin: "scale_linear",
  log: "scale_log",
  perc: "scale_percent",
};

const normalizeScaleMode = (mode: ValueAxisMode | undefined): ScaleModeId => {
  if (mode === "log") return "log";
  if (mode === "perc" || mode === "%") return "perc";
  return "lin";
};

interface TopMenuProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties | undefined;
  mainContainer: React.RefObject<HTMLElement>;
  onIntervalChange?: ((symbol: string) => void) | undefined;
  compact?: boolean | undefined;
  shareConfig?: ShareConfig | undefined;
  drawingToolsVisible?: boolean;
  onToggleDrawingTools?: () => void;
  mobileLayout?: ChartUIMobileLayout;
}

const Container = styled.div<{ $compact?: boolean; $dense?: boolean }>`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${(props) => (props.$dense ? "var(--ui-space-1, 4px)" : "var(--ui-space-2, 8px)")};
  gap: ${(props) => (props.$dense ? "var(--ui-space-1, 4px)" : "var(--ui-toolbar-group-gap, 12px)")};
  background: ${(props) => props.theme.toolbar.background};
  width: ${(props) => (props.$dense ? "100%" : props.$compact ? "fit-content" : "100%")};
  max-width: 100%;
  min-height: ${(props) => (props.$dense ? "36px" : "auto")};
`;

export const TopMenu = (props: TopMenuProps) => {
  // @ts-ignore - styled-components ThemeContext type mismatch with React.useContext
  const tc = useContext(ThemeContext);
  const t = useChartTranslate(props.chart);
  const { isCompact } = useChartEnvironment();
  const compact = props.compact ?? true;
  const dense = isCompact;
  const isMinimalLayout = props.mobileLayout === "minimal";
  const hideIndicatorsInBar = isMinimalLayout && dense;
  const drawingToolsVisible = props.drawingToolsVisible === true;
  const indicatorsTriggerRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoScale, setAutoScale] = useState(() => props.chart?.getAutoScale() ?? true);
  const [scaleMode, setScaleMode] = useState<ScaleModeId>(() =>
    normalizeScaleMode(props.chart?.getValueAxisMode()),
  );

  useEffect(() => {
    const subscription = props.chart?.subscribe("AUTOSCALE", (data: { autoScale: boolean }) => {
      setAutoScale(data.autoScale);
    });

    return () => {
      if (subscription && "unsubscribe" in subscription) {
        subscription.unsubscribe();
      }
    };
  }, [props.chart]);

  useEffect(() => {
    if (!props.chart) {
      return;
    }

    setScaleMode(normalizeScaleMode(props.chart.getValueAxisMode()));
  }, [props.chart]);

  const showShareChartButton = tc?.toolbar?.showShareChartButton === true;
  const showChartScaleSwitch = tc?.toolbar?.showChartScaleSwitch !== false;
  const showCurrency = tc?.toolbar?.showCurrency !== false;

  const shareOverflowItem = useShareOverflowMenuItem({
    chart: props.chart,
    shareConfig: props.shareConfig,
    enabled: dense && showShareChartButton,
  });

  const overflowItems: TopMenuOverflowItem[] = [];

  overflowItems.push({
    id: "autoscale",
    label: t("toolbar_auto_scale", "Auto Scale"),
    icon: <AutoScaleIcon active={autoScale} />,
    trailing: (
      <span className={autoScale ? overflowStyles.stateOn : overflowStyles.stateOff}>
        {autoScale ? t("ui_state_on", "On") : t("ui_state_off", "Off")}
      </span>
    ),
    active: autoScale,
    toggle: true,
    onSelect: () => {
      const next = !autoScale;
      props.chart?.setAutoScale(next);
      setAutoScale(next);
    },
  });

  if (hideIndicatorsInBar) {
    overflowItems.push({
      id: "indicators",
      label: t("toolbar_indicators", "Indicators"),
      icon: (
        <Icon themeContext="toolbar">
          <Indicators />
        </Icon>
      ),
      onSelect: () => {
        indicatorsTriggerRef.current?.querySelector("button")?.click();
      },
    });
  }

  if (showChartScaleSwitch) {
    overflowItems.push({
      id: "scale",
      label: t("toolbar_price_scale", "Price scale"),
      icon: <ChartLineUp size={20} weight="regular" aria-hidden />,
      trailing: SCALE_SHORT[scaleMode],
      submenu: SCALE_MODES.map((mode) => ({
        id: mode,
        label: t(
          SCALE_LABEL_KEYS[mode],
          mode === "lin" ? "Linear scale" : mode === "log" ? "Log scale" : "Percent scale",
        ),
      })),
      selectedSubmenuId: scaleMode,
      onSubmenuSelect: (id) => {
        const mode = id as ScaleModeId;
        props.chart?.setValueAxisMode(mode);
        setScaleMode(mode);
      },
    });
  }

  overflowItems.push({
    id: "settings",
    label: t("toolbar_chart_settings", "Chart Settings"),
    icon: <Gear size={20} weight="regular" aria-hidden />,
    onSelect: () => setSettingsOpen(true),
  });

  if (shareOverflowItem) {
    overflowItems.push(shareOverflowItem);
  }

  if (dense && showCurrency) {
    overflowItems.push({
      id: "currency",
      label: t("toolbar_currency", "Currency"),
      icon: <CurrencyCircleDollar size={20} weight="regular" aria-hidden />,
      trailing: props.chart?.getCurrency() ?? "—",
      readonly: true,
    });
  }

  const compactChartControls = (
    <>
      <div
        className={toolbarStyles.toolbarGroup}
        role="group"
        aria-label={t("toolbar_group_chart_type_interval", "Chart type and interval")}
      >
        <MainChartTypeSelect chart={props.chart} />
        <IntervalSwitch chart={props.chart} onIntervalChange={props.onIntervalChange} />
      </div>

      {!hideIndicatorsInBar ? (
        <div
          className={toolbarStyles.toolbarGroup}
          role="group"
          aria-label={t("toolbar_indicators", "Indicators")}
        >
          <IndicatorsButton chart={props.chart} />
        </div>
      ) : null}

      <FullScreenButton chart={props.chart} mainContainer={props.mainContainer} />
      {overflowItems.length > 0 ? (
        <TopMenuOverflowMenu
          chart={props.chart}
          items={overflowItems}
          portalContainer={props.mainContainer}
        />
      ) : null}
    </>
  );

  return (
    <Container
      $compact={compact}
      $dense={dense}
      style={props.style}
      className={dense ? "chart-toolbar-dense" : undefined}
      role="toolbar"
      aria-label={t("toolbar_chart_toolbar", "Chart toolbar")}
    >
      {hideIndicatorsInBar ? (
        <div ref={indicatorsTriggerRef} className={overflowStyles.srOnly} aria-hidden>
          <IndicatorsButton chart={props.chart} />
        </div>
      ) : null}
      {dense ? (
        <div className={toolbarStyles.compactToolbar}>
          <div className={toolbarStyles.toolbarGroupStart}>
            <IconButton
              themeContext="toolbar"
              active={drawingToolsVisible}
              title={t("toolbar_drawing_tools", "Drawing tools")}
              ariaLabel={t("toolbar_drawing_tools", "Drawing tools")}
              ariaPressed={drawingToolsVisible}
              onClick={props.onToggleDrawingTools}
            >
              <PencilLine size={20} weight="regular" />
            </IconButton>
          </div>
          <div className={toolbarStyles.toolbarRowCompact}>{compactChartControls}</div>
        </div>
      ) : (
        <div
          className={toolbarStyles.toolbarRow}
          style={{ flex: compact ? "0 1 auto" : "1 1 auto" }}
        >
          <div
            className={toolbarStyles.toolbarGroup}
            role="group"
            aria-label={t("toolbar_group_chart_type_interval", "Chart type and interval")}
          >
            <MainChartTypeSelect chart={props.chart} />
            <IntervalSwitch chart={props.chart} onIntervalChange={props.onIntervalChange} />
          </div>

          {!hideIndicatorsInBar ? (
            <>
              <div className={toolbarStyles.toolbarDivider} aria-hidden="true" />

              <div
                className={toolbarStyles.toolbarGroup}
                role="group"
                aria-label={t("toolbar_indicators", "Indicators")}
              >
                <IndicatorsButton chart={props.chart} />
              </div>
            </>
          ) : null}

          <div className={toolbarStyles.toolbarGroupActions}>
            <div
              className={toolbarStyles.toolbarGroup}
              role="group"
              aria-label={t("toolbar_group_scale", "Scale")}
            >
              <AutoScaleSwitch chart={props.chart} />
            </div>

            <div className={toolbarStyles.toolbarDivider} aria-hidden="true" />

            <div
              className={toolbarStyles.toolbarGroup}
              role="group"
              aria-label={t("toolbar_group_chart_actions", "Chart actions")}
            >
              {showChartScaleSwitch ? <ChartScaleSwitch chart={props.chart} /> : null}
              <ChartSettingsButton chart={props.chart} />
              <FullScreenButton chart={props.chart} mainContainer={props.mainContainer} />
              {showShareChartButton ? (
                <ShareChartButton chart={props.chart} shareConfig={props.shareConfig} />
              ) : null}
            </div>
          </div>
        </div>
      )}
      {!dense && showCurrency ? <CurrencySwitch chart={props.chart} /> : null}
      {dense && settingsOpen ? (
        <Portal node={usePortalNode(document)}>
          <Modal visible onCloseOutsideClick onClose={() => setSettingsOpen(false)}>
            <ChartSettingsDialog chart={props.chart} onClose={() => setSettingsOpen(false)} />
          </Modal>
        </Portal>
      ) : null}
    </Container>
  );
};
