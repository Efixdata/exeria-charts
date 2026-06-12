import Layout from "@theme/Layout";
import styles from "./kraken-example.module.css";
import KrakenConnectorExample from "@site/src/components/KrakenConnectorExample";

export default function KrakenExamplePage() {
  return (
    <Layout
      title="Kraken Data Connector Example"
      description="Live example of the Kraken Data Connector displaying real-time cryptocurrency price charts."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Kraken Data Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the Kraken Data Connector in action.
            Select a USD pair and timeframe to load historical data and receive real-time candle updates via WebSocket v2.
          </p>
          <KrakenConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
