import Layout from "@theme/Layout";
import styles from "./finnhub-example.module.css";
import FinnhubConnectorExample from "@site/src/components/FinnhubConnectorExample";

export default function FinnhubExamplePage() {
  return (
    <Layout
      title="Finnhub Connector Example"
      description="Live multi-asset chart demo powered by the Finnhub connector and a docs API proxy."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Finnhub Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the Finnhub connector for US stocks, forex, and crypto.
            Select an instrument and timeframe to load historical candles and polled live prices
            through the docs API proxy (no API key in the browser).
          </p>
          <FinnhubConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
