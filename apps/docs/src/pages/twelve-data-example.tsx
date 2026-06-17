import Layout from "@theme/Layout";
import styles from "./twelve-data-example.module.css";
import TwelveDataConnectorExample from "@site/src/components/TwelveDataConnectorExample";

export default function TwelveDataExamplePage() {
  return (
    <Layout
      title="Twelve Data Connector Example"
      description="Live forex chart demo powered by the Twelve Data connector and a docs API proxy."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Twelve Data Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the Twelve Data connector for forex pairs.
            Select a currency pair and timeframe to load historical candles and polled live prices
            through the docs API proxy (no API key in the browser).
          </p>
          <TwelveDataConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
