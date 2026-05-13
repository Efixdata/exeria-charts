import * as React from "react";
import { useState } from "react";
import {
  DialogHeader,
  DialogBody,
  DialogContainer,
  DialogFooter,
  TextInput,
  TextButton,
  Label,
  CheckboxInput,
  Select,
  Form,
} from "ui";
import { X } from "phosphor-react";
import type { NullableChartInstance } from "../../../chartTypes";

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
  [key: string]: any;
}

interface IndicatorConfig {
  key: string;
  title: string;
  inputs?: Record<string, IndicatorInput>;
  [key: string]: any;
}

interface IndicatorSettingsDialogProps {
  onClose: () => void;
  onBack: () => void;
  indicator: IndicatorConfig;
  chart: NullableChartInstance;
  style?: React.CSSProperties;
}

const initializeConfig = (indicator: IndicatorConfig, seriesManager: any): IndicatorConfig => {
  const config = { ...indicator, inputs: { ...(indicator.inputs || {}) } };

  for (let i in config.inputs) {
    const input = config.inputs[i];

    if (!input) continue;

    if (input.type === "integer" || input.type === "double" || input.type === "list") {
      if (input.value === null || input.value === undefined) {
        input.value = input?.properties?.def;
      }
    } else if (input.type === "boolean") {
      input.value = !!input.value;
    } else if (input.type === "series" && !input.value) {
      for (let key in seriesManager) {
        const series = seriesManager[key];
        for (let i in series.labels) {
          const value = series.seriesId + ":" + series.fields[i];
          if (input?.properties?.def === series.fields[i]) {
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
  const [config, setConfig] = useState<IndicatorConfig>(
    props.chart
      ? initializeConfig(props.indicator, props.chart.getSeriesManager())
      : { ...props.indicator, inputs: props.indicator.inputs || {} }
  );

  const renderInputs = () => {
    const inputs: (JSX.Element | null)[] = [];

    const inputConfig = config.inputs || {};
    for (let i in inputConfig) {
      const input = inputConfig[i];

      if (!input) continue;

      inputs.push(renderInput(input, i));
    }

    return inputs.filter((input): input is JSX.Element => input !== null);
  };

  const onInputChange = (key: string, value: any) => {
    if (!config.inputs) return;
    const newConfig = { ...config };
    const inputs = newConfig.inputs;
    const input = inputs?.[key];

    if (!input) return;

    input.value = value;

    setConfig(() => ({
      ...newConfig,
    }));
  };

  const renderInput = (input: IndicatorInput, key: string): JSX.Element | null => {
    // input props: type, name, properties { def, max, min }, value
    // input types: integer, double, series, list, boolean, matrix (join, doublecheck, mix), conditional, booleanList, timezone, object
    if (input.type === "integer") {
      return (
        <Label name={input.name} key={key + "label"}>
          <TextInput
            key={key}
            placeholder={input.name}
            type="number"
            min={input?.properties?.min}
            max={input?.properties?.max}
            step={1}
            allowEmpty={false}
            value={config.inputs?.[key]?.value}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onInputChange(key, event.target.value);
            }}
          ></TextInput>
        </Label>
      );
    } else if (input.type === "double") {
      return (
        <Label name={input.name} key={key + "label"}>
          <TextInput
            key={key}
            placeholder={input.name}
            type="number"
            min={input?.properties?.min}
            max={input?.properties?.max}
            step={input?.properties?.step}
            allowEmpty={false}
            value={config.inputs?.[key]?.value}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onInputChange(key, event.target.value);
            }}
          ></TextInput>
        </Label>
      );
    } else if (input.type === "series") {
      if (!props.chart) return null;
      const seriesManager = props.chart.getSeriesManager();

      if (!seriesManager) {
        console.error("No series manager available");
        return null;
      }

      const translate = (text: string): string => {
        if (props.chart) {
          return props.chart.translate(text);
        }
        return text;
      };

      const renderOptions = (): JSX.Element[] => {
        const options: JSX.Element[] = [];

        for (let key in seriesManager) {
          const series = seriesManager[key] as any;
          const labels = Array.isArray(series.labels)
            ? series.labels
            : Object.values(series.labels || {});
          const fields = Array.isArray(series.fields)
            ? series.fields
            : Object.values(series.fields || {});

          for (let i = 0; i < labels.length; i++) {
            const value = `${series.seriesId}:${String(fields[i])}`;
            options.push(
              <option key={value} value={value}>
                {translate(String(series.title || ""))}.{translate(String(labels[i] || ""))}
              </option>
            );
          }
        }
        return options;
      };

      return (
        <Label name={input.name} key={key + "label"}>
          <Select
            value={input.value}
            key={key}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              onInputChange(key, event.target.value);
            }}
          >
            {renderOptions()}
          </Select>
        </Label>
      );
    } else if (input.type === "list") {
      const renderOptions = () => {
        const options = [];

        for (let key in input.list) {
          const value = input.list[key];

          options.push(
            <option key={value} value={value}>
              {value}
            </option>
          );
        }
        return options;
      };

      return (
        <Label name={input.name} key={key + "label"}>
          <select
            key={key}
            value={input.value}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              onInputChange(key, event.target.value);
            }}
          >
            {renderOptions()}
          </select>
        </Label>
      );
    } else if (input.type === "boolean") {
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
        {renderInputs()}
      </Form>
    );
  };

  const validateForm = () => {
    const inputConfig = config.inputs || {};
    for (let i in inputConfig) {
      const input = inputConfig[i];
      if (input === null || input === undefined) return false;
    }
    // TODO: add better form validation, indicate to the user what to do to make
    return true;
  };

  const onIndicatorAdd = () => {
    const isFormValid = validateForm();

    if (!isFormValid) {
      console.error("Form invalid");
      return;
    }

    if (!props.chart) return;
    props.chart.addScript(config.key, config as any);
    props.onClose();
  };

  return (
    <>
      <DialogContainer style={props.style}>
        <DialogHeader>
          <span>{`${props.indicator.title}`}</span>
          <TextButton onClick={props.onBack} style={{ marginLeft: "auto" }}>
            <X size={24} />
          </TextButton>
        </DialogHeader>

        <DialogBody style={{ padding: "20px" }}>{renderDialogBody()}</DialogBody>
        <DialogFooter>
          <TextButton style={{ marginLeft: "auto", padding: "24px" }} onClick={onIndicatorAdd}>
            OK
          </TextButton>
        </DialogFooter>
      </DialogContainer>
    </>
  );
};
