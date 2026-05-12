import type { CSSProperties } from "react";
import ChartQuickstartExample from "../components/ChartQuickstartExample";

export default function Docs() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <span style={styles.eyebrow}>Documentation Preview</span>
        <h1 style={styles.title}>Interactive examples can now live inside the docs app.</h1>
        <p style={styles.lede}>
          This page is the first release-prep milestone for documentation: a live chart example
          driven only by the public chart package API, with no imports from internal source files.
        </p>
      </section>

      <section style={styles.grid}>
        <article style={styles.card}>
          <h2 style={styles.cardTitle}>Install</h2>
          <pre style={styles.codeBlock}>npm install @dexer-io/chart</pre>
          <p style={styles.cardText}>
            The docs app now resolves the chart package through the workspace package entrypoint so
            examples stay aligned with the release surface.
          </p>
        </article>

        <article style={styles.card}>
          <h2 style={styles.cardTitle}>What This Example Covers</h2>
          <p style={styles.cardText}>
            The example below mounts the chart client-side, loads candle data, switches between two
            datasets, and toggles draw modes using the public methods documented in the package
            README.
          </p>
        </article>
      </section>

      <section style={styles.exampleSection}>
        <div style={styles.exampleHeader}>
          <div>
            <span style={styles.eyebrow}>Live Example</span>
            <h2 style={styles.exampleTitle}>Basic chart initialization</h2>
          </div>
          <p style={styles.exampleCopy}>
            This is the pattern future docs pages can reuse for focused guides such as real-time
            updates, drawing tools, or theme customization.
          </p>
        </div>

        <ChartQuickstartExample />
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "48px 24px 72px",
    background:
      "radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 30%), linear-gradient(180deg, #06131f 0%, #0b1726 42%, #eef4fb 42%, #eef4fb 100%)",
    color: "#09111d",
    fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
  },
  hero: {
    maxWidth: 1040,
    margin: "0 auto 32px",
    color: "#f5fbff",
  },
  eyebrow: {
    display: "inline-block",
    marginBottom: 12,
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#7dd3fc",
  },
  title: {
    margin: 0,
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
    lineHeight: 1,
    maxWidth: 880,
  },
  lede: {
    margin: "16px 0 0",
    maxWidth: 760,
    fontSize: 18,
    lineHeight: 1.6,
    color: "rgba(245, 251, 255, 0.84)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    maxWidth: 1040,
    margin: "0 auto 28px",
  },
  card: {
    padding: 24,
    borderRadius: 20,
    background: "rgba(255, 255, 255, 0.9)",
    boxShadow: "0 24px 70px rgba(6, 19, 31, 0.14)",
  },
  cardTitle: {
    margin: "0 0 12px",
    fontSize: 22,
  },
  cardText: {
    margin: 0,
    lineHeight: 1.6,
    color: "#425466",
  },
  codeBlock: {
    margin: "0 0 12px",
    padding: "14px 16px",
    borderRadius: 14,
    background: "#09111d",
    color: "#d6f4ff",
    overflowX: "auto",
  },
  exampleSection: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: 24,
    borderRadius: 28,
    background: "rgba(255, 255, 255, 0.92)",
    boxShadow: "0 24px 70px rgba(6, 19, 31, 0.14)",
  },
  exampleHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: 12,
    marginBottom: 20,
  },
  exampleTitle: {
    margin: 0,
    fontSize: 30,
  },
  exampleCopy: {
    margin: 0,
    maxWidth: 720,
    lineHeight: 1.6,
    color: "#425466",
  },
};
