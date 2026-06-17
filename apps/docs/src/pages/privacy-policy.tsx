import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import layoutStyles from "@site/src/css/marketingLayout.module.css";
import styles from "./privacy-policy.module.css";

const CONTACT_PATH = "/docs/guides/licensing#commercial-license";

export default function PrivacyPolicyPage(): JSX.Element {
  return (
    <Layout
      title="Privacy Policy"
      description="How Exeria Charts (exeria.dev) collects and uses information when you browse our documentation, demos, and marketing pages."
    >
      <main className={`${layoutStyles.page} ${styles.page}`}>
        <section className={`${layoutStyles.section} ${styles.hero}`}>
          <div className={layoutStyles.sectionHeader}>
            <h1>Privacy Policy</h1>
            <p className={styles.updated}>Last updated: 17 June 2026</p>
          </div>
        </section>

        <article className={styles.content}>
          <div className={styles.note}>
            <p>
              This page describes how <strong>Efix Data Sp. z o. o.</strong> (&ldquo;Efix
              Data&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) handles information when you use{" "}
              <strong>Exeria Charts</strong> at{" "}
              <a href="https://exeria.dev">exeria.dev</a> — our documentation, marketing pages,
              interactive demos, and starter downloads.
            </p>
            <p>
              It does <strong>not</strong> govern applications you build with our open-source
              libraries. Your own product&apos;s privacy practices are your responsibility.
            </p>
          </div>

          <h2>1. Who is responsible for your data?</h2>
          <p>
            The data controller for exeria.dev is <strong>Efix Data Sp. z o. o.</strong>, the
            company behind Exeria Charts. For privacy-related questions or requests, contact us
            through our{" "}
            <Link to={CONTACT_PATH}>commercial licensing contact</Link> and include
            &ldquo;Privacy&rdquo; in the subject line.
          </p>

          <h2>2. What this site is</h2>
          <p>
            exeria.dev is a developer site for Exeria Charts — financial charting libraries,
            React UI components, data connectors, documentation, live demos, and downloadable
            starter projects. We do not operate a consumer trading platform or brokerage on this
            site.
          </p>

          <h2>3. Information we collect</h2>
          <p>Depending on how you use the site, we may process the following categories of data:</p>

          <h2>3.1 Browsing and technical data</h2>
          <p>
            Like most websites, our hosting infrastructure may automatically log technical
            information when you visit exeria.dev, such as your IP address, browser type, referring
            URL, pages viewed, and timestamps. We use this information to operate, secure, and
            improve the site.
          </p>

          <h2>3.2 Analytics</h2>
          <p>
            We may use privacy-oriented or mainstream analytics tools (for example{" "}
            <strong>Google Analytics</strong> via <code>gtag</code>) to understand how visitors use
            our pages. When enabled, analytics may use cookies or similar identifiers and record
            events such as:
          </p>
          <ul>
            <li>clicks on data-connector pricing or affiliate links,</li>
            <li>starter-project download actions,</li>
            <li>connector-request form submissions (limited metadata such as provider name).</li>
          </ul>
          <p>
            We do not use analytics on exeria.dev to profile you for advertising purposes.
          </p>

          <h2>3.3 Forms and inquiries</h2>
          <p>
            The <Link to="/data-connectors">Data Connectors</Link> page includes a request form
            where you may enter a provider name, work email, and optional notes.
          </p>
          <p>
            <strong>At present, this form does not transmit your email or notes to Exeria
            servers.</strong> Submitting the form shows an on-page confirmation and may trigger a
            limited analytics event. If you want us to review an integration request, please
            contact us through the{" "}
            <Link to={CONTACT_PATH}>licensing contact path</Link>.
          </p>
          <p>
            If you contact us for commercial licensing, support, or partnerships, we process the
            information you choose to send (such as your name, company, and email) to respond to
            your inquiry and manage our business relationship.
          </p>

          <h2>3.4 Client-side storage</h2>
          <p>
            Some features store preferences only in your browser, for example:
          </p>
          <ul>
            <li>light / dark theme selection,</li>
            <li>demo UI state (welcome banners, guided tours, workspace layouts in starter apps),</li>
            <li>local documentation search index data.</li>
          </ul>
          <p>
            This information stays on your device unless you clear site data. We do not receive it
            unless you separately share it with us.
          </p>

          <h2>3.5 Live demos and third-party market data</h2>
          <p>
            Interactive demos, playgrounds, and connector examples may load market data directly
            from third-party providers (exchanges, aggregators, or data vendors) in{" "}
            <strong>your browser</strong>. Those requests go from your device to the provider, not
            through Exeria as a data broker.
          </p>
          <p>
            Each provider has its own terms and privacy policy. You are responsible for complying
            with those terms when you use live data in production applications.
          </p>

          <h2>3.6 Downloads and package registries</h2>
          <p>
            Starter project ZIP files on exeria.dev are generated in your browser. Installing npm
            packages such as <code>@efixdata/exeria-chart</code> happens through{" "}
            <a href="https://www.npmjs.com/">npm</a> and is subject to npm&apos;s policies, not
            this website policy.
          </p>

          <h2>4. How we use information</h2>
          <p>We use the information described above to:</p>
          <ul>
            <li>provide and maintain exeria.dev,</li>
            <li>improve documentation, demos, and developer experience,</li>
            <li>measure interest in connectors and starter projects,</li>
            <li>respond to licensing and integration inquiries,</li>
            <li>protect the site against abuse and security incidents,</li>
            <li>comply with legal obligations.</li>
          </ul>

          <h2>5. Legal bases (EEA / UK visitors)</h2>
          <p>If you are in the European Economic Area or the United Kingdom, we rely on:</p>
          <ul>
            <li>
              <strong>Legitimate interests</strong> — operating and improving a public developer
              site, securing our infrastructure, and understanding aggregate usage,
            </li>
            <li>
              <strong>Consent</strong> — where required for non-essential cookies or analytics,
            </li>
            <li>
              <strong>Contract / pre-contractual steps</strong> — handling commercial licensing
              inquiries you initiate,
            </li>
            <li>
              <strong>Legal obligation</strong> — where applicable law requires retention or
              disclosure.
            </li>
          </ul>

          <h2>6. Cookies and similar technologies</h2>
          <p>
            We and our service providers may use cookies, local storage, and similar technologies
            for essential site functionality, theme preferences, analytics, and demo state as
            described above.
          </p>
          <p>
            You can control cookies through your browser settings. Blocking some cookies may limit
            certain features (for example saved demo layout or analytics measurement).
          </p>

          <h2>7. Third-party services</h2>
          <p>exeria.dev may interact with or link to services operated by others, including:</p>
          <ul>
            <li>
              <a href="https://fonts.google.com/">Google Fonts</a> — typography delivery,
            </li>
            <li>
              <a href="https://github.com/Efixdata/exeria-charts">GitHub</a> — source code and
              licensing documents,
            </li>
            <li>
              <a href="https://www.npmjs.com/org/efixdata">npm</a> — package distribution,
            </li>
            <li>
              market-data and exchange APIs used by live demos and connector examples,
            </li>
            <li>
              external editor or sandbox links (for example StackBlitz) when offered from starter
              pages.
            </li>
          </ul>
          <p>
            Those services process data under their own privacy policies. We encourage you to
            review them when you follow outbound links or use live data features.
          </p>

          <h2>8. How long we keep information</h2>
          <p>
            We retain server logs and analytics data only as long as needed for the purposes above,
            unless a longer period is required by law. Commercial correspondence is kept for the
            duration of our relationship and applicable limitation periods.
          </p>

          <h2>9. International transfers</h2>
          <p>
            Efix Data is based in Poland. If you access exeria.dev from outside the EEA, your
            information may be processed in Poland, the EEA, or in countries where our hosting or
            analytics providers operate. Where required, we use appropriate safeguards for
            cross-border transfers.
          </p>

          <h2>10. Your rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct, delete, restrict, or
            object to certain processing of your personal data, and to data portability. Where
            processing is based on consent, you may withdraw consent at any time.
          </p>
          <p>
            To exercise these rights, contact us via the{" "}
            <Link to={CONTACT_PATH}>licensing contact path</Link>. You may also lodge a complaint
            with your local supervisory authority; in Poland, this is the President of the Personal
            Data Protection Office (UODO).
          </p>

          <h2>11. Children</h2>
          <p>
            exeria.dev is aimed at developers and business users. We do not knowingly collect
            personal data from children under 16. If you believe a child has provided us personal
            data, please contact us so we can delete it.
          </p>

          <h2>12. Security</h2>
          <p>
            We apply reasonable technical and organizational measures to protect information
            processed through exeria.dev. No method of transmission or storage is completely secure;
            we cannot guarantee absolute security.
          </p>

          <h2>13. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date
            at the top reflects the latest revision. Material changes will be posted on this page.
          </p>

          <h2>14. Related documents</h2>
          <ul>
            <li>
              <Link to="/docs/guides/licensing">Licensing guide</Link>
            </li>
            <li>
              <a href="https://github.com/Efixdata/exeria-charts/blob/main/LICENSING.md">
                Commercial licensing terms
              </a>
            </li>
            <li>
              <a href="https://www.gnu.org/licenses/agpl-3.0.html">AGPL v3 license</a>
            </li>
          </ul>
        </article>
      </main>
    </Layout>
  );
}
