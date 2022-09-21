import React, {useState } from "react";

interface ButtonSelectProps {
  options: string[];
  onSelect: (option: string) => void;
  selectedOption?: string;
}

export const ButtonSelect = (props: ButtonSelectProps) => {
  const renderOptions = () => {
    const elements = [];
    for (let option of props.options) {
      elements.push(<option key={option}>{option}</option>);
    }
    return elements;
  };

  return <select value={props.selectedOption}>{renderOptions()}</select>;
};
