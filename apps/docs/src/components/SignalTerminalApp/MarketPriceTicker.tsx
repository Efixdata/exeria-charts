"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "../CryptoTerminalApp/terminalFormat";
import styles from "./signalTerminalApp.module.css";

type MarketPriceTickerProps = {
  price?: number;
};

export default function MarketPriceTicker({ price }: MarketPriceTickerProps) {
  const previousRef = useRef<number | undefined>(undefined);
  const flashTimeoutRef = useRef<number | null>(null);
  const [tickTone, setTickTone] = useState<"up" | "down" | "neutral">("neutral");
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (price === undefined) {
      return;
    }

    const previous = previousRef.current;
    if (previous !== undefined && price !== previous) {
      setTickTone(price > previous ? "up" : "down");
      setPulsing(true);

      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }

      flashTimeoutRef.current = window.setTimeout(() => {
        setPulsing(false);
        flashTimeoutRef.current = null;
      }, 480);
    }

    previousRef.current = price;

    return () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [price]);

  if (price === undefined) {
    return <span className={styles.cellMarket}>—</span>;
  }

  return (
    <span
      className={[
        styles.cellMarket,
        tickTone === "up" ? styles.changeUp : undefined,
        tickTone === "down" ? styles.changeDown : undefined,
        pulsing && tickTone === "up" ? styles.marketTickPulseUp : undefined,
        pulsing && tickTone === "down" ? styles.marketTickPulseDown : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      ${formatPrice(price)}
    </span>
  );
}
