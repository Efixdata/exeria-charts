import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import ContactForm from "@site/src/components/ContactForm";
import layoutStyles from "@site/src/css/marketingLayout.module.css";
import styles from "./contact.module.css";

export default function ContactPage(): JSX.Element {
  return (
    <Layout
      title="Contact Us"
      description="Tell us about your Exeria Charts project — commercial licensing, consulting, development services, or enterprise rollout."
    >
      <main className={`${layoutStyles.page} ${styles.page}`}>
        <section className={`${layoutStyles.hero} ${layoutStyles.heroCompact} ${styles.hero}`}>
          <div className={layoutStyles.sectionHeader}>
            <h1 className={styles.title}>Contact Exeria</h1>
            <p className={layoutStyles.subtitle}>
              Planning a closed-source product, need integration help, or want hands-on development
              support? Share a few details and we&apos;ll route your inquiry to the right person.
            </p>
          </div>

          <div className={styles.highlights}>
            <div className={styles.highlightCard}>
              <h2>Commercial licensing</h2>
              <p>Ship proprietary apps without AGPL applying to your full codebase.</p>
            </div>
            <div className={styles.highlightCard}>
              <h2>Consulting &amp; development</h2>
              <p>Architecture reviews, chart UX, custom indicators, and product build-out.</p>
            </div>
            <div className={styles.highlightCard}>
              <h2>Enterprise rollout</h2>
              <p>Onboarding for larger teams, paid connectors, and production support.</p>
            </div>
          </div>
        </section>

        <section className={`${layoutStyles.section} ${styles.formSection}`}>
          <ContactForm />
          <p className={styles.licensingNote}>
            Not sure about AGPL vs commercial use yet? Start with the{" "}
            <Link to="/docs/guides/licensing">licensing guide</Link> — then come back here when you
            are ready to talk.
          </p>
        </section>
      </main>
    </Layout>
  );
}
