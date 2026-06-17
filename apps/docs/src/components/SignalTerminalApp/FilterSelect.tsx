import { useEffect, useId, useRef, useState } from "react";
import styles from "./signalTerminalApp.module.css";

export type FilterSelectOption<T extends string> = {
  value: T;
  label: string;
};

type FilterSelectProps<T extends string> = {
  label: string;
  value: T;
  options: FilterSelectOption<T>[];
  onChange: (value: T) => void;
  /** `field` — sidebar/trade labels; `filter` — uppercase filter bar (default). */
  tone?: "filter" | "field";
};

export default function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  tone = "filter",
}: FilterSelectProps<T>) {
  const fieldClass = tone === "field" ? styles.tradeField : styles.filterField;
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
      return undefined;
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
    <div className={fieldClass}>
      <span>{label}</span>
      <div className={styles.filterSelect} ref={rootRef}>
        <button
          ref={triggerRef}
          type="button"
          className={
            open ? styles.filterSelectTriggerOpen : styles.filterSelectTrigger
          }
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={styles.filterSelectValue}>{selected?.label}</span>
          <span className={styles.filterSelectChevron} aria-hidden />
        </button>

        {open ? (
          <ul
            id={listboxId}
            className={styles.filterSelectMenu}
            role="listbox"
            aria-label={label}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;

              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={activeIndex === index ? 0 : -1}
                    className={
                      isSelected
                        ? styles.filterSelectOptionActive
                        : styles.filterSelectOption
                    }
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    {isSelected ? <span aria-hidden>✓ </span> : null}
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
