import * as React from "react";
import { useContext, useEffect, useState } from "react";
import { useStableId } from "../../../utils/useStableId";
import {
  DialogHeader,
  DialogHeaderActions,
  DialogHeaderTitle,
  DialogBody,
  DialogContainer,
  TextInput,
  TextButton,
  Label,
  CheckboxInput,
  Form,
} from "ui";
import { Eye, EyeSlash, Lock, LockOpen, X } from "phosphor-react";
import { ThemeContext } from "styled-components";
import type { NullableChartInstance } from "../../../chartTypes";
import {
  type PlotterLineStyle,
  buildPlotterDashMap,
  getPlotterLineStyleDash,
  getPlotterLineStyleId,
} from "../../../utils/plotterLineStyles";
import { DialogSelect, type DialogSelectOption } from "./DialogSelect";
import { LineStyleSelect } from "./LineStyleSelect";
import { NumberInput } from "./NumberInput";
import { ColorField } from "../ChartSettings/ColorField";
import { ConditionalInput, isConditionalInputValid } from "./ConditionalInput";
import { BooleanListInput } from "./BooleanListInput";
import {
  isBooleanListValid,
  normalizeBooleanListForDialog,
} from "./booleanListUtils";
import { DialogPrimaryButton } from "../ChartSettings/DialogPrimaryButton";
import { dialogScrollBodyStyle, getDialogCatalogLayoutStyle } from "../../dialog/dialogLayout";
import { useChartEnvironment } from "../../../hooks/useChartEnvironment";
import layoutStyles from "../../dialog/dialogLayout.module.css";
import { DialogSection, dialogSectionStyles } from "../../dialog/DialogSection";
import { useChartTranslate } from "../../../hooks/useChartTranslate";
import { getIndicatorDialogCssVars } from "../../../utils/dialogThemeVars";
import chartSettingsStyles from "../ChartSettings/chartSettings.module.css";

interface IndicatorInput {
  type: string;
  name: string;
  properties?: {
    def?: any;
    max?: number;
    min?: number;
    step?: number;
  };
  value?: any;
  templateValue?: unknown;
  list?: Record<string, string> | string[];
  [key: string]: any;
}

interface IndicatorPlotter {
  type?: string;
  dataLink?: string;
  dataField?: string;
  color?: string;
  [key: string]: any;
}

interface IndicatorOutputSeries {
  labels?: string[] | Record<string, string>;
  fields?: string[] | Record<string, string>;
  title?: string;
}

interface IndicatorConfig {
  key: string;
  title: string;
  inputs?: Record<string, IndicatorInput>;
  outputs?: Record<string, { series?: IndicatorOutputSeries }>;
  plotters?: IndicatorPlotter[];
  [key: string]: any;
}

interface IndicatorSettingsDialogProps {
  onClose: () => void;
  onBack: () => void;
  indicator: IndicatorConfig;
  chart: NullableChartInstance;
  style?: React.CSSProperties;
}

const PARAMETER_INPUT_TYPES = new Set([
  "integer",
  "double",
  "series",
  "list",
  "boolean",
  "conditional",
  "booleanList",
]);

const STRATEGY_PLOTTER_TYPES = new Set([
  "StrategyObject",
  "CandlestickPatternStrategyObject",
  "FractalsObject",
]);

