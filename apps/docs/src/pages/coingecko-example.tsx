import Layout from "@theme/Layout";
import styles from "./coingecko-example.module.css";
import CoingeckoConnectorExample from "@site/src/components/CoingeckoConnectorExample";

export default function CoingeckoExamplePage() {
  return (
    <Layout
      title="CoinGecko Data Connector Example"
      description="Live example of the CoinGecko Data Connector displaying historical crypto market charts with REST polling."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>CoinGecko Data Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the CoinGecko Data Connector in action.
            Select a coin id and timeframe to load historical market data and receive price updates via 60-second polling.
          </p>
          <CoingeckoConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
