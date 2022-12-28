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

    return listItems;
  };

  const onIndicatorPick = (indicatorKey) => {
    props.chart.addScript(indicatorKey);
    props.onClose();
  }

  const onQueryChange = (e) => {
    setQuery(e.target.value);
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
    <DialogBox
      title="Add indicator to chart"
      onClose={() => {
        props.onClose();
      }}
    >
      <form onSubmit={onSubmit}>
        <input autoFocus type="text" onChange={onQueryChange} label="Search"/>
      </form>
      {renderDialogBody()}
    </DialogBox>
  );
};
