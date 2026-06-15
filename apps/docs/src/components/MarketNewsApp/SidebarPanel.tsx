"use client";

import { useEffect, useState } from "react";
import { findForexPair } from "../ForexOpportunityApp/forexInstruments";
import { loadStaticForexCandles } from "../ForexOpportunityApp/forexStaticData";
import ForexMiniChart from "./ForexMiniChart";
import { MARKET_NEWS_TIMEFRAME_ID, SIDEBAR_PAIRS, getSidebarPairColor } from "./constants";
import {
  buildQuoteSnapshot,
  formatQuoteChange,
  formatQuotePrice,
  quoteTone,
  type QuoteSnapshot,
} from "./sparkline";
import styles from "./marketNewsApp.module.css";

export default function SidebarPanel() {
  const [quotes, setQuotes] = useState<QuoteSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      try {
        const snapshots = await Promise.all(
          SIDEBAR_PAIRS.map(async (symbol) => {
            const candles = await loadStaticForexCandles(symbol, MARKET_NEWS_TIMEFRAME_ID);
            const meta = findForexPair(symbol);
            return buildQuoteSnapshot(symbol, candles, meta.priceDecimals);
          }),
        );

        if (!disposed) {
          setQuotes(snapshots);
          setLoading(false);
        }
      } catch {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      disposed = true;
    };
  }, []);

  return (
    <aside className={styles.sidebar} aria-label="Market sidebar">
      <section className={styles.sidebarCard}>
        <h2>Also moving today</h2>
        {loading ? <p className={styles.sidebarHint}>Loading quotes…</p> : null}
        <ul className={styles.quoteList}>
          {quotes.map((quote) => {
            const meta = findForexPair(quote.symbol);
            const tone = quoteTone(quote.changePercent);
            const accent = getSidebarPairColor(quote.symbol);

            return (
              <li key={quote.symbol} className={styles.quoteCard}>
                <div className={styles.quoteHeader}>
                  <strong>{meta.buttonLabel}</strong>
                  <span className={styles.quotePrice}>{formatQuotePrice(quote.last, meta.priceDecimals)}</span>
                  <span className={styles[tone]}>{formatQuoteChange(quote.changePercent)}</span>
                </div>
                <ForexMiniChart symbol={quote.symbol} color={accent} />
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
