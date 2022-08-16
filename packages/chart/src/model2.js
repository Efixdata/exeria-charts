export default {
  mainSeries: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb", // daata model
  instrumentsSeries: [ // data model
    {
      seriesId: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb",
      title: "EUR/USD",
      labels: ["O", "H", "L", "C", "V", "I"],
      fields: ["o", "h", "l", "c", "v", "i"],
      instrument: {
        id: "QS05:EUR%2FUSD",
        symbol: "EUR/USD",
        name: "EUR/USD,EURUSD",
        currency: "USD",
        precision: 4,
        chart: "ohlc",
        availableIntervals: [
          { id: 0, symbol: "5m", desc: "5 minutes", milis: 300000 },
          { id: 3, symbol: "1h", desc: "1 hour", milis: 3600000 },
          { id: 5, symbol: "1D", desc: "1 day", milis: 86400000 },
        ],
        defaultInterval: {
          id: 5,
          symbol: "1D",
          desc: "1 day",
          milis: 86400000,
        },
        tradable: false,
        keyWords: ["EUR/USD", "EURUSD"],
        brokers: [
          {
            market: "FOREX",
            name: "CITYINDEX",
            symbolId: "154290",
            symbolName: "EUR/USD",
            tradable: true,
          },
        ],
        related: [],
      },
    },
  ],
  autoScale: true, // view model
  orders: { list: [], visible: true, selected: false }, // data model
  positions: { list: [], visible: true, selected: false }, // daata model
  interval: { id: 0, symbol: "5m", desc: "5 minutes", milis: 300000 }, // data model
  valueAxisWidth: 80, // configuration settings
  timeAxisHeight: 24, // configuration settings
  minValueTickHeight: 30, // configuration settings
  minTimeTickWidth: 120, // configuration settings
  handlerColor: "#000000", // configuration settings
  font: "normal 11px Roboto, Tahoma, Arial, sans-serif", // configuration settings
  valueFont: "normal 700 11px/11px Roboto, Tahoma, Arial, sans-serif", // configuration settings
  timeFont: "normal 700 11px/11px Roboto, Tahoma, Arial, sans-serif", // configuration settings
  ordersAndPositionsFont: "10px normal Roboto, Tahoma, Arial, sans-serif", // configuration settings
  timeAxisBackground: "#282B38", // configuration settings
  valueColor: "#ffffff", // configuration settings
  timeColor: "#2196F3", // configuration settings
  gridColor: "#353741", // configuration settings
  periodWidth: 6, // view model
  viewportLeft: 4506, // view model
  endMargin: 100, // configuration settings
  extremesMargin: 0.1, // configuration settings
  minPanelHeight: 24, // configuration settings
  legendLabelColor: "#ffffff", // configuration settings
  legendLabelFont: "normal 300 11px/11px Roboto, Tahoma, Arial, sans-serif", // configuration settings
  legendValueFont: "normal 300 11px/11px Roboto, Tahoma, Arial, sans-serif", // configuration settings
  mode: "normal", // configuration settings
  scripts: [ // data model
    // {
    //   id: "1498208907822@4b74d76c-07ee-e7fd-ce56-601839eb42f7",
    //   key: "MACD",
    //   inputs: {
    //     CLOSE: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb:c",
    //     FPERIOD: 12,
    //     SPERIOD: 26,
    //     SGPERIOD: 9,
    //   },
    //   pane: "1498208907825@9c0616eb-0901-f4be-20f1-dcacd52baf28",
    //   userName: "MACD",
    //   visible: true,
    //   outputs: { MACD: "1498208907822@63ee6e94-2cb9-f431-de8a-f640c5ef7a2c" },
    //   scriptType: "indicators",
    //   reference: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb:c",
    // },
    // {
    //   id: "1498208911469@5feb1573-efdf-3276-479c-38eba0a6b41e",
    //   key: "BBAND",
    //   inputs: {
    //     CLOSE: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb:c",
    //     PERIODS: 15,
    //     DEVIATIONS: 2.5,
    //   },
    //   pane: "1",
    //   userName: "Bollinger Bands",
    //   visible: true,
    //   outputs: { BBAND: "1498208911469@ea038991-c597-05e1-1fa9-57a52dae59fc" },
    //   scriptType: "indicators",
    //   reference: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb:c",
    // },
  ],
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
      zeroLine: { color: "yellow", width: 1, dash: [3, 3] },
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
        // {
        //   type: "SeriesObject",
        //   dataLink: "1498208911469@ea038991-c597-05e1-1fa9-57a52dae59fc",
        //   renderAs: "Band",
        //   upperField: "BBUpper",
        //   lowerField: "BBLower",
        //   color: "#425166",
        //   width: 1.5,
        //   dash: [0, 0],
        //   id: "1498208911470@f81f029f-c0fb-40da-1541-539b659af2fc",
        //   reference: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb:c",
        //   hidden: false,
        //   strokeStyle: "#425166",
        //   _hit: false,
        //   _hitAnchor: null,
        //   _hitArrow: null,
        //   selected: false,
        // },
        // {
        //   type: "SeriesObject",
        //   dataLink: "1498208911469@ea038991-c597-05e1-1fa9-57a52dae59fc",
        //   renderAs: "Line",
        //   dataField: "BBMiddle",
        //   color: "#425166",
        //   width: 1,
        //   dash: [0, 0],
        //   priceTag: false,
        //   priceLine: false,
        //   id: "1498208911470@0a3a0280-3f83-410c-25eb-0b9435036457",
        //   reference: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb:c",
        //   hidden: false,
        //   strokeStyle: "#425166",
        //   _hit: false,
        //   _hitAnchor: null,
        //   _hitArrow: null,
        //   selected: false,
        // },
        // {
        //   id: "1498208920341@2930f848-c034-8b0c-c8bb-35b9076b10ce",
        //   type: "trendLine",
        //   name: "trend",
        //   color: "#ff9800",
        //   width: 1,
        //   dash: [],
        //   canBeIndicator: true,
        //   isIndicator: false,
        //   anchors: [
        //     {
        //       stamp: 1498208700000,
        //       offset: 2676000000,
        //       value: 1.1253400000000002,
        //       _index: 826,
        //       expandable: true,
        //       expanded: false,
        //       defaultDirection: "left",
        //     },
        //     {
        //       stamp: 1498208700000,
        //       offset: -900000,
        //       value: 1.1206400000000003,
        //       _index: 858,
        //       expandable: true,
        //       expanded: false,
        //       defaultDirection: "right",
        //     },
        //   ],
        //   selected: false,
        //   _hit: false,
        //   _hitAnchor: null,
        //   _hitArrow: null,
        // },
        // {
        //   id: "1498208939638@bed0c8be-bc30-3148-ce7e-04af2ef65b20",
        //   type: "trendLine",
        //   name: "trend",
        //   color: "#FFEB3B",
        //   width: 1,
        //   dash: [],
        //   canBeIndicator: true,
        //   isIndicator: false,
        //   anchors: [
        //     {
        //       stamp: 1498208700000,
        //       offset: 2685000000,
        //       value: 1.12699,
        //       _index: 796,
        //       expandable: true,
        //       expanded: false,
        //       defaultDirection: "left",
        //     },
        //     {
        //       stamp: 1498208700000,
        //       offset: 2669700000,
        //       value: 1.1253199999999999,
        //       _index: 847,
        //       expandable: true,
        //       expanded: false,
        //       defaultDirection: "right",
        //     },
        //   ],
        //   selected: false,
        //   _hit: false,
        //   _hitAnchor: null,
        //   _hitArrow: null,
        // },
      ],
      _visible: true,
      _height: 432,
      _index: 0,
      _width: 800,
      _offset: 0,
    },
    // {
    //   valueAxisMode: "lin",
    //   hGrid: true,
    //   vGrid: true,
    //   basis: 25,
    //   backgroundColor: "#282B38",
    //   gridColor: "#353741",
    //   vMax: 0.0013290427539957906,
    //   vMin: -0.0013290427539957906,
    //   precision: 4,
    //   centerZero: true,
    //   zeroLine: { color: "yellow", width: 1, dash: [3, 3] },
    //   objects: [
    //     {
    //       type: "SeriesObject",
    //       dataLink: "1498208907822@63ee6e94-2cb9-f431-de8a-f640c5ef7a2c",
    //       renderAs: "Line and Histogram",
    //       dataField: "MACDHistogram",
    //       color: "#ff9800",
    //       width: 1,
    //       dash: [],
    //       priceTag: false,
    //       priceLine: false,
    //       id: "1498208907825@7d298570-3659-f817-090c-2f82450505e3",
    //       reference: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb:c",
    //       hidden: false,
    //       strokeStyle: "#ff9800",
    //       selected: false,
    //       _hit: false,
    //       _hitAnchor: null,
    //       _hitArrow: null,
    //     },
    //     {
    //       type: "SeriesObject",
    //       dataLink: "1498208907822@63ee6e94-2cb9-f431-de8a-f640c5ef7a2c",
    //       renderAs: "Line",
    //       dataField: "MACDSignal",
    //       color: "#f44336",
    //       width: 1,
    //       dash: [],
    //       priceTag: false,
    //       priceLine: false,
    //       id: "1498208907825@f291b608-8dfd-8732-b808-9a55a6b80a75",
    //       reference: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb:c",
    //       hidden: false,
    //       strokeStyle: "#f44336",
    //       selected: false,
    //       _hit: false,
    //       _hitAnchor: null,
    //       _hitArrow: null,
    //     },
    //     {
    //       type: "SeriesObject",
    //       dataLink: "1498208907822@63ee6e94-2cb9-f431-de8a-f640c5ef7a2c",
    //       renderAs: "Line",
    //       dataField: "MACDLine",
    //       color: "#00bcd4",
    //       width: 1.5,
    //       dash: [],
    //       priceTag: true,
    //       priceLine: true,
    //       id: "1498208907825@37c0c9f3-1855-81f9-bba1-d16bf04dd833",
    //       reference: "1498208873173@38826f3a-3399-8cca-52f2-710fd3cf14cb:c",
    //       hidden: false,
    //       strokeStyle: "#00bcd4",
    //       selected: false,
    //       _hit: false,
    //       _hitAnchor: null,
    //       _hitArrow: null,
    //     },
    //   ],
    //   id: "1498208907825@9c0616eb-0901-f4be-20f1-dcacd52baf28",
    //   _visible: true,
    //   _height: 144,
    //   _index: 1,
    //   _width: 800,
    //   _offset: 432,
    // },
  ],
  id: "1498208873150@989ae815-e237-249e-23d7-47d488777f46", // data model
  _width: 800, // view model
  _height: 600, // view model
  _timeAxisWidth: 720, // view model
  _leftIndex: 751, // view model
  _rightIndex: 871, // view model
  _midOffset: 3, // view model
};
