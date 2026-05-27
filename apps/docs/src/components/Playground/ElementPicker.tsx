import { useEffect, useId, useRef, useState } from "react";
import styles from "./playground.module.css";

export type ElementPickerOption<T extends string> = {
  value: T;
  label: string;
};

type ElementPickerProps<T extends string> = {
  label: string;
  value: T;
  options: ElementPickerOption<T>[];
  onChange: (value: T) => void;
  hideLabel?: boolean;
};

export default function ElementPicker<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
}: ElementPickerProps<T>) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      className={hideLabel ? styles.pickerRootInline : styles.pickerRoot}
      ref={rootRef}
    >
      {hideLabel ? null : <span className={styles.selectLabel}>{label}</span>}

      <button
        type="button"
        className={open ? styles.pickerTriggerOpen : styles.pickerTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.pickerValue}>{selected?.label}</span>
        <span className={styles.pickerChevron} aria-hidden />
      </button>

      {open ? (
        <ul id={listboxId} className={styles.pickerMenu} role="listbox" aria-label={label}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={isSelected ? styles.pickerOptionActive : styles.pickerOption}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
