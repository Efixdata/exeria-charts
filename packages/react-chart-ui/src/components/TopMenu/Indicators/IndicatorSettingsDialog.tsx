import * as React from "react";
import { useContext, useEffect, useState } from "react";
import {
  DialogHeader,
  DialogBody,
  DialogContainer,
  TextInput,
  TextButton,
  Label,
  CheckboxInput,
  Form,
} from "ui";
import { X } from "phosphor-react";
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
import { DialogPrimaryButton } from "../ChartSettings/DialogPrimaryButton";
import { dialogFitBodyStyle, dialogFitLayoutStyle } from "../ChartSettings/dialogLayout";
import footerStyles from "../ChartSettings/chartSettings.module.css";

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
  list?: Record<string, string>;
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

const PARAMETER_INPUT_TYPES = new Set(["integer", "double", "series", "list", "boolean"]);

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

  return plotters.map((plotter) => ({
    ...plotter,
    dash: Array.isArray(plotter.dash) ? [...plotter.dash] : [],
  }));
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

const buildAddScriptPayload = (config: IndicatorConfig) => {
  const plotters = clonePlotters(config.plotters);

  return {
    key: config.key,
    newPane: config.newPane,
    inputs: JSON.parse(JSON.stringify(config.inputs || {})),
    plotters,
    plotterColors: buildPlotterColors(plotters),
    plotterDashes: buildPlotterDashMap(plotters),
  };
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
): IndicatorConfig => {
  const template = catalog?.[indicator.key] ?? indicator;
  const config: IndicatorConfig = {
    ...template,
    ...indicator,
    key: indicator.key,
    title: indicator.title,
    id: indicator.id,
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
      for (const seriesKey in seriesManager) {
        const series = seriesManager[seriesKey];
        for (const labelIndex in series.labels) {
          const value = series.seriesId + ":" + series.fields[labelIndex];
          if (input?.properties?.def === series.fields[labelIndex]) {
            input.value = value;
            break;
          }
        }
      }
    }
  }

  return config;
};

