import * as React from "react";
import { useCallback, useContext, useEffect, useState, useId } from "react";
import {
  DialogBody,
  DialogContainer,
  DialogHeader,
  DialogHeaderActions,
  DialogHeaderTitle,
  Label,
  TextButton,
} from "ui";
import { Eye, EyeSlash, X } from "phosphor-react";
import { ThemeContext } from "styled-components";
import type {
  ChartAppearanceSettings,
  ChartDrawingSettingsItem,
  ChartFunctionSettingsItem,
  ChartGridLineStyle,
  ChartGridMode,
  ChartLineFillMode,
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
import { useChartTranslate } from "../../../hooks/useChartTranslate";
import { CHART_SETTINGS_PRESETS } from "./chartSettingsPresets";
import { ColorField } from "./ColorField";
import { getChartSettingsCssVars } from "../../../utils/dialogThemeVars";
import { DialogSection } from "../../dialog/DialogSection";
import tabStyles from "../../dialog/dialogTabs.module.css";
import layoutStyles from "../../dialog/dialogLayout.module.css";
import {
  dialogCatalogLayoutStyle,
  dialogFitLayoutStyle,
  dialogScrollBodyStyle,
} from "../../dialog/dialogLayout";
import { DialogPrimaryButton } from "./DialogPrimaryButton";
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
  getChartFunctionSettings?: () => ChartFunctionSettingsItem[];
  setChartFunctionVisibility?: (scriptId: string | number, visible: boolean) => void;
  setChartFunctionPriceTagVisibility?: (scriptId: string | number, visible: boolean) => void;
  removeChartFunction?: (scriptId: string | number) => void;
  getChartStrategySettings?: () => ChartStrategySettingsItem[];
  setChartStrategyVisibility?: (scriptId: string | number, visible: boolean) => void;
  removeChartStrategy?: (scriptId: string | number) => void;
  getChartDrawingSettings?: () => ChartDrawingSettingsItem[];
  setChartDrawingVisibility?: (objectId: string | number, visible: boolean) => void;
  removeChartDrawing?: (objectId: string | number) => void;
  getAllDrawingsLocked?: () => boolean;
  lockAllDrawings?: () => void;
  unlockAllDrawings?: () => void;
  importChartSettingsTemplate?: (template: import("@efixdata/exeria-chart").ChartSettingsTemplate) => void;
  getLocale?: () => string;
  setLocale?: (locale: string) => void;
  getSupportedLocales?: () => Array<{ id: string; label: string }>;
};

type LayersTab = "indicators" | "functions" | "strategies" | "drawings";

const GRID_MODE_OPTIONS: { id: ChartGridMode; labelKey: string; defaultLabel: string }[] = [
  { id: "both", labelKey: "grid_mode_both", defaultLabel: "Horizontal & vertical" },
  { id: "horizontal", labelKey: "grid_mode_horizontal", defaultLabel: "Horizontal" },
  { id: "vertical", labelKey: "grid_mode_vertical", defaultLabel: "Vertical" },
  { id: "none", labelKey: "grid_mode_none", defaultLabel: "Hidden" },
];

const GRID_LINE_STYLE_OPTIONS: { id: ChartGridLineStyle; labelKey: string; defaultLabel: string }[] = [
  { id: "solid", labelKey: "grid_line_style_solid", defaultLabel: "Solid" },
  { id: "dashed", labelKey: "grid_line_style_dashed", defaultLabel: "Dashed" },
];

const VOLUME_COLOR_MODE_OPTIONS: {
  id: ChartVolumeColorMode;
  labelKey: string;
  defaultLabel: string;
}[] = [
  { id: "candle", labelKey: "volume_color_mode_candle", defaultLabel: "Match candles" },
  { id: "single", labelKey: "volume_color_mode_single", defaultLabel: "Single color" },
];

