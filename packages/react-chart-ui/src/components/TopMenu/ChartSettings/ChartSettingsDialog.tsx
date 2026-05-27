import * as React from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import { DialogBody, DialogContainer, DialogHeader, Label, TextButton } from "ui";
import { Eye, EyeSlash, X } from "phosphor-react";
import { ThemeContext } from "styled-components";
import type {
  ChartAppearanceSettings,
  ChartDrawingSettingsItem,
  ChartGridLineStyle,
  ChartGridMode,
  ChartIndicatorSettingsItem,
  ChartStrategySettingsItem,
  ChartVolumeColorMode,
  ChartVolumeSettings,
} from "@efixdata/exeria-chart";
import { Remove } from "../../../img/icons";
import { Icon } from "ui/src/Icon";
import type { NullableChartInstance } from "../../../chartTypes";
import { DialogSelect, type DialogSelectOption } from "../Indicators/DialogSelect";
import { useChartUiSettings } from "../../../contexts/ChartUiSettingsContext";
import { CHART_SETTINGS_PRESETS } from "./chartSettingsPresets";
import { ColorField } from "./ColorField";
import styles from "./chartSettings.module.css";

interface ChartSettingsDialogProps {
  chart: NullableChartInstance;
  onClose: () => void;
}

type ChartWithSettings = NullableChartInstance & {
  getChartAppearanceSettings?: () => ChartAppearanceSettings;
  applyChartAppearanceSettings?: (settings: ChartAppearanceSettings) => void;
  getChartVolumeSettings?: () => ChartVolumeSettings;
  applyChartVolumeSettings?: (settings: ChartVolumeSettings) => void;
  getChartIndicatorSettings?: () => ChartIndicatorSettingsItem[];
  setChartIndicatorVisibility?: (scriptId: string | number, visible: boolean) => void;
  setChartIndicatorPriceTagVisibility?: (scriptId: string | number, visible: boolean) => void;
  removeChartIndicator?: (scriptId: string | number) => void;
  getChartStrategySettings?: () => ChartStrategySettingsItem[];
  setChartStrategyVisibility?: (scriptId: string | number, visible: boolean) => void;
  removeChartStrategy?: (scriptId: string | number) => void;
  getChartDrawingSettings?: () => ChartDrawingSettingsItem[];
  setChartDrawingVisibility?: (objectId: string | number, visible: boolean) => void;
  removeChartDrawing?: (objectId: string | number) => void;
  importChartSettingsTemplate?: (template: import("@efixdata/exeria-chart").ChartSettingsTemplate) => void;
};

type LayersTab = "indicators" | "strategies" | "drawings";

const GRID_MODE_OPTIONS: { id: ChartGridMode; label: string }[] = [
  { id: "both", label: "Horizontal & vertical" },
  { id: "horizontal", label: "Horizontal" },
  { id: "vertical", label: "Vertical" },
  { id: "none", label: "Hidden" },
];

const GRID_LINE_STYLE_OPTIONS: { id: ChartGridLineStyle; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "dashed", label: "Dashed" },
];

const VOLUME_COLOR_MODE_OPTIONS: { id: ChartVolumeColorMode; label: string }[] = [
  { id: "candle", label: "Match candles" },
  { id: "single", label: "Single color" },
];

const SettingsSection = (props: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <section className={styles.section}>
    <div className={styles.sectionHeader}>
      <h3 className={styles.sectionTitle}>{props.title}</h3>
      {props.hint ? <p className={styles.sectionHint}>{props.hint}</p> : null}
    </div>
    <div className={styles.sectionBody}>{props.children}</div>
  </section>
);

const VisibilityToggle = (props: {
  active: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    aria-label={props.label}
    title={props.label}
    onClick={() => props.onChange(!props.active)}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      padding: 0,
      border: "none",
      background: "transparent",
      cursor: "pointer",
      color: "inherit",
    }}
  >
    {props.active ? <Eye size={18} weight="regular" /> : <EyeSlash size={18} weight="regular" />}
  </button>
);

const CompactVisibility = (props: {
  hint: string;
  active: boolean;
  showLabel: string;
  hideLabel: string;
  onChange: (next: boolean) => void;
}) => (
  <div className={styles.visibilityCompact}>
    <span className={styles.visibilityCompactHint}>{props.hint}</span>
    <VisibilityToggle
      active={props.active}
      label={props.active ? props.hideLabel : props.showLabel}
      onChange={props.onChange}
    />
  </div>
);

