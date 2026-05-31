import type { CoreChartModel } from "./internal-types/chart";

const model2 = {
  mainSeries: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb",
  instrumentsSeries: [
    {
      seriesId: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb",
      title: "Untitled",
      labels: ["O", "H", "L", "C", "V"],
      fields: ["o", "h", "l", "c", "v"],
      instrument: {
        id: "id",
        symbol: "symbol not set",
        name: "name not set",
        currency: "currency not set",
        precision: 6,
        chart: "ohlc",
        availableIntervals: [{ symbol: "5m" }, { symbol: "1h" }, { symbol: "1D" }],
        defaultInterval: {
          symbol: "1h",
        },
        tradable: false,
        keyWords: [],
        related: [],
      },
    },
  ],
  autoScale: true, // view model
  orders: { list: [], visible: true, selected: false }, // data model
  positions: { list: [], visible: true, selected: false }, // daata model
  interval: { symbol: "5m" }, // data model
  valueAxisWidth: 80, // configuration settings
  valueAxisPadding: 6,
  timeAxisHeight: 24, // configuration settings
  minValueTickHeight: 30, // configuration settings
  minTimeTickWidth: 108, // configuration settings
  periodWidth: 6, // view model
  viewportLeft: 0, // view model
  endMargin: 100, // configuration settings
  extremesMargin: 0.1, // configuration settings
  priceAxisVerticalPaddingPx: 8,
  minPanelHeight: 24, // configuration settings
  mode: "normal", // configuration settings
  scripts: [],
  panels: [
    {
      id: "1",
      valueAxisMode: "lin",
      main: true,
      hGrid: true,
      vGrid: true,
      basis: 75,
      backgroundColor: "#282B38",
      gridColor: "#353741",
      vMax: 1.127797,
      vMin: 1.115833,
      precision: 5,
      centerZero: false,
      // zeroLine: { color: "yellow", width: 1, dash: [3, 3] },
      objects: [
        {
          id: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb",
          type: "SeriesObject",
          dataLink: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb",
          renderAs: "OHLC",
          color: "#00bcd4",
          stroke: [1],
          dash: [],
          width: 1,
          priceTag: true,
          priceLine: true,
          openDataField: "o",
          highDataField: "h",
          lowDataField: "l",
          closeDataField: "c",
          dataField: "c",
          strokeStyle: "#00bcd4",
          _hit: false,
          _hitAnchor: null,
          _hitArrow: null,
          selected: false,
        },
      ],
      _visible: true,
      _height: 432,
      _index: 0,
      _width: 800,
      _offset: 0,
    },
  ],
  id: "1498208873150@989ae815-e237-249e-23d7-47d488777f46", // data model
} as unknown as CoreChartModel;

export default model2;
