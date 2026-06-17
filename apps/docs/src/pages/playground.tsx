import Layout from "@theme/Layout";
import Playground from "@site/src/components/Playground";
import styles from "./playground.module.css";

export default function PlaygroundPage() {
  return (
    <Layout
      title="Playground"
      description="Experiment with Exeria Charts themes, tools, and indicators in a live interactive playground."
    >
      <main className={styles.page}>
        <Playground />
      </main>
    </Layout>
  );
}
