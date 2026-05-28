import * as React from "react";
import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { MagnifyingGlass } from "phosphor-react";
import { CheckboxInput, Label, TextInput } from "ui";
import {
  type BooleanListOption,
  type BooleanListValue,
  buildBooleanListOptions,
  flattenBooleanListValue,
} from "./booleanListUtils";
import styles from "./booleanListInput.module.css";

interface BooleanListInputProps {
  label: string;
  value: BooleanListValue;
  templateValue: unknown;
  translate: (key: string) => string;
  onChange: (value: BooleanListValue) => void;
}

export const BooleanListInput = ({
  label,
  value,
  templateValue,
  translate,
  onChange,
}: BooleanListInputProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const options = useMemo(() => {
    const templateOptions = buildBooleanListOptions(templateValue, translate);

    return templateOptions.map((option) => ({
      ...option,
      checked: value[option.key] ?? option.checked,
    }));
  }, [templateValue, translate, value]);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) {
      return options;
    }

    const fuse = new Fuse(options, {
      includeScore: false,
      shouldSort: true,
      keys: ["label", "key"],
      threshold: 0.4,
    });

    return fuse.search(query).map((result) => result.item);
  }, [options, searchQuery]);

  const updateOptions = (nextOptions: BooleanListOption[]) => {
    onChange(flattenBooleanListValue(nextOptions));
  };

  const onToggleOption = (optionKey: string, checked: boolean) => {
    updateOptions(
      options.map((option) =>
        option.key === optionKey ? { ...option, checked } : option,
      ),
    );
  };

  const onSelectAll = () => {
    updateOptions(options.map((option) => ({ ...option, checked: true })));
  };

  const onClearAll = () => {
    updateOptions(options.map((option) => ({ ...option, checked: false })));
  };

  return (
    <div className={styles.root}>
      <Label name={label} />

      <div className={styles.search}>
        <TextInput
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={translate("search") !== "search" ? translate("search") : "Search..."}
          style={{ width: "100%" }}
        />
        <MagnifyingGlass
          size={18}
          style={{
            position: "absolute",
            right: 12,
            top: 7,
            opacity: 0.45,
            pointerEvents: "none",
          }}
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={onSelectAll}>
          {translate("selectAll") !== "selectAll" ? translate("selectAll") : "Select all"}
        </button>
        <button type="button" className={styles.actionButton} onClick={onClearAll}>
          {translate("clearAll") !== "clearAll" ? translate("clearAll") : "Clear all"}
        </button>
      </div>

      <div className={styles.list}>
        {filteredOptions.length === 0 ? (
          <div className={styles.empty}>
            {translate("noResults") !== "noResults" ? translate("noResults") : "No results"}
          </div>
        ) : (
          filteredOptions.map((option) => (
            <div
              key={option.key}
              className={styles.row}
              onClick={() => onToggleOption(option.key, !option.checked)}
            >
              <CheckboxInput
                value={option.checked}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  event.stopPropagation();
                  onToggleOption(option.key, event.target.checked);
                }}
              />
              <span className={styles.label}>{option.label}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
