import Layout from "@theme/Layout";
import styles from "./gate-example.module.css";
import GateConnectorExample from "@site/src/components/GateConnectorExample";

export default function GateExamplePage() {
  return (
    <Layout
      title="Gate.io Connector Example"
      description="Live example of the Gate.io Data Connector displaying real-time cryptocurrency price charts."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Gate.io Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the Gate.io connector in action.
            Select a USDT spot pair and timeframe to load historical candles from the
            public API v4 and receive live candle updates via WebSocket.
          </p>
          <GateConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
