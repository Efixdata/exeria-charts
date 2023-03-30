// @ts-nocheck
import React, { useState } from "react";
import { DialogHeader, DialogBody, DialogContainer, DialogFooter, ListItem, ListItemsWrapper, TextInput, TextButton } from "ui";
import { MagnifyingGlass, X } from "phosphor-react";
import Fuse from 'fuse.js';

interface IndicatorSettingsDialogProps {
  onClick: any;
  indicator: any;
  chart: any;
}

export const IndicatorSettingsDialog = (props: IndicatorSettingsDialogProps) => {

  const [config, setConfig] = useState({ ...props.indicator })

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
    // input types: integer, double, series, list, boolean, matrix, conditional, booleanList, timezone, object
    if (input.type === "integer") {
      return <TextInput
        key={key}
        placeholder={input.name}
        type="number"
        min={input?.properties?.min}
        max={input?.properties?.max}
        step={1}
        value={config.inputs[key].value}
        onChange={(event) => {onInputChange(key, event.target.value * 1)}}
      ></TextInput>
    } else if (input.type === "double") {
      return <TextInput
        key={key}
        placeholder={input.name}
        type="number"
        min={input?.properties?.min}
        max={input?.properties?.max}
        value={config.inputs[key].value}
        onChange={(event) => {onInputChange(key, event.target.value * 1.0)}}
      ></TextInput>
    }
    
  }


  const renderDialogBody = () => {
    return <div style={{ color: "#7F9DCC", textAlign: "center", marginTop: "30px" }}>
      <div>{JSON.stringify(config)}</div>
      <form onSubmit={(e) => {e.preventDefault()}}>
        { renderInputs() }
      </form>
    </div>;
  };

  const onIndicatorPick = () => {
    props.chart.addScript(config.key, config);
    props.onClose();
  }

  return (
    <>
      <DialogContainer style={props.style}>
        <DialogHeader>CONFIGURE INDICATOR<TextButton onClick={props.onBack} style={{ marginLeft: "auto" }}><X size={24}/></TextButton></DialogHeader>
        
        <DialogBody style={{ margin: 12, paddingRight: 12}}>
        {renderDialogBody()}
        </DialogBody>
        <DialogFooter style={{ margin: "10px"}}><TextButton style={{marginLeft: "auto", padding: "24px"}} onClick={onIndicatorPick}>OK</TextButton></DialogFooter>
    </DialogContainer>

    </>
      
  );
};
