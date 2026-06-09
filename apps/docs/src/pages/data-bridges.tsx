import { useEffect, useMemo, useState } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import clsx from "clsx";
import RequestBridgeForm from "@site/src/components/RequestBridgeForm";
import {
  DATA_BRIDGE_LICENSE_URLS,
  bridgeMatchesSearch,
  dataBridgeCatalog,
  getBridgeFeatureItems,
  getBridgeInstallCommand,
  getBridgeIntegrationSnippet,
  getBridgeLicenseShort,
  getBridgePricingLabel,
  getBridgePricingSummary,
  getBridgeStatusLabel,
  type DataBridgeEntry,
} from "@site/src/data/dataBridgesCatalog";
import { DATA_BRIDGE_EULA_SECTIONS, DATA_BRIDGE_EULA_TITLE } from "@site/src/data/dataBridgeEula";
import layoutStyles from "@site/src/css/marketingLayout.module.css";
import { trackMarketingEvent } from "@site/src/utils/marketingAnalytics";
import styles from "./data-bridges.module.css";

type CatalogFilter = "all" | "free" | "partner";

function CheckIcon(): JSX.Element {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon(): JSX.Element {
  return (
    <svg className={styles.installCopyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function InstallCommand({ command }: { command: string }): JSX.Element {
  const copy = () => {
    void navigator.clipboard.writeText(command);
  };

  return (
    <button type="button" className={styles.installCommand} onClick={copy} title="Copy install command">
      <code className={styles.installCommandText}>{command}</code>
      <CopyIcon />
    </button>
  );
}

function getBridgeStatusChipClass(status: DataBridgeEntry["status"]): string {
  return status === "available" ? styles.chipStatusAvailable : styles.chipStatusComingSoon;
}

function BridgeBadges({ bridge }: { bridge: DataBridgeEntry }): JSX.Element {
  const licenseShort = getBridgeLicenseShort(bridge);
  const licenseUrl = DATA_BRIDGE_LICENSE_URLS[bridge.license];
  const pricingLabel = getBridgePricingLabel(bridge);
  const statusLabel = getBridgeStatusLabel(bridge);

  return (
    <div className={styles.chipRow}>
      <span className={clsx(styles.chip, styles.chipMeta)}>{pricingLabel}</span>
      <Link to={licenseUrl} className={clsx(styles.chip, styles.chipMeta, styles.chipMetaLink)}>
        {licenseShort}
      </Link>
      <span className={clsx(styles.chip, styles.chipStatus, getBridgeStatusChipClass(bridge.status))}>
        {statusLabel}
      </span>
    </div>
  );
}

function BridgeFooterLinks({ bridge }: { bridge: DataBridgeEntry }): JSX.Element {
  const { pricing } = bridge;
  const links: JSX.Element[] = [];

  if (bridge.repositoryUrl) {
    links.push(
      <a key="repo" className={styles.textLink} href={bridge.repositoryUrl} target="_blank" rel="noreferrer">
        GitHub repository
      </a>,
    );
  }

  if (pricing.kind === "freemium" && pricing.providerPricingUrl) {
    links.push(
      <a
        key="pricing"
        className={styles.textLink}
        href={pricing.providerPricingUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          trackMarketingEvent("data_bridge_provider_pricing_click", {
            bridge_id: bridge.id,
            provider: bridge.providerName,
          })
        }
      >
        Provider pricing
      </a>,
    );
  }

  if (pricing.kind === "paid") {
    if (pricing.providerPricingUrl) {
      links.push(
        <a
          key="pricing"
          className={styles.textLink}
          href={pricing.providerPricingUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackMarketingEvent("data_bridge_provider_pricing_click", {
              bridge_id: bridge.id,
              provider: bridge.providerName,
            })
          }
        >
          Provider pricing
        </a>,
      );
    }
    if (pricing.affiliateUrl) {
      links.push(
        <a
          key="affiliate"
          className={styles.textLink}
          href={pricing.affiliateUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackMarketingEvent("data_bridge_affiliate_click", {
              bridge_id: bridge.id,
              provider: bridge.providerName,
            })
          }
        >
          Subscribe via Exeria
        </a>,
      );
    }
  }

  const partnerCode =
    pricing.kind === "paid" && pricing.partnerCode ? (
      <span className={styles.cardPartnerCode}>
        Partner code: <code>{pricing.partnerCode}</code>
      </span>
    ) : null;

  return (
    <div className={styles.cardFooterLinks}>
      {links}
      {partnerCode}
    </div>
  );
}

type BridgeCardProps = {
  bridge: DataBridgeEntry;
  isActive: boolean;
  isHighlighted: boolean;
  onActivate: () => void;
};

function BridgeCard({ bridge, isActive, isHighlighted, onActivate }: BridgeCardProps): JSX.Element {
  const installCommand = getBridgeInstallCommand(bridge);
  const featureItems = getBridgeFeatureItems(bridge);

  return (
    <article
      className={clsx(
        styles.bridgeCard,
        isActive && styles.bridgeCardActive,
        isHighlighted && styles.bridgeCardHighlighted,
      )}
      id={bridge.id}
      tabIndex={0}
      data-highlighted={isHighlighted || undefined}
      onMouseEnter={onActivate}
      onFocus={onActivate}
    >
      <div className={styles.cardTopRow}>
        <h3 className={styles.cardTitle}>{bridge.providerName}</h3>
        <BridgeBadges bridge={bridge} />
      </div>

      <p className={styles.cardDescription}>{bridge.description}</p>

      <div className={styles.tagSection}>
        <div className={styles.tagGroup}>
          <span className={styles.tagGroupLabel}>Coverage</span>
          <div className={styles.chipRow}>
            {bridge.dataTypes.map((type) => (
              <span key={type} className={clsx(styles.chip, styles.chipData)}>
                {type}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.tagGroup}>
          <span className={styles.tagGroupLabel}>Protocol</span>
          <div className={styles.chipRow}>
            {bridge.transport.map((mode) => (
              <span key={mode} className={clsx(styles.chip, styles.chipProtocol)}>
                {mode}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className={styles.featureDetails}>
        <summary>Key features ({featureItems.length})</summary>
        <ul className={styles.featureList}>
          {featureItems.map((item) => (
            <li key={item} className={styles.featureItem}>
              <CheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className={styles.cardFooter}>
        <div className={styles.cardFooterActions}>
          {bridge.downloadUrl ? (
            <a
              className="button button--primary button--lg"
              href={bridge.downloadUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                trackMarketingEvent("data_bridge_download_click", {
                  bridge_id: bridge.id,
                  provider: bridge.providerName,
                })
              }
            >
              Download plugin
            </a>
          ) : null}

          {bridge.docsUrl ? (
            <Link className="button button--secondary button--outline button--lg" to={bridge.docsUrl}>
              Integration guide
            </Link>
          ) : null}
        </div>

        {installCommand ? <InstallCommand command={installCommand} /> : null}

        <BridgeFooterLinks bridge={bridge} />
      </div>
    </article>
  );
}

function BridgeComparisonTable({ bridges }: { bridges: DataBridgeEntry[] }): JSX.Element {
  if (bridges.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No bridges match your search. Try a different provider, data type, or protocol.</p>
      </div>
    );
  }

  return (
    <div className={styles.compareList} role="table" aria-label="Bridge comparison">
      <div className={styles.compareHeader} role="row">
        <span role="columnheader">Provider</span>
        <span role="columnheader">Coverage</span>
        <span role="columnheader">Protocol</span>
        <span role="columnheader">License & status</span>
      </div>

      {bridges.map((bridge) => (
        <div key={bridge.id} className={styles.compareRow} role="row">
          <div className={styles.compareProviderCell} role="cell">
            <a className={styles.compareProviderLink} href={`#${bridge.id}`}>
              {bridge.providerName}
            </a>
            <p className={styles.comparePricing}>{getBridgePricingSummary(bridge)}</p>
          </div>

          <div className={styles.compareCoverageCell} role="cell">
            <p className={styles.compareCoverage}>{bridge.dataTypes.join(" · ")}</p>
          </div>

          <div className={styles.compareChipCell} role="cell">
            <div className={styles.chipRow}>
              {bridge.transport.map((mode) => (
                <span key={mode} className={clsx(styles.chip, styles.chipProtocol, styles.chipCompact)}>
                  {mode}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.compareChipCell} role="cell">
            <div className={styles.chipRow}>
              <span className={clsx(styles.chip, styles.chipMeta, styles.chipCompact)}>
                {getBridgeLicenseShort(bridge)}
              </span>
              <span
                className={clsx(
                  styles.chip,
                  styles.chipStatus,
                  styles.chipCompact,
                  getBridgeStatusChipClass(bridge.status),
                )}
              >
                {getBridgeStatusLabel(bridge)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DataBridgesPage(): JSX.Element {
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBridgeId, setActiveBridgeId] = useState(dataBridgeCatalog[0]?.id ?? "");
  const [highlightedBridgeId, setHighlightedBridgeId] = useState<string | null>(null);

  const filteredBridges = useMemo(() => {
    return dataBridgeCatalog.filter((bridge) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "free" && bridge.license === "mit") ||
        (filter === "partner" && bridge.license === "source-available-commercial");

      return matchesFilter && bridgeMatchesSearch(bridge, searchQuery);
    });
  }, [filter, searchQuery]);

  useEffect(() => {
    if (filteredBridges.length === 0) {
      return;
    }
    if (!filteredBridges.some((bridge) => bridge.id === activeBridgeId)) {
      setActiveBridgeId(filteredBridges[0].id);
    }
  }, [filteredBridges, activeBridgeId]);

  useEffect(() => {
    let highlightTimer: ReturnType<typeof setTimeout> | undefined;

    const applyHash = () => {
      const id = window.location.hash.slice(1);
      if (!id || !dataBridgeCatalog.some((bridge) => bridge.id === id)) {
        return;
      }

      setFilter("all");
      setSearchQuery("");
      setActiveBridgeId(id);
      setHighlightedBridgeId(id);

      if (highlightTimer) {
        clearTimeout(highlightTimer);
      }
      highlightTimer = setTimeout(() => setHighlightedBridgeId(null), 4000);

      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);

    return () => {
      window.removeEventListener("hashchange", applyHash);
      if (highlightTimer) {
        clearTimeout(highlightTimer);
      }
    };
  }, []);

  const activeBridge =
    filteredBridges.find((bridge) => bridge.id === activeBridgeId) ?? filteredBridges[0] ?? dataBridgeCatalog[0];

  const resultsLabel =
    filteredBridges.length === 1
      ? "1 bridge matches your filters"
      : `${filteredBridges.length} bridges match your filters`;

  return (
    <Layout
      title="Data Bridges"
      description="Free and partner Exeria Data Bridge plugins to connect market data providers to your charts instantly."
    >
      <main className={clsx(layoutStyles.page, styles.page)}>
        <section className={clsx(layoutStyles.hero, layoutStyles.heroCompact)}>
          <h1 className={layoutStyles.title}>Connect market data in minutes—not weeks.</h1>
          <p className={layoutStyles.subtitle}>
            Free MIT connectors for open data providers. Partner plugins included when you subscribe
            to premium feeds through Exeria.
          </p>
          <div className={layoutStyles.heroActions}>
            <a className="button button--primary button--lg" href="#catalog">
              Browse bridges
            </a>
            <a className="button button--secondary button--lg" href="#licensing">
              Licensing
            </a>
          </div>
        </section>

        <section id="catalog" className={styles.catalogBand}>
          <div className={styles.catalogBandInner}>
            <div className={styles.catalogIntro}>
              <h2>Bridge catalog</h2>
              <p>Compare providers, data coverage, pricing, and license terms before you integrate.</p>
            </div>

            <div className={styles.catalogExplorer}>
              <div className={styles.catalogExplorerToolbar}>
                <label className={styles.searchField}>
                  <span className={styles.searchLabel}>Search</span>
                  <input
                    type="search"
                    className={styles.searchInput}
                    placeholder="Provider, data type, or protocol"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-controls="bridge-results"
                    aria-describedby="bridge-results-status"
                  />
                </label>

                <div className={styles.toolbarDivider} aria-hidden />

                <div className={styles.toolbarFilterRow}>
                  <span className={styles.toolbarFilterLabel} id="bridge-filter-label">
                    Filter
                  </span>
                  <div className={styles.filterGroup} role="tablist" aria-labelledby="bridge-filter-label">
                    {(
                      [
                        ["all", "All bridges"],
                        ["free", "Free (MIT)"],
                        ["partner", "Partner (commercial)"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={filter === value}
                        className={clsx(
                          styles.filterButton,
                          filter === value && styles.filterButtonSelected,
                        )}
                        onClick={() => setFilter(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.catalogExplorerMeta}>
                <p id="bridge-results-status" aria-live="polite">
                  {resultsLabel}
                </p>
              </div>

              <div id="bridge-results">
                <BridgeComparisonTable bridges={filteredBridges} />

                <div className={styles.catalogGrid}>
                  {filteredBridges.map((bridge) => (
                    <BridgeCard
                      key={bridge.id}
                      bridge={bridge}
                      isActive={bridge.id === activeBridge?.id}
                      isHighlighted={bridge.id === highlightedBridgeId}
                      onActivate={() => setActiveBridgeId(bridge.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={layoutStyles.section}>
          <div className={layoutStyles.sectionHeader}>
            <h2>Typical integration flow</h2>
            <p>
              Bridges expose a small adapter surface—fetch historical bars, subscribe to live updates,
              normalize symbols—so your chart code stays provider-agnostic.
            </p>
          </div>

          <div className={styles.integrationPanel} data-testid="integration-snippet">
            <p className={styles.integrationCaption}>
              Example: <strong>{activeBridge.providerName}</strong> bridge
            </p>
            <pre>{getBridgeIntegrationSnippet(activeBridge)}</pre>
          </div>
        </section>

        <section id="licensing" className={layoutStyles.section}>
          <div className={layoutStyles.sectionHeader}>
            <h2>Licensing</h2>
            <p>
              Plugin license depends on whether the underlying data provider is free or requires a
              paid subscription obtained through Exeria.
            </p>
          </div>

          <div className={styles.licenseGrid}>
            <article className={clsx(styles.licenseCard, styles.licenseCardFeatured)} id="mit-license">
              <h3>MIT — free data providers</h3>
              <p>
                Bridges for open or freemium data APIs are released under the{" "}
                <a
                  href="https://opensource.org/license/mit"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.licenseLink}
                >
                  MIT License
                </a>
                .
              </p>
              <ul>
                <li>Use, modify, and distribute the plugin in your projects</li>
                <li>No affiliate registration required</li>
                <li>Subject only to the data provider&apos;s own API terms and rate limits</li>
              </ul>
              <a
                href="https://opensource.org/license/mit"
                target="_blank"
                rel="noreferrer"
                className={clsx("button button--secondary button--outline button--lg", styles.licenseCardAction)}
              >
                Read MIT License
              </a>
            </article>

            <article className={styles.licenseCard} id="partner-license">
              <h3>Source-available commercial — partner providers</h3>
              <p>
                Source-available and free with an eligible subscription purchased via Exeria&apos;s
                partner link or partner code.
              </p>
              <ul>
                <li>Source code is provided for integration and audit—not for endpoint swapping</li>
                <li>License is co-terminus with your data subscription</li>
                <li>Public provider pricing is guaranteed—no markup through Exeria</li>
              </ul>
              <a
                className={clsx("button button--secondary button--outline button--lg", styles.licenseCardAction)}
                href="#partner-eula"
              >
                Read full EULA
              </a>
            </article>
          </div>

          <details id="partner-eula" className={styles.eulaPanel}>
            <summary>{DATA_BRIDGE_EULA_TITLE}</summary>
            <div className={styles.eulaContent}>
              {DATA_BRIDGE_EULA_SECTIONS.map((section) => (
                <section key={section.title} className={styles.eulaSection}>
                  <h4>{section.title}</h4>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </div>
          </details>
        </section>

        <section className={clsx(layoutStyles.section, styles.ctaSection)}>
          <div className={styles.ctaPanel}>
            <h2>Need a provider we don&apos;t list yet?</h2>
            <p>Tell us which data vendor you use and we&apos;ll prioritize the next bridge.</p>
            <RequestBridgeForm />
          </div>
        </section>
      </main>
    </Layout>
  );
}