const LayerIconToggle = (props: {
  active: boolean;
  label: string;
  onChange: (next: boolean) => void;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={props.label}
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
    {props.active ? props.activeIcon : props.inactiveIcon}
  </button>
);

const DEFAULT_STRATEGY_BUY_COLOR = "#3CC3AF";
const DEFAULT_STRATEGY_SELL_COLOR = "#CE3E5B";

const isStrategyPlotter = (plotter: IndicatorPlotter) =>
  plotter.type != null && STRATEGY_PLOTTER_TYPES.has(String(plotter.type));

type ScriptCatalogType = "indicators" | "functions" | "strategies";

const resolveScriptCatalogType = (
  chart: NullableChartInstance,
  indicator: IndicatorConfig,
): ScriptCatalogType => {
  const catalogType = chart?.getScripts?.()?.[indicator.key]?.type;
  if (catalogType === "functions" || catalogType === "strategies") {
    return catalogType;
  }

  return "indicators";
};

const findScriptIdByKey = (
  chart: NullableChartInstance,
  scriptKey: string,
): string | number | null => {
  if (!chart) {
    return null;
  }

  const collections = [
    chart.getChartIndicatorSettings?.() ?? [],
    chart.getChartFunctionSettings?.() ?? [],
    chart.getChartStrategySettings?.() ?? [],
  ];

  for (const collection of collections) {
    for (let index = collection.length - 1; index >= 0; index -= 1) {
      const entry = collection[index];
      if (entry?.key === scriptKey && entry.scriptId != null) {
        return entry.scriptId;
      }
    }
  }

  return null;
};

const getFirstSeriesReference = (seriesManager: Record<string, any> | null | undefined) => {
  if (!seriesManager) {
    return null;
  }

  for (const seriesKey in seriesManager) {
    const series = seriesManager[seriesKey];
    const fields = Array.isArray(series.fields)
      ? series.fields
      : Object.values(series.fields || {});

    if (series.seriesId && fields.length > 0) {
      return `${series.seriesId}:${String(fields[0])}`;
    }
  }

  return null;
};

const buildListOptions = (list: IndicatorInput["list"]): DialogSelectOption[] => {
  if (!list) {
    return [];
  }

  if (Array.isArray(list)) {
    return list.map((optionValue) => ({
      value: String(optionValue),
      label: String(optionValue),
    }));
  }

  const options: DialogSelectOption[] = [];

  for (const listKey in list) {
    const optionValue = list[listKey];
    options.push({
      value: String(optionValue),
      label: String(optionValue),
    });
  }

  return options;
};

const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }

  return trimmed;
};

const clonePlotters = (plotters?: IndicatorPlotter[]) =>
  plotters ? (JSON.parse(JSON.stringify(plotters)) as IndicatorPlotter[]) : [];

const mergePlottersForDialog = (
  templatePlotters?: IndicatorPlotter[],
  indicatorPlotters?: IndicatorPlotter[],
): IndicatorPlotter[] => {
  const plotters = indicatorPlotters?.length
    ? clonePlotters(indicatorPlotters)
    : clonePlotters(templatePlotters);

  return plotters.map((plotter, index) => {
    const templatePlotter = templatePlotters?.[index];

    if (isStrategyPlotter(plotter)) {
      return {
        ...plotter,
        buyColor: normalizeHexColor(
          typeof plotter.buyColor === "string"
            ? plotter.buyColor
            : typeof templatePlotter?.buyColor === "string"
              ? templatePlotter.buyColor
              : DEFAULT_STRATEGY_BUY_COLOR,
        ),
        sellColor: normalizeHexColor(
          typeof plotter.sellColor === "string"
            ? plotter.sellColor
            : typeof templatePlotter?.sellColor === "string"
              ? templatePlotter.sellColor
              : DEFAULT_STRATEGY_SELL_COLOR,
        ),
      };
    }

    return {
      ...plotter,
      dash: Array.isArray(plotter.dash) ? [...plotter.dash] : [],
    };
  });
};

const mergeInputsForDialog = (
  templateInputs: Record<string, IndicatorInput> = {},
  indicatorInputs: Record<string, IndicatorInput> = {},
): Record<string, IndicatorInput> => {
  const inputs: Record<string, IndicatorInput> = {};

  for (const key of Object.keys(templateInputs)) {
    const templateInput = templateInputs[key];
    const indicatorInput = indicatorInputs[key];

    inputs[key] = {
      ...JSON.parse(JSON.stringify(templateInput)),
      ...(indicatorInput ? JSON.parse(JSON.stringify(indicatorInput)) : {}),
      value:
        indicatorInput?.value !== undefined && indicatorInput?.value !== null
          ? indicatorInput.value
          : templateInput.value,
    };
  }

  return inputs;
};

const buildPlotterColors = (plotters: IndicatorPlotter[]) => {
  const plotterColors: Record<string, string> = {};

  for (const plotter of plotters) {
    if (!plotter.dataField || typeof plotter.color !== "string") {
      continue;
    }

    plotterColors[String(plotter.dataField)] = normalizeHexColor(plotter.color);
  }

  return plotterColors;
};

type LayerSettingsPayload = {
  visible: boolean;
  priceTagVisible: boolean;
};

const applyLayerSettingsToPlotters = (
  plotters: IndicatorPlotter[],
  layerSettings: LayerSettingsPayload,
) => {
  for (const plotter of plotters) {
    plotter.priceTag = layerSettings.priceTagVisible;
    plotter.priceLine = layerSettings.priceTagVisible;
  }
};

