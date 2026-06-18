import type { ReactNode } from "react";
import Layout from "@theme/Layout";
// @ts-ignore
// @ts-ignore
import _Link from "@docusaurus/Link";

let Link = _Link as any;

import type { StarterProject } from "@site/src/data/starterProjects";
import { getStarterProjectById } from "@site/src/data/starterProjects";
import StarterProjectDemo from "../StarterProjectDemo";
import styles from "./starterProjectPage.module.css";

type StarterProjectPageProps = {
  projectId: StarterProject["id"];
  children?: ReactNode;
};

export default function StarterProjectPage({ projectId, children }: StarterProjectPageProps) {
  const project = getStarterProjectById(projectId);

  if (!project) {
    return (
    // @ts-ignore
      <Layout title="Starter not found">
        <main className={styles.page}>
          <div className={styles.container}>
            <h1>Starter not found</h1>
            <p>
              <Link to="/#case-studies">Browse case studies</Link>
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title={`${project.title} — Live Demo`} description={project.body}>
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>
            <Link to="/#case-studies">Case studies</Link>
            <span aria-hidden> / </span>
            Live implementation
          </p>

          <h1>{project.title}</h1>
          <p className={styles.description}>{project.body}</p>

          {project.liveAppPath ? (
            <div className={styles.liveAppCta}>
              <div>
                <strong>
                  {projectId === "fintech-integration"
                    ? "Open the consumer demo"
                    : projectId === "forex-platforms"
                      ? "Open the live FX radar"
                      : projectId === "market-news"
                        ? "Open the live article demo"
                        : projectId === "quant-analytics"
                          ? "Open the live dashboard"
                          : projectId === "screener-signals"
                            ? "Open the live screener"
                            : "Open the live terminal"}
                </strong>
                <p>
                  {project.liveAppBlurb ??
                    "Full-screen workspace with live data, multi-panel layout, and copy-paste source."}
                </p>
              </div>
              <Link className={styles.liveAppButton} to={project.liveAppPath}>
                {projectId === "fintech-integration"
                  ? "Open demo"
                  : projectId === "forex-platforms"
                    ? "Open live radar"
                    : projectId === "market-news"
                      ? "Open live article"
                      : projectId === "quant-analytics"
                        ? "Open dashboard"
                        : projectId === "screener-signals"
                          ? "Open live screener"
                          : "Open live terminal"}{" "}
                <span aria-hidden>→</span>
              </Link>
            </div>
          ) : null}

          {project.previewImage ? (
            <figure className={styles.heroPreview}>
              <img src={project.previewImage.src} alt={project.previewImage.alt} loading="eager" />
            </figure>
          ) : (
            <StarterProjectDemo projectId={project.id} />
          )}

          <div className={styles.metaGrid}>
            <section className={styles.metaCard}>
              <h2>Stack</h2>
              <ul>
                {project.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className={styles.metaCard}>
              <h2>Highlights</h2>
              <ul>
                {project.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className={styles.related}>
            <h2>Related docs</h2>
            <ul className={styles.relatedList}>
              {project.relatedDocs.map((doc) => (
                <li key={doc.href}>
                  <Link to={doc.href}>{doc.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          {children}

          <p className={styles.footerNote}>
            {projectId === "crypto-terminal" ? (
              <>
                Scroll to <strong>For developers</strong> for download steps, then wire a real
                broker when you are ready. More recipes in the{" "}
                <Link to="/docs/tutorials/">tutorials</Link>.
              </>
            ) : projectId === "screener-signals" ? (
              <>
                Scroll to <strong>For developers</strong> to download the ZIP or copy snippets, then
                wire your screener or alert backend when you are ready. More recipes in the{" "}
                <Link to="/docs/tutorials/">tutorials</Link>.
              </>
            ) : projectId === "fintech-integration" ? (
              <>
                Open the <Link to="/starters/fintech-integration/app">consumer demo</Link> or{" "}
                <Link to="/starters/fintech-integration/app-bank">light banking demo</Link>, then
                scroll to <strong>For developers</strong> to download the ZIP or copy snippets. More
                recipes in the <Link to="/docs/tutorials/">tutorials</Link>.
              </>
            ) : projectId === "forex-platforms" ? (
              <>
                Scroll to <strong>For developers</strong> to download the ZIP or copy snippets, then
                wire your opportunity API and live FX feed when you are ready. More recipes in the{" "}
                <Link to="/docs/tutorials/">tutorials</Link>.
              </>
            ) : projectId === "market-news" ? (
              <>
                Scroll to <strong>For developers</strong> to download the ZIP or copy snippets, then
                wire your CMS headlines when you are ready. More recipes in the{" "}
                <Link to="/docs/tutorials/">tutorials</Link>.
              </>
            ) : projectId === "quant-analytics" ? (
              <>
                Scroll to <strong>For developers</strong> to download the ZIP or copy snippets, then
                wire your data feed and custom strategies when you are ready. More recipes in the{" "}
                <Link to="/docs/tutorials/">tutorials</Link>.
              </>
            ) : (
              <>
                This page is a runnable preview of the integration pattern. Extend it with your data
                source, broker API, and product chrome. See the{" "}
                <Link to="/docs/tutorials/">tutorials</Link> for step-by-step recipes.
              </>
            )}
          </p>
        </div>
      </main>
    </Layout>
  );
}
