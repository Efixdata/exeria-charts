# Exeria Charts React UI

React wrapper components for Exeria Charts.

Use this package when you want the prebuilt toolbar and menu controls on top of an existing chart runtime instance.

## Installation

```bash
npm install @efixdata/exeria-chart @efixdata/exeria-chart-ui-react
```

## Usage

```tsx
import { useLayoutEffect, useRef, useState } from "react";
import Chart, { type ChartInstance, type Candle } from "@efixdata/exeria-chart";
import { ChartUI } from "@efixdata/exeria-chart-ui-react";

const candles: Candle[] = [
  {
    stamp: 1715472000000,
    o: 1.1,
    h: 1.2,
    l: 1.05,
    c: 1.18,
    v: 2500,
  },
];

export function ChartExample() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const instance = new Chart({ container });

    instance.init();
    void instance.setMainSeriesData(candles);
    setChart(instance);

    return () => {
      instance.destroy();
      setChart(null);
    };
  }, []);

  return (
    <div>
      <div ref={containerRef} style={{ height: 480 }} />
      {chart ? <ChartUI chart={chart} /> : null}
    </div>
  );
}
```

## When to Use This Package

Use the React wrapper when:

- you are already mounting the chart runtime inside React
- you want the built-in top toolbar and left-menu controls
- you prefer to start with an existing UI layer rather than building all chart controls from scratch

Start with `@efixdata/exeria-chart` alone if you want the smallest possible integration surface first.

## Notes

- `ChartUI` expects a live chart instance created from `@efixdata/exeria-chart`.
- You are responsible for creating and destroying the runtime chart instance.
- The broader documentation site and onboarding flow live in `apps/docs` in the repository.

## License

This package is source-available under the Exeria Charts Source Available License 1.0.
Personal use, education, qualifying open source projects, and qualifying small-scale use are
allowed under the Additional Use Grant. Other commercial use requires a separate commercial
license from Efix Data Sp. z o. o. See the bundled `LICENSE` file and the repository
`LICENSING.md` for the full legal terms and usage summary.