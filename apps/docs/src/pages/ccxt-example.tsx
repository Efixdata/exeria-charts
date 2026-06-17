import Layout from "@theme/Layout";
import styles from "./ccxt-example.module.css";
import CcxtConnectorExample from "@site/src/components/CcxtConnectorExample";

export default function CcxtExamplePage() {
  return (
    <Layout
      title="CCXT Data Connector Example"
      description="Live multi-exchange demo powered by the CCXT Data Connector and a docs API proxy."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>CCXT Data Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the CCXT Data Connector across multiple exchanges.
            Pick an exchange, symbol, and timeframe to load historical candles and polled live prices.
            Binance, Bybit, and OKX use dedicated connectors; other exchanges route through a CCXT API proxy.
          </p>
          <CcxtConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
