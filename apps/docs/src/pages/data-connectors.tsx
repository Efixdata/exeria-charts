import { useEffect, useMemo, useState } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import clsx from "clsx";
import RequestConnectorForm from "@site/src/components/RequestConnectorForm";
import {
  DATA_CONNECTOR_LICENSE_URLS,
  connectorMatchesSearch,
  dataConnectorCatalog,
  getConnectorFeatureItems,
  getConnectorInstallCommand,
  getConnectorIntegrationSnippet,
  getConnectorLicenseShort,
  getConnectorPricingLabel,
  getConnectorPricingSummary,
  getConnectorStatusLabel,
  type DataConnectorEntry,
} from "@site/src/data/dataConnectorsCatalog";
import layoutStyles from "@site/src/css/marketingLayout.module.css";
import { trackMarketingEvent } from "@site/src/utils/marketingAnalytics";
import styles from "./data-connectors.module.css";

type CatalogFilter = "all" | "free";

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
      <span className={styles.installCommandText}>{command}</span>
      <CopyIcon />
    </button>
  );
}

function getConnectorStatusChipClass(status: DataConnectorEntry["status"]): string {
  return status === "available" ? styles.chipStatusAvailable : styles.chipStatusComingSoon;
}

function ConnectorBadges({ connector }: { connector: DataConnectorEntry }): JSX.Element {
  const licenseShort = getConnectorLicenseShort(connector);
  const licenseUrl = DATA_CONNECTOR_LICENSE_URLS[connector.license];
  const pricingLabel = getConnectorPricingLabel(connector);
  const statusLabel = getConnectorStatusLabel(connector);

  return (
    <div className={styles.chipRow}>
      <span className={clsx(styles.chip, styles.chipMeta)}>{pricingLabel}</span>
      <Link to={licenseUrl} className={clsx(styles.chip, styles.chipMeta, styles.chipMetaLink)}>
        {licenseShort}
      </Link>
      <span className={clsx(styles.chip, styles.chipStatus, getConnectorStatusChipClass(connector.status))}>
        {statusLabel}
      </span>
    </div>
  );
}

