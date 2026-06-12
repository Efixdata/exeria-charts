import Layout from "@theme/Layout";
import styles from "./massive-example.module.css";
import MassiveConnectorExample from "@site/src/components/MassiveConnectorExample";

export default function MassiveExamplePage() {
  return (
    <Layout
      title="Massive Connector Example"
      description="Live multi-asset chart demo powered by the Massive connector and a docs API proxy."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Massive Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the Massive connector across stocks, forex, and crypto.
            Switch between Apple, Microsoft, EUR/USD, GBP/USD, BTC-USD, and ETH-USD to load
            historical candles and polled live prices through the docs API proxy (no API key in
            the browser).
          </p>
          <MassiveConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
