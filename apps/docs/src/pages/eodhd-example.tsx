import Layout from "@theme/Layout";
import styles from "./eodhd-example.module.css";
import EodhdConnectorExample from "@site/src/components/EodhdConnectorExample";

export default function EodhdExamplePage() {
  return (
    <Layout
      title="EODHD Connector Example"
      description="Live multi-asset chart demo powered by the EODHD connector and a docs API proxy."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>EODHD Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the EODHD connector for US stocks, forex, and crypto.
            Select an instrument and timeframe to load historical candles and polled live prices
            through the docs API proxy (no API token in the browser).
          </p>
          <EodhdConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
