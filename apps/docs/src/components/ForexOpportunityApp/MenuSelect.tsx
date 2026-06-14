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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

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
      >
        <span>{selected?.label}</span>
        <span className={styles.menuSelectCaret} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div id={listId} className={styles.menuSelectPanel} role="listbox" aria-label={label}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={[
                  styles.menuSelectOption,
                  active ? styles.menuSelectOptionActive : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
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
