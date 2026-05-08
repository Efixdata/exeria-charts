// @ts-nocheck
import React, { useState, useContext } from "react";
import {
  DialogHeader,
  DialogBody,
  DialogContainer,
  ListItem,
  ListItemsWrapper,
  TextInput,
  TextButton,
  Form,
} from "ui";
import { MagnifyingGlass, X } from "phosphor-react";
import Fuse from "fuse.js";
import { IndicatorSettingsDialog } from "./IndicatorSettingsDialog";
import { ThemeContext } from "styled-components";
import type { NullableChartInstance } from "../../../chartTypes";

interface IndicatorsDialogProps {
  onClick: any;
  indicators: any;
  chart: NullableChartInstance;
}

export const IndicatorsDialog = (props: IndicatorsDialogProps) => {
  const [filteredIndicators, setFilteredIndicators] = useState(props.indicators);
  const [chosenIndicator, setChosenIndicator] = useState(null);
  const themeContext = useContext(ThemeContext);

  const allIndicators = new Fuse(props.indicators, {
    includeScore: false,
    shouldSort: true,
    keys: ["title", "description", "key"],
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
            onIndicatorPick(indicator);
          }}
        />
      );

      listItems.push(listItem);
    }

    if (listItems.length === 0) {
      return (
        <div
          style={{ color: themeContext.dialog.textColor, textAlign: "center", marginTop: "30px" }}
        >
          NO RESULTS
        </div>
      );
    }

    return (
      <DialogBody style={{ margin: 12, paddingRight: 12 }}>
        <ListItemsWrapper>{listItems}</ListItemsWrapper>
      </DialogBody>
    );
  };

  const onIndicatorPick = (indicator) => {
    setChosenIndicator(indicator);
  };

  const onQueryChange = (e) => {
    const value = e.target.value;
    if (!value) {
      setFilteredIndicators(props.indicators);
      return;
    }

    const queryResult = allIndicators.search(value).map((result) => result.item);

    setFilteredIndicators(queryResult);
  };

  const onSubmit = (event: React.FormEventHandler<HTMLFormElement>) => {
    event.preventDefault();
  };

  const renderSearchBar = () => {
    return (
      <Form
        onSubmit={onSubmit}
        style={{
          padding: 20,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          position: "relative",
        }}
      >
        <TextInput
          autoFocus
          type="text"
          onChange={onQueryChange}
          placeholder="Search..."
          style={{ width: "100%" }}
        />
        <MagnifyingGlass
          size={20}
          style={{
            position: "absolute",
            right: 29,
            top: 29,
            color: themeContext.buttons.color,
            opacity: 0.5,
          }}
        />
      </Form>
    );
  };

  const renderDialogHeader = () => {
    return (
      <DialogHeader>
        ADD INDICATOR TO CHART
        <TextButton onClick={props.onClose} style={{ marginLeft: "auto" }}>
          <X size={24} />
        </TextButton>
      </DialogHeader>
    );
  };

  const renderIndicatorsDialog = () => {
    return (
      <DialogContainer style={props.style}>
        {renderDialogHeader()}
        {renderSearchBar()}
        {renderDialogBody()}
      </DialogContainer>
    );
  };

  if (chosenIndicator) {
    return (
      <IndicatorSettingsDialog
        chart={props.chart}
        indicator={chosenIndicator}
        onClose={() => {
          props.onClose();
        }}
        onBack={() => {
          setChosenIndicator(null);
        }}
      />
    );
  } else {
    return renderIndicatorsDialog();
  }
};
