import * as React from "react";

interface ButtonSelectProps {
  options: string[];
  onSelect: (option: string) => void;
  selectedOption?: string;
}

export const ButtonSelect = (props: ButtonSelectProps) => {
  const renderOptions = () => {
    const elements = [];
    for (let option of props.options) {
      if (option == props.selectedOption)
        elements.push(<option selected>{option}</option>);
      else elements.push(<option>{option}</option>);
    }
    return elements;
  };

  return <select>{renderOptions()}</select>;
};