const buildAddScriptPayload = (
  config: IndicatorConfig,
  layerSettings?: LayerSettingsPayload,
) => {
  const plotters = clonePlotters(config.plotters);

  if (layerSettings) {
    applyLayerSettingsToPlotters(plotters, layerSettings);
  }

  return {
    key: config.key,
    pane: config.pane,
    newPane: config.pane === "new" || config.newPane === true,
    visible: layerSettings?.visible ?? true,
    inputs: JSON.parse(JSON.stringify(config.inputs || {})),
    plotters,
    plotterColors: buildPlotterColors(plotters),
    plotterDashes: buildPlotterDashMap(plotters),
  };
};

const resolveDefaultPane = (
  template: IndicatorConfig,
  indicator: IndicatorConfig,
  chart: NullableChartInstance,
) => {
  if (indicator.pane != null && indicator.pane !== "") {
    return String(indicator.pane);
  }

  if (template.newPane === true) {
    return "new";
  }

  const mainPanel = chart?.getChartPanels?.().find((panel) => panel.main);
  return mainPanel?.id ?? chart?.getChartPanels?.()[0]?.id ?? "new";
};

const buildPanelOptions = (
  chart: NullableChartInstance,
  translate: (text: string) => string,
): DialogSelectOption[] => {
  const options: DialogSelectOption[] = [
    {
      value: "new",
      label: translate("fusion_dialog_panel_selector_new_panel"),
    },
  ];

  const panels = chart?.getChartPanels?.() ?? [];
  for (const panel of panels) {
    options.push({
      value: panel.id,
      label: panel.label,
    });
  }

  return options;
};

const getPlotterLabel = (
  plotter: IndicatorPlotter,
  indicator: IndicatorConfig,
  translate: (text: string) => string,
) => {
  const dataLink = plotter.dataLink;
  const dataField = plotter.dataField;
  const output = dataLink ? indicator.outputs?.[dataLink] : undefined;
  const series = output?.series;

  if (series && dataField) {
    const fields = Array.isArray(series.fields)
      ? series.fields
      : Object.values(series.fields || {});
    const labels = Array.isArray(series.labels)
      ? series.labels
      : Object.values(series.labels || {});
    const fieldIndex = fields.findIndex((field) => String(field) === String(dataField));

    if (fieldIndex >= 0 && labels[fieldIndex]) {
      return translate(String(labels[fieldIndex]));
    }
  }

  if (dataField) {
    return translate(String(dataField));
  }

  return translate("line");
};

const initializeConfig = (
  indicator: IndicatorConfig,
  seriesManager: any,
  catalog?: Record<string, IndicatorConfig>,
  chart?: NullableChartInstance,
): IndicatorConfig => {
  const template = catalog?.[indicator.key] ?? indicator;
  const config: IndicatorConfig = {
    ...template,
    ...indicator,
    key: indicator.key,
    title: indicator.title,
    id: indicator.id,
    pane: resolveDefaultPane(template, indicator, chart),
    inputs: mergeInputsForDialog(template.inputs, indicator.inputs),
    plotters: mergePlottersForDialog(template.plotters, indicator.plotters),
  };

  for (const key in config.inputs) {
    const input = config.inputs[key];

    if (!input) continue;

    if (input.type === "integer" || input.type === "double" || input.type === "list") {
      if (input.value === null || input.value === undefined) {
        input.value = input?.properties?.def;
      }
    } else if (input.type === "boolean") {
      input.value = !!input.value;
    } else if (input.type === "series" && !input.value) {
      let matched = false;

      for (const seriesKey in seriesManager) {
        const series = seriesManager[seriesKey];
        for (const labelIndex in series.labels) {
          const value = series.seriesId + ":" + series.fields[labelIndex];
          if (input?.properties?.def === series.fields[labelIndex]) {
            input.value = value;
            matched = true;
            break;
          }
        }

        if (matched) {
          break;
        }
      }

      if (!matched) {
        const fallbackSeries = getFirstSeriesReference(seriesManager);
        if (fallbackSeries) {
          input.value = fallbackSeries;
        }
      }
    } else if (input.type === "conditional") {
      if (!input.value || typeof input.value !== "object" || !input.value.type) {
        input.value = { type: "double", value: 0 };
      }
    } else if (input.type === "booleanList") {
      const templateValue = template.inputs?.[key]?.value ?? input.value;
      input.templateValue = JSON.parse(JSON.stringify(templateValue ?? {}));
      input.value = normalizeBooleanListForDialog(input.value ?? input.templateValue);
    }
  }

  return config;
};

