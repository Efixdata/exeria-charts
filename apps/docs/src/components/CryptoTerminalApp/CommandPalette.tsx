import { useEffect, useMemo, useRef, useState } from "react";
import type { WatchlistSymbol } from "./constants";
import styles from "./cryptoTerminalApp.module.css";

type CommandPaletteProps = {
  open: boolean;
  symbols: WatchlistSymbol[];
  onClose: () => void;
  onSelect: (symbolId: string) => void;
};

export default function CommandPalette({
  open,
  symbols,
  onClose,
  onSelect,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return symbols;
    }

    return symbols.filter(
      (item) =>
        item.id.toLowerCase().includes(normalized) ||
        item.label.toLowerCase().includes(normalized) ||
        item.pair.toLowerCase().includes(normalized),
    );
  }, [query, symbols]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={styles.drawerBackdrop}
        aria-label="Close command palette"
        onClick={onClose}
      />
      <section className={styles.commandPalette} aria-label="Jump to symbol">
        <input
          ref={inputRef}
          className={styles.commandInput}
          placeholder="Jump to symbol — BTC, ETH, SOL…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onClose();
            }
            if (event.key === "Enter" && filtered[0]) {
              onSelect(filtered[0].id);
              onClose();
            }
          }}
        />
        <ul className={styles.commandList}>
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={styles.commandItem}
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                <span>{item.pair}</span>
                <span className={styles.commandHint}>{item.id}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
