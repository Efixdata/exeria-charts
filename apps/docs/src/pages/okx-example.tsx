import Layout from "@theme/Layout";
import styles from "./okx-example.module.css";
import OkxConnectorExample from "@site/src/components/OkxConnectorExample";

export default function OkxExamplePage() {
  return (
    <Layout
      title="OKX Data Connector Example"
      description="Live example of the OKX Data Connector displaying real-time cryptocurrency price charts."
    >
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>OKX Data Connector Demo</h1>
          <p className={styles.description}>
            This example demonstrates the OKX Data Connector in action.
            Select a cryptocurrency pair and timeframe to load historical data and receive real-time price updates.
          </p>
          <OkxConnectorExample />
        </div>
      </main>
    </Layout>
  );
}
