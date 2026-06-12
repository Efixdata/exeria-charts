import Layout from "@theme/Layout";
import styles from "./finage-example.module.css";
import FinageConnectorExample from "@site/src/components/FinageConnectorExample";

export default function FinageExamplePage() {
  return (
    <Layout
      title="Finage Connector Example"
      description="Live forex chart demo powered by the Finage connector and a docs API proxy."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Finage Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the Finage connector for forex pairs.
            Select a currency pair and timeframe to load historical candles and polled live prices
            through the docs API proxy (no API key in the browser).
          </p>
          <FinageConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
