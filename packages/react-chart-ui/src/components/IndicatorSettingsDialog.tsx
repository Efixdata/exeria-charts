// @ts-nocheck
import React, { useState } from "react";
import { DialogHeader, DialogBody, DialogContainer, ListItem, ListItemsWrapper, TextInput, TextButton } from "ui";
import { MagnifyingGlass, X } from "phosphor-react";
import Fuse from 'fuse.js';

interface IndicatorSettingsDialogProps {
  onClick: any;
  indicator: any;
  chart: any;
}

export const IndicatorSettingsDialog = (props: IndicatorSettingsDialogProps) => {

  const renderDialogBody = () => {
    // input types: integer, double, series, list, boolean, matrix, conditional, booleanList, timezone, object
    return <div style={{ color: "#7F9DCC", textAlign: "center", marginTop: "30px" }}>{JSON.stringify(props.indicator)}</div>;
  };

  const onIndicatorPick = (indicatorKey) => {
    props.chart.addScript(indicatorKey);
    props.onClose();
  }

  const onSubmit = () => {
    if (filteredIndicators[0]) {
      onIndicatorPick(filteredIndicators[0].key);
    }
  }

  return (
    <>
      <DialogContainer style={props.style}>
        <DialogHeader>CONFIGURE INDICATOR<TextButton onClick={props.onClose} style={{ marginLeft: "auto" }}><X size={24}/></TextButton></DialogHeader>
        
        <DialogBody style={{ margin: 12, paddingRight: 12}}>
        {renderDialogBody()}
        </DialogBody>
    </DialogContainer>

    </>
      
  );
};
