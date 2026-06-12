import Layout from "@theme/Layout";
import styles from "./bybit-example.module.css";
import BybitConnectorExample from "@site/src/components/BybitConnectorExample";

export default function BybitExamplePage() {
  return (
    <Layout
      title="Bybit Data Connector Example"
      description="Live example of the Bybit Data Connector displaying real-time cryptocurrency price charts."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Bybit Data Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the Bybit Data Connector in action.
            Select a cryptocurrency pair and timeframe to load historical data and receive real-time price updates.
          </p>
          <BybitConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
