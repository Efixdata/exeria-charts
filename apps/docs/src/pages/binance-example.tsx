import Layout from "@theme/Layout";
import styles from "./binance-example.module.css";
import BinanceAdapterExample from "@site/src/components/BinanceAdapterExample";

export default function BinanceExamplePage() {
  return (
    <Layout
      title="Binance Adapter Example"
      description="Live example of the Binance adapter displaying real-time cryptocurrency price charts."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Binance Adapter Demo</h1>
          <p className={styles.description}>
            This example demonstrates the @efix-data/adapter-binance in action. 
            Select a cryptocurrency pair and timeframe to load historical data and receive real-time price updates.
          </p>
          <BinanceAdapterExample />
        </div>
      </main>
    </Layout>
  );
}
