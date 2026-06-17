import styles from "@site/src/pages/index.module.css";

const features = [
  {
    eyebrow: "Performance",
    title: "Built for dense market data.",
    body: "Render millions of data points at a flawless 60 FPS without browser lag. Real chart workflows powered by a highly optimized, raw HTML5 Canvas engine.",
    icon: "lightning",
  },
  {
    eyebrow: "Ownership",
    title: "Keep the chart surface yours.",
    body: "No iframes, no bloated external dependencies. Start with our core runtime, integrate seamlessly, and build your own custom UI controls around the chart.",
    icon: "cube",
  },
  {
    eyebrow: "Developer Experience",
    title: "Public API first. Native TypeScript.",
    body: "Enjoy a first-class developer experience with strict type-checking, comprehensive autocompletion, and a predictable lifecycle architecture.",
    icon: "code",
  },
  {
    eyebrow: "Release & Reliability",
    title: "Documentation that reads like a product.",
    body: "Trusted in high-stakes financial environments and built by Benzinga Award winners. Shorter guidance, cleaner defaults, and examples that help you launch faster.",
    icon: "badge",
  },
] as const;

function FeatureIcon({ name }: { name: (typeof features)[number]["icon"] }): JSX.Element {
  const paths: Record<(typeof features)[number]["icon"], string> = {
    lightning: "M13 10V3L4 14h7v7l9-11h-7z",
    cube: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    code: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    badge:
      "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  };

  return (
    <svg className={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={paths[name]} />
    </svg>
  );
}

type Props = {
  id?: string;
};

export default function FeaturesSection({ id = "features" }: Props): JSX.Element {
  return (
    <section id={id} className={styles.featuresSection}>
      <div className={styles.featuresGrid}>
        {features.map((item) => (
          <article key={item.title} className={styles.featureItem}>
            <FeatureIcon name={item.icon} />
            <p className={styles.featureEyebrow}>{item.eyebrow}</p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
