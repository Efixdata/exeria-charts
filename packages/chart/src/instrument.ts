import type { Instrument, Interval } from "./types";

interface BrokerInstrument {
  market: string;
  name: string;
  symbolId: string;
  symbolName: string;
  tradable: boolean;
}

interface DemoInstrument extends Instrument {
  defaultInterval: Interval;
  tradable: boolean;
  keyWords: string[];
  brokers: BrokerInstrument[];
  related: unknown[];
}

const instrument: DemoInstrument = {
  id: "QS05:EUR%2FCAD",
  symbol: "EUR/CAD",
  name: "EUR/CAD,EURCAD",
  currency: "CAD",
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
      id: 3,
      symbol: "1h",
      desc: "1 hour",
      milis: 3600000,
    },
    {
      id: 5,
      symbol: "1D",
      desc: "1 day",
      milis: 86400000,
    },
  ],
  defaultInterval: {
    id: 5,
    symbol: "1D",
    desc: "1 day",
    milis: 86400000,
  },
  tradable: false,
  keyWords: ["EUR/CAD", "EURCAD"],
  brokers: [
    {
      market: "FOREX",
      name: "CITYINDEX",
      symbolId: "99524",
      symbolName: "EUR/CAD",
      tradable: true,
    },
  ],
  related: [],
};

export default instrument;
