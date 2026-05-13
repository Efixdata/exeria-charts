# Exeria Charts React UI

React wrapper components for Exeria Charts.

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

## Status

This package is intended to sit on top of the public chart API exported by `@efixdata/exeria-chart`.
The broader public-release work for documentation, examples, and package hardening is tracked in the repository release plan.

## License

This package is source-available under the Exeria Charts Source Available License 1.0.
Personal use, education, qualifying open source projects, and qualifying small-scale use are
allowed under the Additional Use Grant. Other commercial use requires a separate commercial
license from Efix Data Sp. z o. o. See the bundled `LICENSE` file for the full legal terms.