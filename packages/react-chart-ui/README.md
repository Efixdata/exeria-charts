# React Chart UI

React wrapper components for the Dexer chart runtime.

## Installation

```bash
npm install @dexer-io/chart @dexer-io/react-chart-ui
```

## Usage

```tsx
import { useLayoutEffect, useRef, useState } from "react";
import Chart, { type ChartInstance, type Candle } from "@dexer-io/chart";
import { ChartUI } from "@dexer-io/react-chart-ui";

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

This package is intended to sit on top of the public chart API exported by `@dexer-io/chart`.
The broader public-release work for documentation, examples, and package hardening is tracked in the repository release plan.