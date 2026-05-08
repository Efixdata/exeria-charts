Example:

```js
import Chart from "path-to-chart.js";

const chart = new Chart({
  container: DOMElement,
});

// Should be called when changing an instrument on the chart and before chart.init
chart.setMainSeriesData([
  {
    stamp: 1374796800000,
    o: 1.32729, // open
    h: 1.32963, // high
    l: 1.32519, // low
    c: 1.32771, // close
    v: 0, // volume
  },
  {
    stamp: 1375056000000,
    o: 1.32848,
    h: 1.32947,
    l: 1.32395,
    c: 1.32624,
    v: 0,
  },
]);

// Should be called only once
chart.init();
```

Appending candles to the main series

```js
chart.appendMainSeriesData([
  {
    stamp: 1374796800000,
    o: 1.32729, // open
    h: 1.32963, // high
    l: 1.32519, // low
    c: 1.32771, // close
    v: 0, // volume
  },
  {
    stamp: 1375056000000,
    o: 1.32848,
    h: 1.32947,
    l: 1.32395,
    c: 1.32624,
    v: 0,
  },
]);
```

Appending a tick to main series. The tick will be added to the current or next candle based on the stamp value.

```js
chart.appendTick({
  stamp: 1375056000000,
  price: 1.32849,
  volume: 1000,
  dailyVolume: 101938, // not needed - will set the volume value if the interval is set to 1 day
});
```