export const IndicatorSettingsDialog = (props: IndicatorSettingsDialogProps) => {
  const buildInitialConfig = () =>
    props.chart
      ? initializeConfig(
          props.indicator,
          props.chart.getSeriesManager(),
          props.chart.getScripts?.() as Record<string, IndicatorConfig> | undefined,
        )
      : {
          ...props.indicator,
          inputs: props.indicator.inputs || {},
          plotters: mergePlottersForDialog(undefined, props.indicator.plotters),
        };

  const [config, setConfig] = useState<IndicatorConfig>(buildInitialConfig);

  useEffect(() => {
    setConfig(buildInitialConfig());
  }, [props.indicator, props.chart]);

  // styled-components in this workspace pulls a mismatched React context type
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const themeContext = useContext(ThemeContext);

  const translate = (text: string): string => {
    if (props.chart) {
      return props.chart.translate(text);
    }

    return text;
  };

  const visualPlotterEntries = (config.plotters || [])
    .map((plotter, index) => ({ plotter, index }))
    .filter(
      (
        entry,
      ): entry is {
        plotter: IndicatorPlotter & { color: string; dash: number[] };
        index: number;
      } => typeof entry.plotter.color === "string" && Array.isArray(entry.plotter.dash),
    );

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

  const onPlotterDashChange = (index: number, styleId: string) => {
    const plotters = clonePlotters(config.plotters);
    const plotter = plotters[index];

    if (!plotter || !Array.isArray(plotter.dash)) {
      return;
    }

    plotter.dash = getPlotterLineStyleDash(styleId);
    setConfig({ ...config, plotters });
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
    visualPlotterEntries.map(({ plotter, index }) => {
      const label = getPlotterLabel(plotter, config, translate);
      const color = normalizeHexColor(plotter.color);
      const lineStyleId = getPlotterLineStyleId(plotter.dash);
      const translatedLineStyle = translate("lineStyle");
      const lineStyleLabel =
        translatedLineStyle !== "lineStyle" ? translatedLineStyle : "Line style";

      return (
        <div
          key={`plotter-appearance-${index}-${plotter.dataField || "line"}`}
          style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}
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

  const renderInput = (input: IndicatorInput, key: string): JSX.Element | null => {
    if (input.type === "integer") {
      return (
        <Label name={input.name} key={key + "label"}>
          <NumberInput
            integer
            allowEmpty={false}
            min={input?.properties?.min}
            max={input?.properties?.max}
            step={1}
            value={config.inputs?.[key]?.value}
            placeholder={input.name}
            ariaLabel={input.name}
            onChange={(nextValue) => onInputChange(key, nextValue)}
          />
        </Label>
      );
    }

    if (input.type === "double") {
      return (
        <Label name={input.name} key={key + "label"}>
          <NumberInput
            allowEmpty={false}
            min={input?.properties?.min}
            max={input?.properties?.max}
            step={input?.properties?.step}
            value={config.inputs?.[key]?.value}
            placeholder={input.name}
            ariaLabel={input.name}
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
        input.value !== null && input.value !== undefined ? String(input.value) : seriesOptions[0].value;

      return (
        <Label name={input.name} key={key + "label"}>
          <DialogSelect
            value={currentValue}
            options={seriesOptions}
            onChange={(nextValue) => onInputChange(key, nextValue)}
            ariaLabel={input.name}
          />
        </Label>
      );
    }

    if (input.type === "list") {
      const listOptions: DialogSelectOption[] = [];

      for (const listKey in input.list) {
        const optionValue = input.list[listKey];
        listOptions.push({
          value: String(optionValue),
          label: String(optionValue),
        });
      }

      const currentValue =
        input.value !== null && input.value !== undefined
          ? String(input.value)
          : listOptions[0]?.value ?? "";

      return (
        <Label name={input.name} key={key + "label"}>
          <DialogSelect
            value={currentValue}
            options={listOptions}
            onChange={(nextValue) => onInputChange(key, nextValue)}
            ariaLabel={input.name}
          />
        </Label>
      );
    }

    if (input.type === "boolean") {
      return (
        <Label name={input.name} key={key + "label"}>
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

    return null;
  };

  const renderDialogBody = () => {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          onIndicatorAdd();
        }}
      >
        {renderParameterInputs()}
        {visualPlotterEntries.length > 0 ? (
          <div
            role="separator"
            style={{
              width: "100%",
              borderTop: `1px solid ${themeContext?.dialog?.dividerColor || "rgba(255, 255, 255, 0.1)"}`,
              margin: "4px 0 8px",
            }}
          />
        ) : null}
        {renderPlotterAppearanceInputs()}
      </Form>
    );
  };

  const validateForm = () => {
    const inputConfig = config.inputs || {};

    for (const key in inputConfig) {
      const input = inputConfig[key];

      if (!input || !PARAMETER_INPUT_TYPES.has(input.type)) {
        continue;
      }

      if (input.value === null || input.value === undefined) {
        return false;
      }
    }

    return true;
  };

  const onIndicatorAdd = () => {
    const isFormValid = validateForm();

    if (!isFormValid) {
      console.error("Form invalid");
      return;
    }

    if (!props.chart) return;

    const payload = buildAddScriptPayload(config) as any;

    if (config.id != null && props.chart.updateIndicator) {
      props.chart.updateIndicator(config.id, payload);
    } else {
      props.chart.addScript(config.key, payload);
    }

    props.onClose();
  };

  return (
    <>
      <DialogContainer style={{ ...dialogFitLayoutStyle, ...props.style }}>
        <DialogHeader>
          <span>{`${props.indicator.title}`}</span>
          <TextButton onClick={props.onBack} style={{ marginLeft: "auto" }}>
            <X size={24} />
          </TextButton>
        </DialogHeader>

        <DialogBody style={{ ...dialogFitBodyStyle, padding: "20px" }}>
          {renderDialogBody()}
        </DialogBody>
        <div className={footerStyles.dialogPrimaryFooter}>
          <DialogPrimaryButton onClick={onIndicatorAdd}>OK</DialogPrimaryButton>
        </div>
      </DialogContainer>
    </>
  );
};