function ConnectorFooterLinks({ connector }: { connector: DataConnectorEntry }): JSX.Element {
  const { pricing } = connector;
  const links: JSX.Element[] = [];

  if (connector.repositoryUrl) {
    links.push(
      <a key="repo" className={styles.textLink} href={connector.repositoryUrl} target="_blank" rel="noreferrer">
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
          trackMarketingEvent("data_connector_provider_pricing_click", {
            connector_id: connector.id,
            provider: connector.providerName,
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
            trackMarketingEvent("data_connector_provider_pricing_click", {
              connector_id: connector.id,
              provider: connector.providerName,
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
            trackMarketingEvent("data_connector_affiliate_click", {
              connector_id: connector.id,
              provider: connector.providerName,
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

type ConnectorCardProps = {
  connector: DataConnectorEntry;
  isActive: boolean;
  isHighlighted: boolean;
  onActivate: () => void;
};

function ConnectorCard({ connector, isActive, isHighlighted, onActivate }: ConnectorCardProps): JSX.Element {
  const installCommand = getConnectorInstallCommand(connector);
  const featureItems = getConnectorFeatureItems(connector);

  return (
    <article
      className={clsx(
        styles.connectorCard,
        isActive && styles.connectorCardActive,
        isHighlighted && styles.connectorCardHighlighted,
      )}
      id={connector.id}
      tabIndex={0}
      data-highlighted={isHighlighted || undefined}
      onMouseEnter={onActivate}
      onFocus={onActivate}
    >
      <div className={styles.cardTopRow}>
        <h3 className={styles.cardTitle}>{connector.providerName}</h3>
        <ConnectorBadges connector={connector} />
      </div>

      <p className={styles.cardDescription}>{connector.description}</p>

      <div className={styles.tagSection}>
        <div className={styles.tagGroup}>
          <span className={styles.tagGroupLabel}>Coverage</span>
          <div className={styles.chipRow}>
            {connector.dataTypes.map((type) => (
              <span key={type} className={clsx(styles.chip, styles.chipData)}>
                {type}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.tagGroup}>
          <span className={styles.tagGroupLabel}>Protocol</span>
          <div className={styles.chipRow}>
            {connector.transport.map((mode) => (
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
          {connector.downloadUrl ? (
            <a
              className="button button--primary button--lg"
              href={connector.downloadUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                trackMarketingEvent("data_connector_download_click", {
                  connector_id: connector.id,
                  provider: connector.providerName,
                })
              }
            >
              Download connector
            </a>
          ) : null}

          {connector.docsUrl ? (
            <Link className="button button--secondary button--outline button--lg" to={connector.docsUrl}>
              Integration guide
            </Link>
          ) : null}
        </div>

        {installCommand ? <InstallCommand command={installCommand} /> : null}

        <ConnectorFooterLinks connector={connector} />
      </div>
    </article>
  );
}

function ConnectorComparisonTable({ connectors }: { connectors: DataConnectorEntry[] }): JSX.Element {
  if (connectors.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No connectors match your search. Try a different provider, data type, or protocol.</p>
      </div>
    );
  }

  return (
    <div className={styles.compareList} role="table" aria-label="Connector comparison">
      <div className={styles.compareHeader} role="row">
        <span role="columnheader">Provider</span>
        <span role="columnheader">Coverage</span>
        <span role="columnheader">Protocol</span>
        <span role="columnheader">License & status</span>
      </div>

      {connectors.map((connector) => (
        <div key={connector.id} className={styles.compareRow} role="row">
          <div className={styles.compareProviderCell} role="cell">
            <a className={styles.compareProviderLink} href={`#${connector.id}`}>
              {connector.providerName}
            </a>
            <p className={styles.comparePricing}>{getConnectorPricingSummary(connector)}</p>
          </div>

          <div className={styles.compareCoverageCell} role="cell">
            <p className={styles.compareCoverage}>{connector.dataTypes.join(" · ")}</p>
          </div>

          <div className={styles.compareChipCell} role="cell">
            <div className={styles.chipRow}>
              {connector.transport.map((mode) => (
                <span key={mode} className={clsx(styles.chip, styles.chipProtocol, styles.chipCompact)}>
                  {mode}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.compareChipCell} role="cell">
            <div className={styles.chipRow}>
              <span className={clsx(styles.chip, styles.chipMeta, styles.chipCompact)}>
                {getConnectorLicenseShort(connector)}
              </span>
              <span
                className={clsx(
                  styles.chip,
                  styles.chipStatus,
                  styles.chipCompact,
                  getConnectorStatusChipClass(connector.status),
                )}
              >
                {getConnectorStatusLabel(connector)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DataConnectorsPage(): JSX.Element {
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConnectorId, setActiveConnectorId] = useState(dataConnectorCatalog[0]?.id ?? "");
  const [highlightedConnectorId, setHighlightedConnectorId] = useState<string | null>(null);

  const filteredConnectors = useMemo(() => {
    return dataConnectorCatalog.filter((connector) => {
      const matchesFilter =
        filter === "all" || (filter === "free" && connector.license === "mit");

      return matchesFilter && connectorMatchesSearch(connector, searchQuery);
    });
  }, [filter, searchQuery]);

  useEffect(() => {
    if (filteredConnectors.length === 0) {
      return;
    }
    if (!filteredConnectors.some((connector) => connector.id === activeConnectorId)) {
      setActiveConnectorId(filteredConnectors[0].id);
    }
  }, [filteredConnectors, activeConnectorId]);

  useEffect(() => {
    let highlightTimer: ReturnType<typeof setTimeout> | undefined;

    const applyHash = () => {
      const id = window.location.hash.slice(1);
      if (!id || !dataConnectorCatalog.some((connector) => connector.id === id)) {
        return;
      }

      setFilter("all");
      setSearchQuery("");
      setActiveConnectorId(id);
      setHighlightedConnectorId(id);

      if (highlightTimer) {
        clearTimeout(highlightTimer);
      }
      highlightTimer = setTimeout(() => setHighlightedConnectorId(null), 4000);

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

  const activeConnector =
    filteredConnectors.find((connector) => connector.id === activeConnectorId) ??
    filteredConnectors[0] ??
    dataConnectorCatalog[0];

  const resultsLabel =
    filteredConnectors.length === 1
      ? "1 connector matches your filters"
      : `${filteredConnectors.length} connectors match your filters`;

  return (
    <Layout
      title="Data Connectors"
      description="Free MIT Exeria Data Connectors to connect market data providers to your charts instantly."
    >
      <main className={clsx(layoutStyles.page, styles.page)}>
        <section className={clsx(layoutStyles.hero, layoutStyles.heroCompact)}>
          <h1 className={layoutStyles.title}>Connect market data in minutes—not weeks.</h1>
          <p className={layoutStyles.subtitle}>
            Free MIT connectors for public and freemium market data providers. API keys stay on your
            server — never in the chart bundle.
          </p>
          <div className={layoutStyles.heroActions}>
            <a className="button button--primary button--lg" href="#catalog">
              Browse connectors
            </a>
            <a className="button button--secondary button--lg" href="#licensing">
              Licensing
            </a>
          </div>
        </section>

        <section id="catalog" className={styles.catalogBand}>
          <div className={styles.catalogBandInner}>
            <div className={styles.catalogIntro}>
              <h2>Connector catalog</h2>
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
                    aria-controls="connector-results"
                    aria-describedby="connector-results-status"
                  />
                </label>

                <div className={styles.toolbarDivider} aria-hidden />

                <div className={styles.toolbarFilterRow}>
                  <span className={styles.toolbarFilterLabel} id="connector-filter-label">
                    Filter
                  </span>
                  <div className={styles.filterGroup} role="tablist" aria-labelledby="connector-filter-label">
                    {(
                      [
                        ["all", "All connectors"],
                        ["free", "Free (MIT)"],
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
                <p id="connector-results-status" aria-live="polite">
                  {resultsLabel}
                </p>
              </div>

              <div id="connector-results">
                <ConnectorComparisonTable connectors={filteredConnectors} />

                <div className={styles.catalogGrid}>
                  {filteredConnectors.map((connector) => (
                    <ConnectorCard
                      key={connector.id}
                      connector={connector}
                      isActive={connector.id === activeConnector?.id}
                      isHighlighted={connector.id === highlightedConnectorId}
                      onActivate={() => setActiveConnectorId(connector.id)}
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
              Data Connectors expose a small surface—fetch historical bars, subscribe to live updates,
              normalize symbols—so your chart code stays provider-agnostic.
            </p>
          </div>

          <div className={styles.integrationPanel} data-testid="integration-snippet">
            <p className={styles.integrationCaption}>
              Example: <strong>{activeConnector.providerName}</strong> connector
            </p>
            <pre>{getConnectorIntegrationSnippet(activeConnector)}</pre>
          </div>
        </section>

        <section id="licensing" className={layoutStyles.section}>
          <div className={layoutStyles.sectionHeader}>
            <h2>Licensing</h2>
            <p>
              Connector license depends on whether the underlying data provider is free or requires a
              paid subscription obtained through Exeria.
            </p>
          </div>

          <div className={styles.licenseGrid}>
            <article className={clsx(styles.licenseCard, styles.licenseCardFeatured)} id="mit-license">
              <h3>MIT — free data providers</h3>
              <p>
                Connectors for open or freemium data APIs are released under the{" "}
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
                <li>Use, modify, and distribute the connector in your projects</li>
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

          </div>
        </section>

        <section className={clsx(layoutStyles.section, styles.ctaSection)}>
          <div className={styles.ctaPanel}>
            <h2>Need a provider we don&apos;t list yet?</h2>
            <p>Tell us which data vendor you use and we&apos;ll prioritize the next connector.</p>
            <RequestConnectorForm />
          </div>
        </section>
      </main>
    </Layout>
  );
}
