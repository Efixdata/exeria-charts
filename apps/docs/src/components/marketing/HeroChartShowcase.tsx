import type { CSSProperties } from "react";
import {
  HERO_CHART_SHOWCASE_BEAT_MS,
  heroChartShowcaseSlides,
} from "./heroChartShowcaseSlides";
import styles from "./heroChartShowcase.module.css";

export default function HeroChartShowcase(): JSX.Element {
  return (
    <div
      className={styles.showcase}
      role="img"
      aria-label="Chart examples from simple candlesticks to quant analytics"
      style={
        {
          "--beat": `${HERO_CHART_SHOWCASE_BEAT_MS}ms`,
        } as CSSProperties
      }
    >
      {heroChartShowcaseSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={styles.slide}
          style={{ "--index": index } as CSSProperties}
          aria-hidden={index !== 0}
        >
          <img
            className={slide.cropTop ? styles.imageCropped : styles.image}
            src={slide.src}
            alt={slide.alt}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