const IconActionButton = (props: { label: string; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    aria-label={props.label}
    title={props.label}
    onClick={props.onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      padding: 0,
      border: "none",
      background: "transparent",
      cursor: "pointer",
    }}
  >
    {props.children}
  </button>
);

export const ChartSettingsDialog = (props: ChartSettingsDialogProps) => {
  const chart = props.chart as ChartWithSettings;
  const { applyUiTheme } = useChartUiSettings();
  // @ts-ignore styled-components theme mismatch
  const themeContext = useContext(ThemeContext);

  const [appearance, setAppearance] = useState<ChartAppearanceSettings | null>(null);
  const [volume, setVolume] = useState<ChartVolumeSettings | null>(null);
  const [indicators, setIndicators] = useState<ChartIndicatorSettingsItem[]>([]);
  const [strategies, setStrategies] = useState<ChartStrategySettingsItem[]>([]);
  const [drawings, setDrawings] = useState<ChartDrawingSettingsItem[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [layersTab, setLayersTab] = useState<LayersTab>("indicators");

  const accentColor = themeContext?.dialog?.accentColor || themeContext?.accent || "#21C1F2";
  const mutedColor = themeContext?.dialog?.textColor || "#fff";
  const dividerColor = themeContext?.dialog?.dividerColor || "rgba(255,255,255,0.12)";

  const cssVars = {
    "--cs-border": dividerColor,
    "--cs-border-subtle": `${dividerColor}88`,
    "--cs-text": mutedColor,
    "--cs-muted": `${mutedColor}99`,
    "--cs-title": themeContext?.dialog?.titleColor || mutedColor,
    "--cs-accent": accentColor,
    "--cs-section-bg": "rgba(255, 255, 255, 0.03)",
    "--cs-card-bg": "rgba(0, 0, 0, 0.12)",
  } as React.CSSProperties;

  const refreshFromChart = useCallback(() => {
    if (!chart?.getChartAppearanceSettings) {
      return;
    }

    setAppearance(chart.getChartAppearanceSettings());
    setVolume(chart.getChartVolumeSettings?.() ?? null);
    setIndicators(chart.getChartIndicatorSettings?.() ?? []);
    setStrategies(chart.getChartStrategySettings?.() ?? []);
    setDrawings(chart.getChartDrawingSettings?.() ?? []);
  }, [chart]);

  useEffect(() => {
    refreshFromChart();
  }, [refreshFromChart]);

  useEffect(() => {
    if (indicators.length > 0) {
      setLayersTab("indicators");
      return;
    }
    if (strategies.length > 0) {
      setLayersTab("strategies");
      return;
    }
    if (drawings.length > 0) {
      setLayersTab("drawings");
    }
  }, [indicators.length, strategies.length, drawings.length]);

  const applyAppearance = (patch: Partial<ChartAppearanceSettings>) => {
    if (!appearance || !chart?.applyChartAppearanceSettings) {
      return;
    }

    setActivePresetId(null);
    const next = { ...appearance, ...patch };
    setAppearance(next);
    chart.applyChartAppearanceSettings(next);
  };

  const applyVolume = (patch: Partial<ChartVolumeSettings>) => {
    if (!volume?.available || !chart?.applyChartVolumeSettings) {
      return;
    }

    setActivePresetId(null);
    const next = { ...volume, ...patch };
    setVolume(next);
    chart.applyChartVolumeSettings(next);
  };

  const applyPreset = (presetId: string) => {
    const preset = CHART_SETTINGS_PRESETS.find((entry) => entry.id === presetId);
    if (!preset || !chart.importChartSettingsTemplate) {
      return;
    }

    chart.importChartSettingsTemplate(preset.template);
    applyUiTheme?.(preset.uiTheme);
    setActivePresetId(presetId);
    refreshFromChart();
  };

  const renderToggle = (
    label: string,
    hint: string,
    active: boolean,
    onChange: (value: boolean) => void,
    showLabel: string,
    hideLabel: string,
  ) => (
    <div className={styles.toggleRow}>
      <div>
        <span className={styles.toggleLabel}>{label}</span>
        <span className={styles.toggleHint}>{hint}</span>
      </div>
      <VisibilityToggle active={active} label={active ? hideLabel : showLabel} onChange={onChange} />
    </div>
  );

  const gridModeOptions: DialogSelectOption[] = GRID_MODE_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
  }));

  const gridLineStyleOptions: DialogSelectOption[] = GRID_LINE_STYLE_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
  }));

  const volumeColorModeOptions: DialogSelectOption[] = VOLUME_COLOR_MODE_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
  }));

  const layersCounts = {
    indicators: indicators.length,
    strategies: strategies.length,
    drawings: drawings.length,
  };

  const renderLayersContent = () => {
    if (layersTab === "indicators") {
      if (indicators.length === 0) {
        return <div className={styles.emptyState}>No indicators on the chart.</div>;
      }

      return (
        <div className={styles.layersTable}>
          <div className={styles.layersTableHeader}>
            <span>Name</span>
            <span className={styles.layersTableHeaderCell}>Plot</span>
            <span className={styles.layersTableHeaderCell}>Scale</span>
            <span />
          </div>
          {indicators.map((indicator) => (
            <div key={String(indicator.scriptId)} className={styles.layersRow}>
              <span className={styles.layersName} title={indicator.title}>
                {indicator.title}
              </span>
              <div className={styles.layersCell}>
                <CompactVisibility
                  hint="Chart"
                  active={indicator.visible}
                  showLabel={`Show ${indicator.title}`}
                  hideLabel={`Hide ${indicator.title}`}
                  onChange={(visible) => {
                    chart.setChartIndicatorVisibility?.(indicator.scriptId, visible);
                    refreshFromChart();
                  }}
                />
              </div>
              <div className={styles.layersCell}>
                <CompactVisibility
                  hint="Scale"
                  active={indicator.priceTagVisible}
                  showLabel={`Show ${indicator.title} label`}
                  hideLabel={`Hide ${indicator.title} label`}
                  onChange={(priceTagVisible) => {
                    chart.setChartIndicatorPriceTagVisibility?.(indicator.scriptId, priceTagVisible);
                    refreshFromChart();
                  }}
                />
              </div>
              <div className={styles.layersCell}>
                <IconActionButton
                  label="Remove indicator"
                  onClick={() => {
                    chart.removeChartIndicator?.(indicator.scriptId);
                    refreshFromChart();
                  }}
                >
                  <Icon themeContext="toolbar">
                    <Remove />
                  </Icon>
                </IconActionButton>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (layersTab === "strategies") {
      if (strategies.length === 0) {
        return <div className={styles.emptyState}>No strategies on the chart.</div>;
      }

      return (
        <div className={styles.layersTable}>
          <div className={`${styles.layersTableHeader} ${styles.layersTableHeaderSimple}`}>
            <span>Name</span>
            <span className={styles.layersTableHeaderCell}>Visible</span>
            <span />
          </div>
          {strategies.map((strategy) => (
            <div key={String(strategy.scriptId)} className={`${styles.layersRow} ${styles.layersRowSimple}`}>
              <span className={styles.layersName} title={strategy.title}>
                {strategy.title}
              </span>
              <div className={styles.layersCell}>
                <CompactVisibility
                  hint="Chart"
                  active={strategy.visible}
                  showLabel={`Show ${strategy.title}`}
                  hideLabel={`Hide ${strategy.title}`}
                  onChange={(visible) => {
                    chart.setChartStrategyVisibility?.(strategy.scriptId, visible);
                    refreshFromChart();
                  }}
                />
              </div>
              <div className={styles.layersCell}>
                <IconActionButton
                  label="Remove strategy"
                  onClick={() => {
                    chart.removeChartStrategy?.(strategy.scriptId);
                    refreshFromChart();
                  }}
                >
                  <Icon themeContext="toolbar">
                    <Remove />
                  </Icon>
                </IconActionButton>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (drawings.length === 0) {
      return <div className={styles.emptyState}>No drawing tools on the chart.</div>;
    }

    return (
      <div className={styles.layersTable}>
        <div className={`${styles.layersTableHeader} ${styles.layersTableHeaderSimple}`}>
          <span>Name</span>
          <span className={styles.layersTableHeaderCell}>Visible</span>
          <span />
        </div>
        {drawings.map((drawing) => (
          <div key={String(drawing.objectId)} className={`${styles.layersRow} ${styles.layersRowSimple}`}>
            <span className={styles.layersName} title={drawing.label}>
              {drawing.label}
            </span>
            <div className={styles.layersCell}>
              <CompactVisibility
                hint="Chart"
                active={drawing.visible}
                showLabel={`Show ${drawing.label}`}
                hideLabel={`Hide ${drawing.label}`}
                onChange={(visible) => {
                  chart.setChartDrawingVisibility?.(drawing.objectId, visible);
                  refreshFromChart();
                }}
              />
            </div>
            <div className={styles.layersCell}>
              <IconActionButton
                label="Remove drawing"
                onClick={() => {
                  chart.removeChartDrawing?.(drawing.objectId);
                  refreshFromChart();
                }}
              >
                <Icon themeContext="toolbar">
                  <Remove />
                </Icon>
              </IconActionButton>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!appearance) {
    return null;
  }

  return (
    <DialogContainer
      style={{
        ...cssVars,
        width: 600,
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <DialogHeader>
        <span>Chart settings</span>
        <TextButton onClick={props.onClose} style={{ marginLeft: "auto" }}>
          <X size={24} />
        </TextButton>
      </DialogHeader>

      <DialogBody style={{ padding: 0, maxHeight: "min(78vh, 760px)" }}>
        <div className={styles.scrollArea} style={cssVars}>
          <SettingsSection title="Theme templates" hint="Quick look">
            <div className={styles.templateGrid}>
              {CHART_SETTINGS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`${styles.templateCard} ${
                    activePresetId === preset.id ? styles.templateCardActive : ""
                  }`}
                  onClick={() => applyPreset(preset.id)}
                  aria-pressed={activePresetId === preset.id}
                >
                  <div className={styles.templateSwatches}>
                    <span
                      className={styles.swatch}
                      style={{ background: preset.swatches.background }}
                      title="Background"
                    />
                    <span
                      className={styles.swatch}
                      style={{ background: preset.swatches.up }}
                      title="Up"
                    />
                    <span
                      className={styles.swatch}
                      style={{ background: preset.swatches.down }}
                      title="Down"
                    />
                    <span
                      className={styles.swatch}
                      style={{ background: preset.swatches.grid }}
                      title="Grid"
                    />
                    <span
                      className={styles.swatch}
                      style={{ background: preset.swatches.chrome }}
                      title="Chrome"
                    />
                  </div>
                  <span className={styles.templateLabel}>{preset.label}</span>
                  <span className={styles.templateDescription}>{preset.description}</span>
                </button>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Symbol" hint="Candles & line (fill applies in line mode)">
            <div className={styles.colorGrid}>
              <ColorField
                label="Chart line"
                value={appearance.chartLineColor}
                onChange={(chartLineColor) => applyAppearance({ chartLineColor })}
              />
              <div className={styles.colorFieldWithToggle}>
                <div className={styles.colorFieldWithToggleRow}>
                  <ColorField
                    label="Line fill"
                    value={appearance.chartFillColor}
                    onChange={(chartFillColor) => applyAppearance({ chartFillColor })}
                  />
                  <VisibilityToggle
                    active={appearance.chartLineFillVisible}
                    label={
                      appearance.chartLineFillVisible
                        ? "Hide area under line"
                        : "Show area under line"
                    }
                    onChange={(chartLineFillVisible) => applyAppearance({ chartLineFillVisible })}
                  />
                </div>
              </div>
              <ColorField
                label="Candle up"
                value={appearance.candleUpColor}
                onChange={(candleUpColor) => applyAppearance({ candleUpColor })}
              />
              <ColorField
                label="Candle down"
                value={appearance.candleDownColor}
                onChange={(candleDownColor) => applyAppearance({ candleDownColor })}
              />
              <ColorField
                label="Up stroke"
                value={appearance.candleUpStrokeColor}
                onChange={(candleUpStrokeColor) => applyAppearance({ candleUpStrokeColor })}
              />
              <ColorField
                label="Down stroke"
                value={appearance.candleDownStrokeColor}
                onChange={(candleDownStrokeColor) => applyAppearance({ candleDownStrokeColor })}
              />
            </div>
          </SettingsSection>

          <SettingsSection title="Canvas" hint="Background & grid">
            <div className={`${styles.colorGrid} ${styles.colorGridSingle}`}>
              <ColorField
                label="Plot background"
                value={appearance.backgroundColor}
                onChange={(backgroundColor) => applyAppearance({ backgroundColor })}
              />
              <ColorField
                label="Grid"
                value={appearance.gridColor}
                onChange={(gridColor) => applyAppearance({ gridColor })}
              />
            </div>
            <div className={styles.fieldRow}>
              <Label name="Grid lines">
                <DialogSelect
                  value={appearance.gridMode}
                  options={gridModeOptions}
                  onChange={(value) => {
                    const gridMode = value as ChartGridMode;
                    applyAppearance({
                      gridMode,
                      gridVisible: gridMode !== "none",
                    });
                  }}
                  ariaLabel="Grid lines"
                />
              </Label>
              <Label name="Line style">
                <DialogSelect
                  value={appearance.gridLineStyle}
                  options={gridLineStyleOptions}
                  onChange={(value) =>
                    applyAppearance({ gridLineStyle: value as ChartGridLineStyle })
                  }
                  ariaLabel="Grid line style"
                />
              </Label>
            </div>
            {renderToggle(
              "Show grid",
              "Horizontal and vertical guides",
              appearance.gridVisible,
              (gridVisible) => {
                applyAppearance({
                  gridVisible,
                  gridMode:
                    gridVisible && appearance.gridMode === "none" ? "both" : appearance.gridMode,
                });
              },
              "Show grid",
              "Hide grid",
            )}
          </SettingsSection>

          <SettingsSection title="Scales" hint="Axes & last price">
            <div className={styles.colorGrid}>
              <ColorField
                label="Axis labels"
                value={appearance.axisTextColor}
                onChange={(axisTextColor) => applyAppearance({ axisTextColor })}
              />
              <ColorField
                label="Axis background"
                value={appearance.axisBackgroundColor}
                onChange={(axisBackgroundColor) => applyAppearance({ axisBackgroundColor })}
              />
              <ColorField
                label="Crosshair"
                value={appearance.crosshairColor}
                onChange={(crosshairColor) => applyAppearance({ crosshairColor })}
              />
            </div>
            {renderToggle(
              "Last price line",
              "Horizontal line at the latest close",
              appearance.lastPriceLineVisible,
              (lastPriceLineVisible) => applyAppearance({ lastPriceLineVisible }),
              "Show last price line",
              "Hide last price line",
            )}
            {renderToggle(
              "Last price label",
              "Price tag on the right scale",
              appearance.lastPriceLabelVisible,
              (lastPriceLabelVisible) => applyAppearance({ lastPriceLabelVisible }),
              "Show last price label",
              "Hide last price label",
            )}
          </SettingsSection>

          <SettingsSection title="Volume" hint={volume?.available ? "Histogram pane" : "Not active"}>
            {!volume?.available ? (
              <div className={styles.emptyState}>
                Add the Volume indicator to the chart to adjust these options.
              </div>
            ) : (
              <>
                {renderToggle(
                  "Show volume",
                  "Volume histogram at the bottom",
                  volume.visible,
                  (visible) => applyVolume({ visible }),
                  "Show volume",
                  "Hide volume",
                )}
                <Label name={`Opacity · ${Math.round(volume.opacity * 100)}%`}>
                  <input
                    type="range"
                    className={styles.rangeInput}
                    min={5}
                    max={100}
                    step={5}
                    value={Math.round(volume.opacity * 100)}
                    onChange={(event) =>
                      applyVolume({ opacity: Number(event.target.value) / 100 })
                    }
                  />
                </Label>
                <div className={styles.fieldRow}>
                  <Label name="Bar colors">
                    <DialogSelect
                      value={volume.colorMode}
                      options={volumeColorModeOptions}
                      onChange={(value) =>
                        applyVolume({ colorMode: value as ChartVolumeColorMode })
                      }
                      ariaLabel="Volume color mode"
                    />
                  </Label>
                  {volume.colorMode === "single" ? (
                    <div>
                      <ColorField
                        label="Bar color"
                        value={volume.color}
                        onChange={(color) => applyVolume({ color })}
                      />
                    </div>
                  ) : (
                    <div className={styles.emptyState} style={{ padding: "8px 0", textAlign: "left" }}>
                      Bars follow candle direction colors.
                    </div>
                  )}
                </div>
              </>
            )}
          </SettingsSection>

          <SettingsSection title="On chart" hint="Layers">
            <div className={styles.layersTabs}>
              {(
                [
                  ["indicators", "Indicators"],
                  ["strategies", "Strategies"],
                  ["drawings", "Drawings"],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.layersTab} ${layersTab === tab ? styles.layersTabActive : ""}`}
                  onClick={() => setLayersTab(tab)}
                >
                  {label}
                  {layersCounts[tab] > 0 ? ` (${layersCounts[tab]})` : ""}
                </button>
              ))}
            </div>
            {renderLayersContent()}
          </SettingsSection>
        </div>
      </DialogBody>
    </DialogContainer>
  );
};
