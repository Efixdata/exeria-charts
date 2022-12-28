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

  const createScriptConfig = (key, proto) => {
    var scriptCfg = {
      id: null,
      inputs: {},
      key: key,
      pane: proto.newPane ? "new" : "1",
      userName: key,
      visible: true,
    };

    Object.keys(proto.inputs).forEach((k) => {
      const input = proto.inputs[k];

      if (input.type == "series") {
        scriptCfg.inputs[k] = getDefaultSeries(input);
      } else {
        scriptCfg.inputs[k] = input.value;
      }
    });

    props.chart.fusion.configureScript(scriptCfg);

    return scriptCfg;
  };

  const getDefaultSeries = (input) => {
    for (var key in props.chart.fusion.getSeriesManager()) {
      const series = props.chart.fusion.getSeriesManager()[key];

      for (var i = 0; i < series.fields.length; i++) {
        if (input.properties.def === series.fields[i]) {
          return series.seriesId + ":" + series.fields[i];
        }
      }
    }
  };

  const renderDialogBody = () => {
    const listItems = [];

    for (let indicator of filteredIndicators) {
      const listItem = (
        <ListItem
          key={indicator.key}
          title={indicator.title}
          subtitle={indicator.description}
          onClick={() => {
            props.chart.onScriptEditorApply(
              createScriptConfig(indicator.key, indicator)
            );
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
