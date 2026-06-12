import Layout from "@theme/Layout";
import styles from "./binance-example.module.css";
import BinanceConnectorExample from "@site/src/components/BinanceConnectorExample";

export default function BinanceExamplePage() {
  return (
    <Layout
      title="Binance Data Connector Example"
      description="Live example of the Binance Data Connector displaying real-time cryptocurrency price charts."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Binance Data Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the Binance Data Connector in action.
            Select a cryptocurrency pair and timeframe to load historical data and receive real-time price updates.
          </p>
          <BinanceConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
