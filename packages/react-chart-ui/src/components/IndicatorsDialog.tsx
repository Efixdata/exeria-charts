// @ts-nocheck
import React, { useState } from "react";
import { DialogBox, ListItem } from "ui";
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
  })

  const renderDialogBody = () => {
    const listItems = [];

    for (let indicator of filteredIndicators) {
      const listItem = (
        <ListItem
          key={indicator.key}
          title={indicator.title}
          subtitle={indicator.description}
          onClick={() => {
            props.chart.addScript(indicator.key);
            props.onClose();
          }}
        />
      );
      
      listItems.push(listItem);
    }

    return listItems;
  };

  const onQueryChange = (e) => {
    setQuery(e.target.value);
    const queryResult = allIndicators.search(query);

    setFilteredIndicators(queryResult.map((result) => {
      return result.item;
    }));
  };

  return (
    <DialogBox
      title="Add indicator to chart"
      onClose={() => {
        props.onClose();
      }}
    >
      <input autoFocus type="text" onChange={onQueryChange} label="Search"/>
      {renderDialogBody()}
    </DialogBox>
  );
};
