import Layout from "@theme/Layout";
import styles from "./kucoin-example.module.css";
import KucoinConnectorExample from "@site/src/components/KucoinConnectorExample";

export default function KucoinExamplePage() {
  return (
    <Layout
      title="KuCoin Data Connector Example"
      description="Live example of the KuCoin Data Connector displaying real-time cryptocurrency price charts."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>KuCoin Data Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the KuCoin Data Connector in action.
            Select a USDT pair and timeframe to load historical data and receive real-time candle updates via WebSocket.
          </p>
          <KucoinConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
