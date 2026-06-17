"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./forexOpportunityApp.module.css";

export type MenuSelectOption<T extends string> = {
  value: T;
  label: string;
};

type MenuSelectProps<T extends string> = {
  label: string;
  value: T;
  options: MenuSelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
};

export default function MenuSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: MenuSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  useEffect(() => {
    if (open) {
      setHighlightedIndex(selectedIndex);
    }
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (!rootRef.current?.contains(event.target as Node)) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((current) => (current + 1) % options.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((current) => (current - 1 + options.length) % options.length);
        return;
      }

      if (event.key === "Enter" && open) {
        event.preventDefault();
        const option = options[highlightedIndex];
        if (option) {
          onChange(option.value);
          setOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [highlightedIndex, onChange, open, options]);

  const selectOption = (nextValue: T) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={[styles.menuSelect, className].filter(Boolean).join(" ")}
    >
      <span className={styles.marketLabel}>{label}</span>
      <button
        type="button"
        className={styles.menuSelectTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selected?.label}</span>
        <span className={styles.menuSelectCaret} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div id={listId} className={styles.menuSelectPanel} role="listbox" aria-label={label}>
          {options.map((option, index) => {
            const active = option.value === value;
            const highlighted = index === highlightedIndex;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={[
                  styles.menuSelectOption,
                  active ? styles.menuSelectOptionActive : undefined,
                  highlighted && !active ? styles.menuSelectOptionHighlighted : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOption(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
