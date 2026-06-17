import Layout from "@theme/Layout";
import styles from "./coinbase-example.module.css";
import CoinbaseConnectorExample from "@site/src/components/CoinbaseConnectorExample";

export default function CoinbaseExamplePage() {
  return (
    <Layout
      title="Coinbase Connector Example"
      description="Live example of the Coinbase Data Connector displaying real-time cryptocurrency price charts."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Coinbase Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the Coinbase connector in action.
            Select a USD or USDC spot pair and timeframe to load historical candles from the
            Advanced Trade API and receive live price updates via WebSocket.
          </p>
          <CoinbaseConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
