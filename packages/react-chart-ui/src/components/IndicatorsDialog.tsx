// @ts-nocheck
import React, { useState } from "react";
import { DialogHeader, DialogBody, DialogContainer, ListItem, ListItemsWrapper, TextInput, TextButton } from "ui";
import { MagnifyingGlass, X } from "phosphor-react";
import Fuse from 'fuse.js';

interface IndicatorsDialogProps {
  onClick: any;
  indicators: any;
  chart: any;
}

export const IndicatorsDialog = (props: IndicatorsDialogProps) => {

  const [query, setQuery] = useState("");
  const [filteredIndicators, setFilteredIndicators] = useState(props.indicators);

  const allIndicators = new Fuse(props.indicators, {
    includeScore: false,
    shouldSort: true,
    keys: ["title", "description", "key"]
  });

  const renderDialogBody = () => {
    const listItems = [];

    for (let indicator of filteredIndicators) {
      const listItem = (
        <ListItem
          key={indicator.key}
          title={indicator.title}
          subtitle={indicator.description}
          onClick={() => {
            onIndicatorPick(indicator.key);
          }}
        />
      );

      listItems.push(listItem);
    }

    if (listItems.length === 0) {
      return <div style={{ color: "#7F9DCC", textAlign: "center", marginTop: "30px" }}>NO RESULTS</div>;
    }

    return (
      <ListItemsWrapper>
        {listItems}
      </ListItemsWrapper>
    );
  };

  const onIndicatorPick = (indicatorKey) => {
    props.chart.addScript(indicatorKey);
    props.onClose();
  }

  const onQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value) {
      setFilteredIndicators(props.indicators);
      return;
    }

    const queryResult = allIndicators.search(query);

    setFilteredIndicators(queryResult.map((result) => {
      return result.item;
    }));
  };

  const onSubmit = () => {
    if (filteredIndicators[0]) {
      onIndicatorPick(filteredIndicators[0].key);
    }
  }

  return (
      <DialogContainer style={props.style}>
        <DialogHeader>ADD INDICATOR TO CHART<TextButton onClick={props.onClose} style={{ marginLeft: "auto" }}><X size={24}/></TextButton></DialogHeader>
          <form onSubmit={onSubmit} style={{ padding: 20, borderBottom: "1px solid rgba(255, 255, 255, 0.1)", position: "relative" }}>
            <TextInput autoFocus type="text" onChange={onQueryChange} placeholder="Search..." />
            <MagnifyingGlass size={20} style={{ position: "absolute", right: 29, top: 29, color: "#7F9DCC", opacity: 0.5 }}/>
          </form>
        
        <DialogBody style={{ margin: 12, paddingRight: 12}}>
        {renderDialogBody()}
        </DialogBody>
    </DialogContainer>
      
  );
};