export const IndicatorSettingsDialog = (props: IndicatorSettingsDialogProps) => {
  const { isCompact } = useChartEnvironment();
  const titleId = useStableId("indicator-settings-title");
  const t = useChartTranslate(props.chart);

  const buildInitialConfig = () =>
    props.chart
      ? initializeConfig(
          props.indicator,
          props.chart.getSeriesManager(),
          props.chart.getScripts?.() as Record<string, IndicatorConfig> | undefined,
          props.chart,
        )
      : {
          ...props.indicator,
          inputs: props.indicator.inputs || {},
          plotters: mergePlottersForDialog(undefined, props.indicator.plotters),
        };

  const [config, setConfig] = useState<IndicatorConfig>(buildInitialConfig);

  const scriptType = resolveScriptCatalogType(props.chart, config);

  const readLayerSettings = (indicatorConfig: IndicatorConfig) => {
    const defaults = { visible: true, priceTagVisible: false, locked: false };

    if (!props.chart || indicatorConfig.id == null) {
      return defaults;
    }

    const scriptId = indicatorConfig.id;
    const type = resolveScriptCatalogType(props.chart, indicatorConfig);

    if (type === "functions") {
      const item = props.chart
        .getChartFunctionSettings?.()
        ?.find((entry) => entry.scriptId === scriptId);

      return {
        visible: item?.visible ?? true,
        priceTagVisible: item?.priceTagVisible ?? false,
        locked: props.chart.getChartIndicatorLocked?.(scriptId) ?? false,
      };
    }

    if (type === "strategies") {
      const item = props.chart
        .getChartStrategySettings?.()
        ?.find((entry) => entry.scriptId === scriptId);

      return {
        visible: item?.visible ?? true,
        priceTagVisible: false,
        locked: props.chart.getChartIndicatorLocked?.(scriptId) ?? false,
      };
    }

    const item = props.chart
      .getChartIndicatorSettings?.()
      ?.find((entry) => entry.scriptId === scriptId);

    return {
      visible: item?.visible ?? true,
      priceTagVisible: item?.priceTagVisible ?? false,
      locked: props.chart.getChartIndicatorLocked?.(scriptId) ?? false,
    };
  };

  const [layerSettings, setLayerSettings] = useState(() =>
    readLayerSettings(buildInitialConfig()),
  );

  useEffect(() => {
    const nextConfig = buildInitialConfig();
    setConfig(nextConfig);
    setLayerSettings(readLayerSettings(nextConfig));
  }, [props.indicator, props.chart, props.indicator.key, props.indicator.id]);

  // styled-components in this workspace pulls a mismatched React context type
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const themeContext = useContext(ThemeContext);
  const dialogThemeVars = getIndicatorDialogCssVars(themeContext);

  const translate = (text: string): string => {
    if (props.chart) {
      return props.chart.translate(text);
    }

    return text;
  };

  const plotterEntries = (config.plotters || []).map((plotter, index) => ({ plotter, index }));

  const linePlotterEntries = plotterEntries.filter(
    (
      entry,
    ): entry is {
      plotter: IndicatorPlotter & { color: string; dash: number[] };
      index: number;
    } =>
      !isStrategyPlotter(entry.plotter) &&
      typeof entry.plotter.color === "string" &&
      Array.isArray(entry.plotter.dash),
  );

  const strategyPlotterEntries = plotterEntries.filter((entry) => isStrategyPlotter(entry.plotter));

  const renderParameterInputs = () => {
    const inputs: (JSX.Element | null)[] = [];
    const inputConfig = config.inputs || {};

    for (const key in inputConfig) {
      const input = inputConfig[key];

      if (!input || !PARAMETER_INPUT_TYPES.has(input.type)) {
        continue;
      }

      inputs.push(renderInput(input, key));
    }

    return inputs.filter((input): input is JSX.Element => input !== null);
  };

  const onInputChange = (key: string, value: any) => {
    if (!config.inputs) return;

    const newConfig = { ...config, inputs: { ...config.inputs } };
    const input = newConfig.inputs[key];

    if (!input) return;

    input.value = value;
    setConfig(newConfig);
  };

  const onPlotterColorChange = (index: number, value: string) => {
    const plotters = clonePlotters(config.plotters);
    const plotter = plotters[index];

    if (!plotter || typeof plotter.color !== "string") {
      return;
    }

    plotter.color = normalizeHexColor(value);
    setConfig({ ...config, plotters });
  };

  const onStrategyBuyColorChange = (index: number, value: string) => {
    const plotters = clonePlotters(config.plotters);
    const plotter = plotters[index];

    if (!plotter || !isStrategyPlotter(plotter)) {
      return;
    }

    plotter.buyColor = normalizeHexColor(value);
    setConfig({ ...config, plotters });
  };

  const onStrategySellColorChange = (index: number, value: string) => {
    const plotters = clonePlotters(config.plotters);
    const plotter = plotters[index];

    if (!plotter || !isStrategyPlotter(plotter)) {
      return;
    }

    plotter.sellColor = normalizeHexColor(value);
    setConfig({ ...config, plotters });
  };

  const onPlotterDashChange = (index: number, styleId: string) => {
    const plotters = clonePlotters(config.plotters);
    const plotter = plotters[index];

    if (!plotter || !Array.isArray(plotter.dash)) {
      return;
    }

    plotter.dash = getPlotterLineStyleDash(styleId);
    setConfig({ ...config, plotters });
  };

  const onPaneChange = (nextPane: string) => {
    setConfig({
      ...config,
      pane: nextPane,
      newPane: nextPane === "new",
    });
  };

  const getLineStyleOptionLabel = (style: PlotterLineStyle) => {
    const translated = translate(style.labelKey);
    return translated !== style.labelKey ? translated : style.defaultLabel;
  };

  const buildSeriesOptions = (): DialogSelectOption[] => {
    if (!props.chart) {
      return [];
    }

    const seriesManager = props.chart.getSeriesManager();
    if (!seriesManager) {
      return [];
    }

    const options: DialogSelectOption[] = [];

    for (const seriesKey in seriesManager) {
      const series = seriesManager[seriesKey] as any;
      const labels = Array.isArray(series.labels)
        ? series.labels
        : Object.values(series.labels || {});
      const fields = Array.isArray(series.fields)
        ? series.fields
        : Object.values(series.fields || {});

      for (let i = 0; i < labels.length; i++) {
        const value = `${series.seriesId}:${String(fields[i])}`;
        options.push({
          value,
          label: `${translate(String(series.title || ""))}.${translate(String(labels[i] || ""))}`,
        });
      }
    }

    return options;
  };

  const renderPlotterAppearanceInputs = () =>
    linePlotterEntries.map(({ plotter, index }) => {
      const label = getPlotterLabel(plotter, config, translate);
      const color = normalizeHexColor(plotter.color);
      const lineStyleId = getPlotterLineStyleId(plotter.dash);
      const translatedLineStyle = translate("lineStyle");
      const lineStyleLabel =
        translatedLineStyle !== "lineStyle" ? translatedLineStyle : "Line style";

      return (
        <div
          key={`plotter-appearance-${index}-${plotter.dataField || "line"}`}
          className={dialogSectionStyles.fieldRow}
        >
          <ColorField
            label={label}
            value={color}
            onChange={(value) => onPlotterColorChange(index, value)}
          />
          <Label name={lineStyleLabel}>
            <LineStyleSelect
              value={lineStyleId}
              lineColor={color}
              onChange={(styleId) => onPlotterDashChange(index, styleId)}
              getOptionLabel={getLineStyleOptionLabel}
              ariaLabel={`${label} ${lineStyleLabel}`}
            />
          </Label>
        </div>
      );
    });

  const renderStrategyArrowColorInputs = () =>
    strategyPlotterEntries.map(({ plotter, index }) => {
      const label = getPlotterLabel(plotter, config, translate);
      const buyColor = normalizeHexColor(
        typeof plotter.buyColor === "string" ? plotter.buyColor : DEFAULT_STRATEGY_BUY_COLOR,
      );
      const sellColor = normalizeHexColor(
        typeof plotter.sellColor === "string" ? plotter.sellColor : DEFAULT_STRATEGY_SELL_COLOR,
      );
      const buyArrowLabel = translate("buyColor");
      const sellArrowLabel = translate("sellColor");
      const resolvedBuyLabel =
        buyArrowLabel !== "buyColor" ? buyArrowLabel : "Buy arrow";
      const resolvedSellLabel =
        sellArrowLabel !== "sellColor" ? sellArrowLabel : "Sell arrow";

      return (
        <div
          key={`strategy-arrow-colors-${index}-${plotter.dataField || "strategy"}`}
          className={dialogSectionStyles.fieldRow}
        >
          <ColorField
            label={`${label} — ${resolvedBuyLabel}`}
            value={buyColor}
            onChange={(value) => onStrategyBuyColorChange(index, value)}
          />
          <ColorField
            label={`${label} — ${resolvedSellLabel}`}
            value={sellColor}
            onChange={(value) => onStrategySellColorChange(index, value)}
          />
        </div>
      );
    });

  const getConditionalModeLabel = (mode: "double" | "series") => {
    const key = mode === "double" ? "value" : "series";
    const translated = translate(key);
    return translated !== key ? translated : mode === "double" ? "Value" : "Series";
  };

  const renderInput = (input: IndicatorInput, key: string): JSX.Element | null => {
    const inputLabel = translate(input.name);

    if (input.type === "integer") {
      return (
        <Label name={inputLabel} key={key + "label"}>
          <NumberInput
            integer
            allowEmpty={false}
            min={input?.properties?.min}
            max={input?.properties?.max}
            step={1}
            value={config.inputs?.[key]?.value}
            placeholder={inputLabel}
            ariaLabel={inputLabel}
            onChange={(nextValue) => onInputChange(key, nextValue)}
          />
        </Label>
      );
    }

    if (input.type === "double") {
      return (
        <Label name={inputLabel} key={key + "label"}>
          <NumberInput
            allowEmpty={false}
            min={input?.properties?.min}
            max={input?.properties?.max}
            step={input?.properties?.step}
            value={config.inputs?.[key]?.value}
            placeholder={inputLabel}
            ariaLabel={inputLabel}
            onChange={(nextValue) => onInputChange(key, nextValue)}
          />
        </Label>
      );
    }

    if (input.type === "series") {
      if (!props.chart) return null;

      const seriesOptions = buildSeriesOptions();

      if (seriesOptions.length === 0) {
        console.error("No series manager available");
        return null;
      }

      const currentValue =
        input.value !== null && input.value !== undefined
          ? String(input.value)
          : seriesOptions[0].value;

      return (
        <Label name={inputLabel} key={key + "label"}>
          <DialogSelect
            value={currentValue}
            options={seriesOptions}
            onChange={(nextValue) => onInputChange(key, nextValue)}
            ariaLabel={inputLabel}
          />
        </Label>
      );
    }

    if (input.type === "list") {
      const listOptions = buildListOptions(input.list);

      const currentValue =
        input.value !== null && input.value !== undefined
          ? String(input.value)
          : listOptions[0]?.value ?? "";

      return (
        <Label name={inputLabel} key={key + "label"}>
          <DialogSelect
            value={currentValue}
            options={listOptions}
            onChange={(nextValue) => onInputChange(key, nextValue)}
            ariaLabel={inputLabel}
          />
        </Label>
      );
    }

    if (input.type === "conditional") {
      if (!props.chart) return null;

      const seriesOptions = buildSeriesOptions();

      if (seriesOptions.length === 0) {
        console.error("No series manager available");
        return null;
      }

      return (
        <ConditionalInput
          key={key + "conditional"}
          label={inputLabel}
          value={input.value}
          seriesOptions={seriesOptions}
          min={input?.properties?.min}
          max={input?.properties?.max}
          step={input?.properties?.step}
          getModeLabel={getConditionalModeLabel}
          onChange={(nextValue) => onInputChange(key, nextValue)}
        />
      );
    }

    if (input.type === "boolean") {
      return (
        <Label name={inputLabel} key={key + "label"}>
          <CheckboxInput
            key={key}
            value={config.inputs?.[key]?.value}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onInputChange(key, event.target.checked);
            }}
          ></CheckboxInput>
        </Label>
      );
    }

    if (input.type === "booleanList") {
      return (
        <BooleanListInput
          key={key + "boolean-list"}
          label={inputLabel}
          value={input.value || {}}
          templateValue={input.templateValue ?? input.value ?? {}}
          translate={translate}
          onChange={(nextValue) => onInputChange(key, nextValue)}
        />
      );
    }

    return null;
  };

  const renderPanelSelector = () => {
    if (!props.chart) {
      return null;
    }

    const panelOptions = buildPanelOptions(props.chart, translate);
    if (panelOptions.length === 0) {
      return null;
    }

    const panelLabel = translate("fusion_dialog_panel_selector_label");
    const resolvedPanelLabel =
      panelLabel !== "fusion_dialog_panel_selector_label" ? panelLabel : "Panel";

    return (
      <div className={dialogSectionStyles.fieldRow}>
        <Label name={resolvedPanelLabel}>
          <DialogSelect
            value={config.pane != null ? String(config.pane) : "new"}
            options={panelOptions}
            onChange={onPaneChange}
            ariaLabel={resolvedPanelLabel}
          />
        </Label>
      </div>
    );
  };

  const applyLayerSettingsToChart = (
    scriptId: string | number,
    settings: { visible: boolean; priceTagVisible: boolean; locked: boolean },
    type: ScriptCatalogType = scriptType,
  ) => {
    if (!props.chart) {
      return;
    }

    if (type === "functions") {
      props.chart.setChartFunctionVisibility?.(scriptId, settings.visible);
      props.chart.setChartFunctionPriceTagVisibility?.(scriptId, settings.priceTagVisible);
    } else if (type === "strategies") {
      props.chart.setChartStrategyVisibility?.(scriptId, settings.visible);
    } else {
      props.chart.setChartIndicatorVisibility?.(scriptId, settings.visible);
      props.chart.setChartIndicatorPriceTagVisibility?.(scriptId, settings.priceTagVisible);
    }

    props.chart.setChartIndicatorLocked?.(scriptId, settings.locked);
  };

  const renderLayerControls = () => {
    const supportsScale = scriptType !== "strategies";
    const scriptId = config.id;

    const setVisible = (visible: boolean) => {
      setLayerSettings((previous) => {
        const next = { ...previous, visible };
        if (scriptId != null) {
          applyLayerSettingsToChart(scriptId, next);
        }
        return next;
      });
    };

    const setPriceTagVisible = (priceTagVisible: boolean) => {
      setLayerSettings((previous) => {
        const next = { ...previous, priceTagVisible };
        if (scriptId != null) {
          applyLayerSettingsToChart(scriptId, next);
        }
        return next;
      });
    };

    const setLocked = (locked: boolean) => {
      setLayerSettings((previous) => {
        const next = { ...previous, locked };
        if (scriptId != null) {
          applyLayerSettingsToChart(scriptId, next);
        }
        return next;
      });
    };

    return (
      <DialogSection
        title={t("indicator_settings_visibility_lock", "Visibility, scale and lock")}
      >
        <div className={dialogSectionStyles.fieldStack}>
          <div className={chartSettingsStyles.toggleRow}>
            <div>
              <span className={chartSettingsStyles.toggleLabel}>
                {t("drawing_settings_show_on_chart", "Show on chart")}
              </span>
              <span className={chartSettingsStyles.toggleHint}>
                {t("drawing_settings_show_hint", "Hide without deleting the drawing")}
              </span>
            </div>
            <LayerIconToggle
              active={layerSettings.visible}
              label={
                layerSettings.visible
                  ? t("drawing_settings_hide_drawing", "Hide drawing")
                  : t("drawing_settings_show_drawing", "Show drawing")
              }
              onChange={setVisible}
              activeIcon={<Eye size={18} weight="regular" />}
              inactiveIcon={<EyeSlash size={18} weight="regular" />}
            />
          </div>
          {supportsScale ? (
            <div className={chartSettingsStyles.toggleRow}>
              <div>
                <span className={chartSettingsStyles.toggleLabel}>
                  {t("layers_col_scale", "Scale")}
                </span>
                <span className={chartSettingsStyles.toggleHint}>
                  {t("layers_hint_scale", "Show price label on the value axis")}
                </span>
              </div>
              <LayerIconToggle
                active={layerSettings.priceTagVisible}
                label={
                  layerSettings.priceTagVisible
                    ? t("drawing_settings_hide_drawing", "Hide drawing")
                    : t("drawing_settings_show_drawing", "Show drawing")
                }
                onChange={setPriceTagVisible}
                activeIcon={<Eye size={18} weight="regular" />}
                inactiveIcon={<EyeSlash size={18} weight="regular" />}
              />
            </div>
          ) : null}
          <div className={chartSettingsStyles.toggleRow}>
            <div>
              <span className={chartSettingsStyles.toggleLabel}>
                {t("drawing_settings_lock_position", "Lock position")}
              </span>
              <span className={chartSettingsStyles.toggleHint}>
                {t("indicator_settings_lock_hint", "Prevent opening indicator settings from the chart")}
              </span>
            </div>
            <LayerIconToggle
              active={layerSettings.locked}
              label={
                layerSettings.locked
                  ? t("drawing_settings_unlock_drawing", "Unlock drawing")
                  : t("drawing_settings_lock_drawing", "Lock drawing")
              }
              onChange={setLocked}
              activeIcon={<Lock size={18} weight="regular" />}
              inactiveIcon={<LockOpen size={18} weight="regular" />}
            />
          </div>
        </div>
      </DialogSection>
    );
  };

  const renderDialogBody = () => {
    const parameterInputs = renderParameterInputs();
    const hasParameters = parameterInputs.length > 0;
    const hasAppearanceFields =
      linePlotterEntries.length > 0 || strategyPlotterEntries.length > 0;
    const hasPanelSelector = props.chart != null && buildPanelOptions(props.chart, translate).length > 0;
    const showAppearanceSection = hasAppearanceFields || hasPanelSelector;
    return (
      <div className={dialogSectionStyles.formColumn}>
        <Form
          style={{
            flexDirection: "column",
            alignItems: "stretch",
            flexWrap: "nowrap",
            width: "100%",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            onIndicatorAdd();
          }}
        >
          {hasParameters ? (
            <DialogSection title={t("indicator_settings_parameters", "Parameters")}>
              <div className={dialogSectionStyles.fieldStack}>{parameterInputs}</div>
            </DialogSection>
          ) : null}

          {showAppearanceSection ? (
            <DialogSection title={t("drawing_settings_appearance", "Appearance")}>
              {hasAppearanceFields ? (
                <div className={dialogSectionStyles.appearanceGrid}>
                  {renderPlotterAppearanceInputs()}
                  {renderStrategyArrowColorInputs()}
                </div>
              ) : null}
              {renderPanelSelector()}
            </DialogSection>
          ) : null}

          {renderLayerControls()}
        </Form>
      </div>
    );
  };

  const resolveEffectiveInputValue = (input: IndicatorInput, seriesOptions: DialogSelectOption[]) => {
    if (input.type === "conditional") {
      return input.value;
    }

    if (input.type === "series") {
      if (input.value !== null && input.value !== undefined) {
        return input.value;
      }

      return seriesOptions[0]?.value ?? null;
    }

    return input.value;
  };

  const isInputValid = (input: IndicatorInput, seriesOptions: DialogSelectOption[]) => {
    if (input.type === "conditional") {
      return isConditionalInputValid(input.value);
    }

    if (input.type === "booleanList") {
      return isBooleanListValid(input.value);
    }

    const effectiveValue = resolveEffectiveInputValue(input, seriesOptions);
    return effectiveValue !== null && effectiveValue !== undefined && effectiveValue !== "";
  };

  const validateInputs = (
    inputConfig: Record<string, IndicatorInput>,
    seriesOptions: DialogSelectOption[],
  ) => {
    for (const key in inputConfig) {
      const input = inputConfig[key];

      if (!input || !PARAMETER_INPUT_TYPES.has(input.type)) {
        continue;
      }

      if (!isInputValid(input, seriesOptions)) {
        return false;
      }
    }

    return true;
  };

  const onIndicatorAdd = async () => {
    const seriesOptions = buildSeriesOptions();
    const normalizedConfig: IndicatorConfig = {
      ...config,
      inputs: { ...(config.inputs || {}) },
    };

    for (const key in normalizedConfig.inputs) {
      const input = normalizedConfig.inputs[key];

      if (!input) {
        continue;
      }

      if (input.type === "series") {
        input.value = resolveEffectiveInputValue(input, seriesOptions);
      }
    }

    if (!validateInputs(normalizedConfig.inputs || {}, seriesOptions)) {
      console.error("Form invalid");
      return;
    }

    if (!props.chart) return;

    const payload = buildAddScriptPayload(normalizedConfig, layerSettings) as any;

    if (config.id != null && props.chart.updateIndicator) {
      props.chart.updateIndicator(config.id, payload);
      applyLayerSettingsToChart(config.id, layerSettings);
    } else {
      await Promise.resolve(props.chart.addScript(config.key, payload));
      const newScriptId = findScriptIdByKey(props.chart, config.key);
      if (newScriptId != null) {
        applyLayerSettingsToChart(newScriptId, layerSettings);
      }
    }

    props.onClose();
  };

  return (
    <>
      <DialogContainer
        ariaLabelledBy={titleId}
        style={{
          ...dialogThemeVars,
          ...getDialogCatalogLayoutStyle(isCompact),
          ...props.style,
        }}
      >
        <DialogHeader>
          <DialogHeaderTitle id={titleId}>{`${props.indicator.title}`}</DialogHeaderTitle>
          <DialogHeaderActions>
            <TextButton onClick={props.onBack} ariaLabel={t("dialog_back", "Back")}>
              <X size={24} aria-hidden />
            </TextButton>
          </DialogHeaderActions>
        </DialogHeader>

        <DialogBody style={dialogScrollBodyStyle}>
          <div className={layoutStyles.scrollArea} style={dialogThemeVars}>
            {renderDialogBody()}
          </div>
        </DialogBody>
        <div className={layoutStyles.dialogPrimaryFooter}>
          <DialogPrimaryButton onClick={onIndicatorAdd}>
            {t("indicator_settings_confirm", "OK")}
          </DialogPrimaryButton>
        </div>
      </DialogContainer>
    </>
  );
};
