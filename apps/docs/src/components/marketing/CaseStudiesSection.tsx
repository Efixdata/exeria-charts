import layoutStyles from "@site/src/css/marketingLayout.module.css";
import { starterProjects } from "@site/src/data/starterProjects";
import styles from "@site/src/pages/index.module.css";

const caseStudies = starterProjects.map((project) => ({
  id: project.id,
  title: `${project.caseStudy?.title ?? project.title}.`,
  body: project.caseStudy?.body ?? project.body,
  image: project.caseStudy?.image ?? project.previewImage?.src ?? project.image,
  imageAlt: project.caseStudy?.imageAlt ?? project.previewImage?.alt ?? project.imageAlt,
  href: project.demoPath,
}));

type Props = {
  id?: string;
};

export default function CaseStudiesSection({ id = "case-studies" }: Props): JSX.Element {
  return (
    <section id={id} className={styles.caseStudiesSection}>
      <div className={layoutStyles.sectionHeader}>
        <h2>Engineered for every use case.</h2>
      </div>

      <div className={styles.caseGrid}>
        {caseStudies.map((item) => (
          <article key={item.id} className={styles.caseCard}>
            <div className={styles.caseVisual}>
              <img
                className={styles.caseImage}
                src={item.image}
                alt={item.imageAlt}
                loading="lazy"
              />
            </div>
            <div className={styles.caseContent}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <a className={styles.caseLink} href={item.href}>
                View Implementation <span aria-hidden>→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
