const instrumentsSeries = [
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
        {
          id: 0,
          symbol: "5m",
          desc: "5 minutes",
          milis: 300000,
        },
        {
          id: 1,
          symbol: "15m",
          desc: "15 minutes",
          milis: 900000,
        },
        {
          id: 2,
          symbol: "30m",
          desc: "30 minutes",
          milis: 1800000,
        },
        {
          id: 3,
          symbol: "1h",
          desc: "1 hour",
          milis: 3600000,
        },
        {
          id: 4,
          symbol: "4h",
          desc: "4 hour",
          milis: 14400000,
        },
        {
          id: 5,
          symbol: "1D",
          desc: "1 day",
          milis: 86400000,
        },
        {
          id: 7,
          symbol: "1W",
          desc: "1 week",
          milis: 604800000,
        },
        {
          id: 8,
          symbol: "1M",
          desc: "1 month",
          milis: -1,
        },
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
    interval: {
      id: 5,
      symbol: "1D",
      desc: "1 day",
      milis: 86400000,
    },
  },
];

export default instrumentsSeries;
