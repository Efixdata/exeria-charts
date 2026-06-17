import Layout from "@theme/Layout";
import FeaturesSection from "@site/src/components/marketing/FeaturesSection";
import layoutStyles from "@site/src/css/marketingLayout.module.css";

export default function FeaturesPage(): JSX.Element {
  return (
    <Layout title="Features" description="Performance, ownership, TypeScript API, and product-grade documentation.">
      <main className={layoutStyles.page}>
        <section className={layoutStyles.section}>
          <div className={layoutStyles.sectionHeader}>
            <h1>Features</h1>
            <p>Why teams pick Exeria Charts for dashboards, terminals, and embedded analytics.</p>
          </div>
        </section>
        <FeaturesSection id="features" />
      </main>
    </Layout>
  );
}
