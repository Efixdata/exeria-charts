import React, {useState } from "react";

interface ButtonSelectProps {
  options: string[];
  onSelect: (option: string|undefined) => void;
  selectedOption?: string;
}

export const ButtonSelect = (props: ButtonSelectProps) => {

  const [selectedOption, setSelectedOption] = useState(props.selectedOption);

  const renderOptions = () => {
    const elements = [];
    for (let option of props.options) {
      elements.push(<option key={option}>{option}</option>);
    }
    return elements;
  };

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const target = event.currentTarget as any;
    setSelectedOption(target.value);
    props.onSelect(target.value);
  }

  return <select onChange={onChange} value={selectedOption}>{renderOptions()}</select>;
};
