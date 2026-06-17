import Link from "@docusaurus/Link";
import styles from "./marketNewsApp.module.css";

export default function DemoBanner() {
  return (
    <div className={styles.demoBanner}>
      <div className={styles.demoBannerInner}>
        <span>
          <strong>Exeria demo</strong> · Interactive Market News — embeddable charts inside a
          financial article
        </span>
        <div className={styles.demoBannerActions}>
          <Link to="/starters/market-news#market-news-developer">View starter code</Link>
          <Link to="/starters/market-news">Case study</Link>
        </div>
      </div>
    </div>
  );
}