const LINE_FILL_MODE_OPTIONS: {
  id: ChartLineFillMode;
  labelKey: string;
  defaultLabel: string;
}[] = [
  { id: "solid", labelKey: "line_fill_mode_solid", defaultLabel: "Solid" },
  { id: "gradient", labelKey: "line_fill_mode_gradient", defaultLabel: "Gradient" },
];

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
  const t = useChartTranslate(chart);
  const titleId = useId();
  const layersTabsId = useId();
  // @ts-ignore styled-components theme mismatch
  const themeContext = useContext(ThemeContext);

  const [appearance, setAppearance] = useState<ChartAppearanceSettings | null>(null);
  const [volume, setVolume] = useState<ChartVolumeSettings | null>(null);
  const [indicators, setIndicators] = useState<ChartIndicatorSettingsItem[]>([]);
  const [functions, setFunctions] = useState<ChartFunctionSettingsItem[]>([]);
  const [strategies, setStrategies] = useState<ChartStrategySettingsItem[]>([]);
  const [drawings, setDrawings] = useState<ChartDrawingSettingsItem[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [layersTab, setLayersTab] = useState<LayersTab>("indicators");
  const [locale, setLocale] = useState(() => chart?.getLocale?.() ?? "en-US");

  const cssVars = getChartSettingsCssVars(themeContext);

  const refreshFromChart = useCallback(() => {
    if (!chart?.getChartAppearanceSettings) {
      return;
    }

    setAppearance(chart.getChartAppearanceSettings());
    setVolume(chart.getChartVolumeSettings?.() ?? null);
    setIndicators(chart.getChartIndicatorSettings?.() ?? []);
    setFunctions(chart.getChartFunctionSettings?.() ?? []);
    setStrategies(chart.getChartStrategySettings?.() ?? []);
    setDrawings(chart.getChartDrawingSettings?.() ?? []);
  }, [chart]);

  useEffect(() => {
    refreshFromChart();
  }, [refreshFromChart]);

  useEffect(() => {
    if (!chart?.subscribe) {
      return undefined;
    }

    const subscription = chart.subscribe("LOCALE_CHANGE", (data: { locale: string }) => {
      setLocale(data.locale);
      refreshFromChart();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [chart, refreshFromChart]);

  useEffect(() => {
    if (indicators.length > 0) {
      setLayersTab("indicators");
      return;
    }
    if (functions.length > 0) {
      setLayersTab("functions");
      return;
    }
    if (strategies.length > 0) {
      setLayersTab("strategies");
      return;
    }
    if (drawings.length > 0) {
      setLayersTab("drawings");
    }
  }, [indicators.length, functions.length, strategies.length, drawings.length]);

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

  const getPresetLabelKey = (presetId: string) => `preset_${presetId.replace(/-/g, "_")}_label`;
  const getPresetDescriptionKey = (presetId: string) =>
    `preset_${presetId.replace(/-/g, "_")}_description`;

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
    label: t(option.labelKey, option.defaultLabel),
  }));

  const gridLineStyleOptions: DialogSelectOption[] = GRID_LINE_STYLE_OPTIONS.map((option) => ({
    value: option.id,
    label: t(option.labelKey, option.defaultLabel),
  }));

  const volumeColorModeOptions: DialogSelectOption[] = VOLUME_COLOR_MODE_OPTIONS.map((option) => ({
    value: option.id,
    label: t(option.labelKey, option.defaultLabel),
  }));

  const lineFillModeOptions: DialogSelectOption[] = LINE_FILL_MODE_OPTIONS.map((option) => ({
    value: option.id,
    label: t(option.labelKey, option.defaultLabel),
  }));

  const localeOptions: DialogSelectOption[] = (chart.getSupportedLocales?.() ?? []).map((entry) => ({
    value: entry.id,
    label: entry.label,
  }));

  const layersCounts = {
    indicators: indicators.length,
    functions: functions.length,
    strategies: strategies.length,
    drawings: drawings.length,
  };

  const renderLayersContent = () => {
    if (layersTab === "indicators") {
      if (indicators.length === 0) {
        return <div className={styles.emptyState}>{t("layers_empty_indicators")}</div>;
      }

      return (
        <div className={styles.layersTable}>
          <div className={styles.layersTableHeader}>
            <span>{t("layers_col_name")}</span>
            <span className={styles.layersTableHeaderCell}>{t("layers_col_plot")}</span>
            <span className={styles.layersTableHeaderCell}>{t("layers_col_scale")}</span>
            <span />
          </div>
          {indicators.map((indicator) => (
            <div key={String(indicator.scriptId)} className={styles.layersRow}>
              <span className={styles.layersName} title={indicator.title}>
                {indicator.title}
              </span>
              <div className={styles.layersCell}>
                <CompactVisibility
                  hint={t("layers_hint_chart")}
                  active={indicator.visible}
                  showLabel={`${t("layers_action_show")} ${indicator.title}`}
                  hideLabel={`${t("layers_action_hide")} ${indicator.title}`}
                  onChange={(visible) => {
                    chart.setChartIndicatorVisibility?.(indicator.scriptId, visible);
                    refreshFromChart();
                  }}
                />
              </div>
              <div className={styles.layersCell}>
                <CompactVisibility
                  hint={t("layers_hint_scale")}
                  active={indicator.priceTagVisible}
                  showLabel={`${t("layers_action_show_label")} ${indicator.title}`}
                  hideLabel={`${t("layers_action_hide_label")} ${indicator.title}`}
                  onChange={(priceTagVisible) => {
                    chart.setChartIndicatorPriceTagVisibility?.(indicator.scriptId, priceTagVisible);
                    refreshFromChart();
                  }}
                />
              </div>
              <div className={styles.layersCell}>
                <IconActionButton
                  label={t("layers_remove_indicator")}
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

    if (layersTab === "functions") {
      if (functions.length === 0) {
        return <div className={styles.emptyState}>{t("layers_empty_functions")}</div>;
      }

      return (
        <div className={styles.layersTable}>
          <div className={styles.layersTableHeader}>
            <span>{t("layers_col_name")}</span>
            <span className={styles.layersTableHeaderCell}>{t("layers_col_plot")}</span>
            <span className={styles.layersTableHeaderCell}>{t("layers_col_scale")}</span>
            <span />
          </div>
          {functions.map((fn) => (
            <div key={String(fn.scriptId)} className={styles.layersRow}>
              <span className={styles.layersName} title={fn.title}>
                {fn.title}
              </span>
              <div className={styles.layersCell}>
                <CompactVisibility
                  hint={t("layers_hint_chart")}
                  active={fn.visible}
                  showLabel={`${t("layers_action_show")} ${fn.title}`}
                  hideLabel={`${t("layers_action_hide")} ${fn.title}`}
                  onChange={(visible) => {
                    chart.setChartFunctionVisibility?.(fn.scriptId, visible);
                    refreshFromChart();
                  }}
                />
              </div>
              <div className={styles.layersCell}>
                <CompactVisibility
                  hint={t("layers_hint_scale")}
                  active={fn.priceTagVisible}
                  showLabel={`${t("layers_action_show_label")} ${fn.title}`}
                  hideLabel={`${t("layers_action_hide_label")} ${fn.title}`}
                  onChange={(priceTagVisible) => {
                    chart.setChartFunctionPriceTagVisibility?.(fn.scriptId, priceTagVisible);
                    refreshFromChart();
                  }}
                />
              </div>
              <div className={styles.layersCell}>
                <IconActionButton
                  label={t("layers_remove_function")}
                  onClick={() => {
                    chart.removeChartFunction?.(fn.scriptId);
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
        return <div className={styles.emptyState}>{t("layers_empty_strategies")}</div>;
      }

      return (
        <div className={styles.layersTable}>
          <div className={`${styles.layersTableHeader} ${styles.layersTableHeaderSimple}`}>
            <span>{t("layers_col_name")}</span>
            <span className={styles.layersTableHeaderCell}>{t("layers_col_visible")}</span>
            <span />
          </div>
          {strategies.map((strategy) => (
            <div key={String(strategy.scriptId)} className={`${styles.layersRow} ${styles.layersRowSimple}`}>
              <span className={styles.layersName} title={strategy.title}>
                {strategy.title}
              </span>
              <div className={styles.layersCell}>
                <CompactVisibility
                  hint={t("layers_hint_chart")}
                  active={strategy.visible}
                  showLabel={`${t("layers_action_show")} ${strategy.title}`}
                  hideLabel={`${t("layers_action_hide")} ${strategy.title}`}
                  onChange={(visible) => {
                    chart.setChartStrategyVisibility?.(strategy.scriptId, visible);
                    refreshFromChart();
                  }}
                />
              </div>
              <div className={styles.layersCell}>
                <IconActionButton
                  label={t("layers_remove_strategy")}
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
      return <div className={styles.emptyState}>{t("layers_empty_drawings")}</div>;
    }

    return (
      <div className={styles.layersTable}>
        <div className={styles.drawingsWorkflow}>
          <TextButton
            onClick={() => {
              if (chart.getAllDrawingsLocked?.()) {
                chart.unlockAllDrawings?.();
              } else {
                chart.lockAllDrawings?.();
              }
              refreshFromChart();
            }}
          >
            {chart.getAllDrawingsLocked?.()
              ? t("drawings_unlock_all")
              : t("drawings_lock_all")}
          </TextButton>
        </div>
        <div className={`${styles.layersTableHeader} ${styles.layersTableHeaderSimple}`}>
          <span>{t("layers_col_name")}</span>
          <span className={styles.layersTableHeaderCell}>{t("layers_col_visible")}</span>
          <span />
        </div>
        {drawings.map((drawing) => (
          <div key={String(drawing.objectId)} className={`${styles.layersRow} ${styles.layersRowSimple}`}>
            <span className={styles.layersName} title={drawing.label}>
              {drawing.label}
            </span>
            <div className={styles.layersCell}>
              <CompactVisibility
                hint={t("layers_hint_chart")}
                active={drawing.visible}
                showLabel={`${t("layers_action_show")} ${drawing.label}`}
                hideLabel={`${t("layers_action_hide")} ${drawing.label}`}
                onChange={(visible) => {
                  chart.setChartDrawingVisibility?.(drawing.objectId, visible);
                  refreshFromChart();
                }}
              />
            </div>
            <div className={styles.layersCell}>
              <IconActionButton
                label={t("layers_remove_drawing")}
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
      ariaLabelledBy={titleId}
      style={{
        ...cssVars,
        ...dialogFitLayoutStyle,
        ...dialogCatalogLayoutStyle,
      }}
    >
      <DialogHeader>
        <DialogHeaderTitle id={titleId}>{t("chart_settings_title")}</DialogHeaderTitle>
        <DialogHeaderActions>
          <TextButton onClick={props.onClose} ariaLabel={t("dialog_close", "Close")}>
            <X size={24} aria-hidden />
          </TextButton>
        </DialogHeaderActions>
      </DialogHeader>

      <DialogBody style={dialogScrollBodyStyle}>
        <div className={layoutStyles.scrollArea} style={cssVars}>
          <DialogSection
            title={t("chart_settings_language")}
            hint={t("chart_settings_language_hint")}
          >
            <Label name={t("chart_settings_language")}>
              <DialogSelect
                value={locale}
                options={localeOptions}
                onChange={(value) => {
                  chart.setLocale?.(value);
                  setLocale(value);
                }}
                ariaLabel={t("chart_settings_language")}
              />
            </Label>
          </DialogSection>

          <DialogSection
            title={t("chart_settings_theme_templates")}
            hint={t("chart_settings_theme_templates_hint")}
          >
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
                      title={t("chart_settings_swatch_background")}
                    />
                    <span
                      className={styles.swatch}
                      style={{ background: preset.swatches.up }}
                      title={t("chart_settings_swatch_up")}
                    />
                    <span
                      className={styles.swatch}
                      style={{ background: preset.swatches.down }}
                      title={t("chart_settings_swatch_down")}
                    />
                    <span
                      className={styles.swatch}
                      style={{ background: preset.swatches.grid }}
                      title={t("chart_settings_swatch_grid")}
                    />
                    <span
                      className={styles.swatch}
                      style={{ background: preset.swatches.chrome }}
                      title={t("chart_settings_swatch_chrome")}
                    />
                  </div>
                  <span className={styles.templateLabel}>
                    {t(getPresetLabelKey(preset.id), preset.label)}
                  </span>
                  <span className={styles.templateDescription}>
                    {t(getPresetDescriptionKey(preset.id), preset.description)}
                  </span>
                </button>
              ))}
            </div>
          </DialogSection>

          <DialogSection
            title={t("chart_settings_symbol")}
            hint={t("chart_settings_symbol_hint")}
          >
            <div className={styles.colorGrid}>
              <ColorField
                label={t("chart_settings_chart_line")}
                value={appearance.chartLineColor}
                onChange={(chartLineColor) => applyAppearance({ chartLineColor })}
              />
              <div className={styles.colorFieldWithToggle}>
                <div className={styles.fieldRow}>
                  <ColorField
                    label={t("chart_settings_line_fill")}
                    value={appearance.chartFillColor}
                    onChange={(chartFillColor) => applyAppearance({ chartFillColor })}
                  />
                  <div className={styles.gradientFillColumn}>
                    <ColorField
                      label={t("chart_settings_line_fill_gradient")}
                      value={appearance.chartFillGradientColor}
                      onChange={(chartFillGradientColor) =>
                        applyAppearance({ chartFillGradientColor })
                      }
                    />
                    <Label
                      name={`${t("chart_settings_opacity")} · ${Math.round(appearance.chartFillGradientOpacity * 100)}%`}
                    >
                      <input
                        type="range"
                        className={styles.rangeInput}
                        min={5}
                        max={100}
                        step={5}
                        value={Math.round(appearance.chartFillGradientOpacity * 100)}
                        onChange={(event) =>
                          applyAppearance({
                            chartFillGradientOpacity: Number(event.target.value) / 100,
                          })
                        }
                      />
                    </Label>
                  </div>
                </div>
                <div className={styles.colorFieldWithToggleRow}>
                  <Label name={t("chart_settings_line_fill_mode")}>
                    <DialogSelect
                      value={appearance.chartLineFillMode}
                      options={lineFillModeOptions}
                      onChange={(value) =>
                        applyAppearance({ chartLineFillMode: value as ChartLineFillMode })
                      }
                      ariaLabel={t("chart_settings_line_fill_mode")}
                    />
                  </Label>
                  <VisibilityToggle
                    active={appearance.chartLineFillVisible}
                    label={
                      appearance.chartLineFillVisible
                        ? t("chart_settings_hide_area_under_line")
                        : t("chart_settings_show_area_under_line")
                    }
                    onChange={(chartLineFillVisible) => applyAppearance({ chartLineFillVisible })}
                  />
                </div>
              </div>
              <ColorField
                label={t("chart_settings_candle_up")}
                value={appearance.candleUpColor}
                onChange={(candleUpColor) => applyAppearance({ candleUpColor })}
              />
              <ColorField
                label={t("chart_settings_candle_down")}
                value={appearance.candleDownColor}
                onChange={(candleDownColor) => applyAppearance({ candleDownColor })}
              />
              <ColorField
                label={t("chart_settings_up_stroke")}
                value={appearance.candleUpStrokeColor}
                onChange={(candleUpStrokeColor) => applyAppearance({ candleUpStrokeColor })}
              />
              <ColorField
                label={t("chart_settings_down_stroke")}
                value={appearance.candleDownStrokeColor}
                onChange={(candleDownStrokeColor) => applyAppearance({ candleDownStrokeColor })}
              />
            </div>
          </DialogSection>

          <DialogSection title={t("chart_settings_canvas")} hint={t("chart_settings_canvas_hint")}>
            <div className={`${styles.colorGrid} ${styles.colorGridSingle}`}>
              <ColorField
                label={t("chart_settings_plot_background")}
                value={appearance.backgroundColor}
                onChange={(backgroundColor) => applyAppearance({ backgroundColor })}
              />
              <ColorField
                label={t("chart_settings_grid")}
                value={appearance.gridColor}
                onChange={(gridColor) => applyAppearance({ gridColor })}
              />
            </div>
            <div className={styles.fieldRow}>
              <Label name={t("chart_settings_grid_lines")}>
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
                  ariaLabel={t("chart_settings_grid_lines")}
                />
              </Label>
              <Label name={t("chart_settings_line_style")}>
                <DialogSelect
                  value={appearance.gridLineStyle}
                  options={gridLineStyleOptions}
                  onChange={(value) =>
                    applyAppearance({ gridLineStyle: value as ChartGridLineStyle })
                  }
                  ariaLabel={t("chart_settings_line_style")}
                />
              </Label>
            </div>
            {renderToggle(
              t("chart_settings_show_grid"),
              t("chart_settings_show_grid_hint"),
              appearance.gridVisible,
              (gridVisible) => {
                applyAppearance({
                  gridVisible,
                  gridMode:
                    gridVisible && appearance.gridMode === "none" ? "both" : appearance.gridMode,
                });
              },
              t("action_show"),
              t("action_hide"),
            )}
          </DialogSection>

          <DialogSection title={t("chart_settings_scales")} hint={t("chart_settings_scales_hint")}>
            <div className={styles.colorGrid}>
              <ColorField
                label={t("chart_settings_axis_labels")}
                value={appearance.axisTextColor}
                onChange={(axisTextColor) => applyAppearance({ axisTextColor })}
              />
              <ColorField
                label={t("chart_settings_axis_background")}
                value={appearance.axisBackgroundColor}
                onChange={(axisBackgroundColor) => applyAppearance({ axisBackgroundColor })}
              />
              <ColorField
                label={t("chart_settings_crosshair")}
                value={appearance.crosshairColor}
                onChange={(crosshairColor) => applyAppearance({ crosshairColor })}
              />
            </div>
            {renderToggle(
              t("chart_settings_last_price_line"),
              t("chart_settings_last_price_line_hint"),
              appearance.lastPriceLineVisible,
              (lastPriceLineVisible) => applyAppearance({ lastPriceLineVisible }),
              t("action_show"),
              t("action_hide"),
            )}
            {renderToggle(
              t("chart_settings_last_price_label"),
              t("chart_settings_last_price_label_hint"),
              appearance.lastPriceLabelVisible,
              (lastPriceLabelVisible) => applyAppearance({ lastPriceLabelVisible }),
              t("action_show"),
              t("action_hide"),
            )}
          </DialogSection>

          <DialogSection
            title={t("chart_settings_volume")}
            hint={
              volume?.available
                ? t("chart_settings_volume_hint")
                : t("chart_settings_volume_not_active")
            }
          >
            {!volume?.available ? (
              <div className={styles.emptyState}>{t("chart_settings_volume_add_indicator_hint")}</div>
            ) : (
              <>
                {renderToggle(
                  t("chart_settings_show_volume"),
                  t("chart_settings_show_volume_hint"),
                  volume.visible,
                  (visible) => applyVolume({ visible }),
                  t("action_show"),
                  t("action_hide"),
                )}
                <Label name={`${t("chart_settings_opacity")} · ${Math.round(volume.opacity * 100)}%`}>
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
                  <Label name={t("chart_settings_bar_colors")}>
                    <DialogSelect
                      value={volume.colorMode}
                      options={volumeColorModeOptions}
                      onChange={(value) =>
                        applyVolume({ colorMode: value as ChartVolumeColorMode })
                      }
                      ariaLabel={t("chart_settings_bar_colors")}
                    />
                  </Label>
                  {volume.colorMode === "single" ? (
                    <div>
                      <ColorField
                        label={t("chart_settings_bar_color")}
                        value={volume.color}
                        onChange={(color) => applyVolume({ color })}
                      />
                    </div>
                  ) : (
                    <div className={styles.emptyState} style={{ padding: "8px 0", textAlign: "left" }}>
                      {t("chart_settings_volume_bars_follow_candles")}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogSection>

          <DialogSection title={t("chart_settings_on_chart")} hint={t("chart_settings_on_chart_hint")}>
            <div
              id={layersTabsId}
              className={tabStyles.tabBarInset}
              role="tablist"
              aria-label={t("chart_settings_on_chart")}
            >
              {(
                [
                  ["indicators", "layers_tab_indicators"],
                  ["functions", "layers_tab_functions"],
                  ["strategies", "layers_tab_strategies"],
                  ["drawings", "layers_tab_drawings"],
                ] as const
              ).map(([tab, labelKey]) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`${layersTabsId}-${tab}`}
                  aria-selected={layersTab === tab}
                  aria-controls={`${layersTabsId}-${tab}-panel`}
                  className={`${tabStyles.tab} ${layersTab === tab ? tabStyles.tabActive : ""}`}
                  onClick={() => setLayersTab(tab)}
                >
                  {t(labelKey)}
                  {layersCounts[tab] > 0 ? ` (${layersCounts[tab]})` : ""}
                </button>
              ))}
            </div>
            <div
              id={`${layersTabsId}-${layersTab}-panel`}
              role="tabpanel"
              aria-labelledby={`${layersTabsId}-${layersTab}`}
            >
              {renderLayersContent()}
            </div>
          </DialogSection>
        </div>
      </DialogBody>

      <div className={layoutStyles.dialogPrimaryFooter}>
        <DialogPrimaryButton onClick={props.onClose}>
          {t("chart_settings_confirm", "OK")}
        </DialogPrimaryButton>
      </div>
    </DialogContainer>
  );
};
