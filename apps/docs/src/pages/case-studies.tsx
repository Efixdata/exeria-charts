import Layout from "@theme/Layout";
import CaseStudiesSection from "@site/src/components/marketing/CaseStudiesSection";
import layoutStyles from "@site/src/css/marketingLayout.module.css";

export default function CaseStudiesPage(): JSX.Element {
  return (
    <Layout
      title="Case studies"
      description="Starter implementations for crypto terminals, forex platforms, fintech dashboards, and more."
    >
      <main className={layoutStyles.page}>
        <CaseStudiesSection id="case-studies" />
      </main>
    </Layout>
  );
}
