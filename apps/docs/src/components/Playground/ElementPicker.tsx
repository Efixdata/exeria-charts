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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((option) => option.value === value) ?? options[0];
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveIndex(selectedIndex);

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % options.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + options.length) % options.length);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) {
          onChange(option.value);
          setOpen(false);
          triggerRef.current?.focus();
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, onChange, open, options, selectedIndex]);

  return (
    <div
      className={hideLabel ? styles.pickerRootInline : styles.pickerRoot}
      ref={rootRef}
    >
      {hideLabel ? null : <span className={styles.selectLabel}>{label}</span>}

      <button
        ref={triggerRef}
        type="button"
        className={open ? styles.pickerTriggerOpen : styles.pickerTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={hideLabel ? label : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.pickerValue}>{selected?.label}</span>
        <span className={styles.pickerChevron} aria-hidden />
      </button>

      {open ? (
        <ul id={listboxId} className={styles.pickerMenu} role="listbox" aria-label={label}>
          {options.map((option, index) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={activeIndex === index ? 0 : -1}
                  className={isSelected ? styles.pickerOptionActive : styles.pickerOption}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    triggerRef.current?.focus();
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
