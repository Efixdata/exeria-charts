// @ts-nocheck
import * as React from "react";
import { TextButton, Modal, DialogBox, ListItem } from "ui";
import { Indicators } from "../img/icons";
import { useState } from "react";

export const IndicatorsButton = (props) => {
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [indicators, setIndicators] = useState([]);

  const functions = [];
  const strategies = [];

  const initializeScripts = () => {
    if (functions.length > 0 && indicators.length > 0 && strategies.length > 0) return;

    const scripts = props?.chart?.getScripts();

    const tempIndicators = [];
    for (let i in scripts) {
      const script = scripts[i];
      script.key = i;

      if (script.type === 'indicators') {
        tempIndicators.push(script);
      } else if (script.type === 'strategies') {
        strategies.push(script);
      } else if (script.type === 'functions') {
        functions.push(script);
      }
    }

    setIndicators(tempIndicators);
  }
  
  const createScriptConfig = (key, proto) => {
    
    var scriptCfg = {
        id: null,
        inputs: {},
        key:key,
        pane: proto.newPane ? "new" : "1",
        userName: key,
        visible: true
    }

    Object.keys(proto.inputs).forEach( k => {
      const input = proto.inputs[k];

      if (input.type == "series") {
        scriptCfg.inputs[k] = getDefaultSeries(input);
      } else {
        scriptCfg.inputs[k] = input.value;
      }
    });

    props.chart.fusion.configureScript(scriptCfg);

    return scriptCfg;
  }

  const getDefaultSeries = (input) => {
    for (var key in props.chart.fusion.getSeriesManager()) {
			const series = props.chart.fusion.getSeriesManager()[key];

			for (var i = 0; i < series.fields.length; i++) {
				
				if (input.properties.def === series.fields[i]) {
					return series.seriesId + ":" + series.fields[i];
				}
			}
		}
  }

  const renderDialogBody = () => {
    const listItems = [];

    for (let indicator of indicators) {
      const listItem = <ListItem title={indicator.title} subtitle={indicator.description} onClick={() => {
        console.log(indicator);
        props.chart.onScriptEditorApply(createScriptConfig(indicator.key, indicator));
      }}/>
      listItems.push(listItem);
    }

    return listItems;
  }

  const onClick = () => {
    setModalVisible(true);
    initializeScripts();
  };

  const onClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <TextButton onClick={onClick}>
        <Indicators style={{ marginRight: 6 }} /> <span>Indicators</span>
      </TextButton>

      <Modal
        visible={isModalVisible}
        onCloseOutsideClick={true}
        onClose={onClose}
      >
        <DialogBox title="Add indicator to chart" onClose={onClose}>
          {renderDialogBody()}
        </DialogBox>
      </Modal>
    </>
  );
};
