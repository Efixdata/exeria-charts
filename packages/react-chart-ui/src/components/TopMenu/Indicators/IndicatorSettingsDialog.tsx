// @ts-nocheck
import React, { useState } from "react";
import { DialogHeader, DialogBody, DialogContainer, DialogFooter, TextInput, TextButton, Label, CheckboxInput, Select, Form } from "ui";
import { X } from "phosphor-react";

interface IndicatorSettingsDialogProps {
  onClick: any;
  indicator: any;
  chart: any;
}

const initializeConfig = (indicator, seriesManager) => {
  const config = { ...indicator };

  for (let i in config.inputs) {
    const input = config.inputs[i];

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
          const value = series.seriesId + ':' + series.fields[i];
          if (input?.properties?.def === series.fields[i]) {
            input.value = value;
            break;
          }
        }
      }
    }
  }

  return config;
}

export const IndicatorSettingsDialog = (props: IndicatorSettingsDialogProps) => {

  const [config, setConfig] = useState(initializeConfig(props.indicator, props.chart.getSeriesManager()));

  const renderInputs = () => {
    const inputs = [];

    for(let i in config.inputs) {
      inputs.push(renderInput(config.inputs[i], i));
    }
    
    return inputs;
  }

  const onInputChange = (key, value) => {
    const newConfig = { ...config };
    newConfig.inputs[key].value = value;
    
    setConfig(config => ({
      ...newConfig
    }))
  }

  const renderInput = (input: any, key: string) => {
    // input props: type, name, properties { def, max, min }, value
    // input types: integer, double, series, list, boolean, matrix (join, doublecheck, mix), conditional, booleanList, timezone, object
    if (input.type === "integer") {
      return <Label name={input.name} key={key + 'label'}><TextInput
        key={key}
        placeholder={input.name}
        type="number"
        min={input?.properties?.min}
        max={input?.properties?.max}
        step={1}
        allowEmpty={false}
        value={config.inputs[key].value}
        onChange={(event) => {onInputChange(key, event.target.value)}}
      ></TextInput></Label>
    } else if (input.type === "double") {
      return <Label name={input.name} key={key + 'label'}><TextInput
        key={key}
        placeholder={input.name}
        type="number"
        min={input?.properties?.min}
        max={input?.properties?.max}
        allowEmpty={false}
        value={config.inputs[key].value}
        onChange={(event) => {onInputChange(key, event.target.value)}}
      ></TextInput></Label>
    } else if(input.type === "series") {
      const seriesManager = props.chart.getSeriesManager();

      if (!seriesManager) {
        console.error("No series manager available");
        return;
      }

      
      const renderOptions = () => {
        const options = [];

        for (let key in seriesManager) {
          const series = seriesManager[key];
          for (let i in series.labels) {
            const value = series.seriesId + ':' + series.fields[i];
            options.push(<option key={value} value={value}>{series.title}.{series.labels[i]}</option>);
          }
        }
        return options;
      }

      return <Label name={input.name} key={key + 'label'}>
        <Select value={input.value} key={key} onChange={(event) => { onInputChange(key, event.target.value) }}>
          {renderOptions()}
        </Select>
      </Label>
    } else if(input.type === "list") {
      const renderOptions = () => {
        const options = [];

        for (let key in input.list) {
          const value = input.list[key];

          options.push(<option key={value} value={value}>{value}</option>);
        }
        return options;
      }

      return <Label name={input.name} key={key + 'label'}>
        <select key={key} value={input.value} onChange={(event) => { onInputChange(key, event.target.value) }}>
          {renderOptions()}
        </select>
      </Label>
    } else if (input.type === "boolean") {
      return <Label name={input.name} key={key + 'label'}><CheckboxInput
        key={key}
        value={config.inputs[key].value}
        onChange={(event) => {onInputChange(key, event.target.checked)}}
      ></CheckboxInput></Label>
    }
    
  }


  const renderDialogBody = () => {
      return <Form onSubmit={(e) => {
        e.preventDefault();
        onIndicatorPick();
      }
        }>
        { renderInputs() }
      </Form>
  };

  const validateForm = () => {
    for (let i in config.inputs) {
      const input = config.inputs[i];
      if (input === null || input === undefined) return false;
    }
    // TODO: add better form validation, indicate to the user what to do to make it valid.
    return true;
  }

  const onIndicatorPick = () => {
    const isFormValid = validateForm();

    if (!isFormValid) {
      console.error("Form invalid");
      return;
    }

    props.chart.addScript(config.key, config);
    props.onClose();
  }

  return (
    <>
      <DialogContainer style={props.style}>
        <DialogHeader>{`${props.indicator.title}`}<TextButton onClick={props.onBack} style={{ marginLeft: "auto" }}><X size={24}/></TextButton></DialogHeader>
        
        <DialogBody style={{ padding: "20px"}}>
        {renderDialogBody()}
        </DialogBody>
        <DialogFooter style={{ margin: "10px"}}><TextButton style={{marginLeft: "auto", padding: "24px"}} onClick={onIndicatorPick}>OK</TextButton></DialogFooter>
    </DialogContainer>

    </>
      
  );
};
