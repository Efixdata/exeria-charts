"use client";

import { useState } from "react";
import { formatPrice } from "../CryptoTerminalApp/terminalFormat";
import FilterSelect from "./FilterSelect";
import type { TimeframeId } from "./constants";
import type { ScreenerSignal } from "./signalCatalog";
import { formatSignalDate } from "./signalCatalog";
import SignalTerminalChartHost from "./SignalTerminalChartHost";
import styles from "./signalTerminalApp.module.css";

type SignalDetailExpandProps = {
  signal: ScreenerSignal;
  marketPrice?: number;
  timeframeId: TimeframeId;
  onPriceTick: (price: number, timestamp: number) => void;
};

export default function SignalDetailExpand({
  signal,
  marketPrice,
  timeframeId,
  onPriceTick,
}: SignalDetailExpandProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderSide, setOrderSide] = useState<"buy" | "sell">(signal.side);
  const [orderSize, setOrderSize] = useState("0.01");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [submitted, setSubmitted] = useState(false);

  const live = marketPrice ?? signal.signalPrice;
  const pnlHint =
    signal.side === "buy"
      ? ((live - signal.signalPrice) / signal.signalPrice) * 100
      : ((signal.signalPrice - live) / signal.signalPrice) * 100;

  const handleSubmit = () => {
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 2200);
  };

  return (
    <div className={styles.detailExpand}>
      <div
        className={styles.detailChart}
        onTouchStart={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <SignalTerminalChartHost
          selectedSymbol={signal.symbol}
          symbolLabel={signal.pair}
          timeframeId={timeframeId}
          onPriceTick={onPriceTick}
          onLoadingChange={setLoading}
          onError={setError}
        />
        {loading ? <span className={styles.detailOverlay}>Loading chart…</span> : null}
        {error ? <span className={styles.detailOverlayError}>{error}</span> : null}
      </div>

      <aside className={styles.detailAside}>
        <h3 className={styles.detailHeading}>Analysis</h3>
        <p className={styles.detailText}>{signal.description}</p>
        <dl className={styles.detailMeta}>
          <div>
            <dt>Source</dt>
            <dd>{signal.sourceLabel}</dd>
          </div>
          <div>
            <dt>Signal time</dt>
            <dd>{formatSignalDate(signal.timestamp)}</dd>
          </div>
          <div>
            <dt>Since signal</dt>
            <dd className={pnlHint >= 0 ? styles.changeUp : styles.changeDown}>
              {pnlHint >= 0 ? "+" : ""}
              {pnlHint.toFixed(2)}%
            </dd>
          </div>
        </dl>

        <div className={styles.tradeForm}>
          <div className={styles.tradeSideRow}>
            <button
              type="button"
              className={[styles.tradeSideBtn, orderSide === "buy" ? styles.tradeSideBuy : undefined]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setOrderSide("buy")}
            >
              Buy
            </button>
            <button
              type="button"
              className={[styles.tradeSideBtn, orderSide === "sell" ? styles.tradeSideSell : undefined]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setOrderSide("sell")}
            >
              Sell
            </button>
          </div>

          <label className={styles.tradeField}>
            <span>Size</span>
            <input
              value={orderSize}
              onChange={(event) => setOrderSize(event.target.value)}
              inputMode="decimal"
            />
          </label>

          <FilterSelect
            label="Order type"
            tone="field"
            value={orderType}
            options={[
              { value: "market", label: "Market" },
              { value: "limit", label: "Limit @ signal" },
            ]}
            onChange={(val) => setOrderType(val as "market" | "limit")}
          />

          <p className={styles.tradePriceLine}>
            Est. price: <strong>${formatPrice(orderType === "limit" ? signal.signalPrice : live)}</strong>
          </p>

          <button type="button" className={styles.primaryButton} onClick={handleSubmit}>
            {submitted ? "Order sent (demo)" : `Place ${orderSide} order`}
          </button>
        </div>
      </aside>
    </div>
  );
}
