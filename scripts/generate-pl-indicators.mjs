import fs from 'node:fs';
import path from 'node:path';

function extractKeys(dir) {
  const keys = new Set();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const m of content.matchAll(/(?:title|description|name):\s*"([^"]+)"/g)) keys.add(m[1]);
    for (const m of content.matchAll(/labels:\s*\[([^\]]+)\]/g)) {
      for (const l of m[1].matchAll(/"([^"]+)"/g)) keys.add(l[1]);
    }
  }
  return keys;
}

const ind = extractKeys('packages/chart/src/fusion-scripts/indicators');
const fn = extractKeys('packages/chart/src/fusion-scripts/functions');
const strat = extractKeys('packages/chart/src/fusion-scripts/strategies');
const exclude = new Set([...fn, ...strat].filter((k) => !ind.has(k)));

const enContent = fs.readFileSync('packages/chart/src/locale/en-US.ts', 'utf8');
const locale = {};
for (const line of enContent.split('\n')) {
  const m = line.match(/^\s+([a-zA-Z0-9_]+):\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/);
  if (m) locale[m[1]] = m[2].replace(/\\"/g, '"');
}

const finalKeys = [...ind].filter((k) => locale[k] !== undefined && !exclude.has(k)).sort();

function translateDescription(en) {
  const map = [
    [/Moving Average/g, 'Średnia krocząca'],
    [/Simple Moving Average/g, 'Prosta średnia krocząca'],
    [/Exponential Moving Average/g, 'Wykładnicza średnia krocząca'],
    [/Weighted Moving Average/g, 'Ważona średnia krocząca'],
    [/Hull Moving Average/g, 'Średnia krocząca Hull'],
    [/Displaced Moving Average/g, 'Przesunięta średnia krocząca'],
    [/Modified Moving Average/g, 'Zmodyfikowana średnia krocząca'],
    [/Average True Range/g, 'Średni prawdziwy zasięg'],
    [/Average Directional Index/g, 'Wskaźnik średniego kierunku'],
    [/Relative Strength Index/g, 'Wskaźnik siły względnej'],
    [/Rate Of Change/g, 'Tempo zmian'],
    [/Open Interest/g, 'Otwarte zainteresowanie'],
    [/On Balance Volume/g, 'Wolumen z saldem'],
    [/Accumulation Distribution/g, 'Akumulacja/dystrybucja'],
    [/Commodity Channel Index/g, 'Indeks kanału towarowego'],
    [/Parabolic SAR/g, 'Paraboliczny SAR'],
    [/Stochastic Oscillator/g, 'Oscylator stochastyczny'],
    [/Stochastic Momentum Index/g, 'Stochastyczny indeks momentum'],
    [/Ultimate Oscillator/g, 'Oscylator ultimate'],
    [/Bollinger Bands/g, 'Wstęgi Bollingera'],
    [/Bollinger Band/g, 'Wstęga Bollingera'],
    [/Chandelier Exit/g, 'Wyjście Chandelier'],
    [/Chaikin's Volatility/gi, 'Zmienność Chaikina'],
    [/Directional Movement/g, 'Ruch kierunkowy'],
    [/Price Trend/g, 'Trend cenowy'],
    [/Horizontal Line/g, 'Linia pozioma'],
    [/Horizontal price levels/g, 'Poziome poziomy cen'],
    [/Trading Time Frame/g, 'Ramka czasowa handlu'],
    [/Equity line/g, 'Linia kapitału'],
    [/Equity summary line/g, 'Linia podsumowania kapitału'],
    [/Volume/g, 'Wolumen'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Koperta'],
    [/Forecast/g, 'Prognoza'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrendowany oscylator cenowy'],
    [/Donchian Channel/g, 'Kanał Donchiana'],
    [/Keltner Channel/g, 'Kanał Keltnera'],
    [/Standard Deviation/g, 'Odchylenie standardowe'],
    [/Correlation Coefficient/g, 'Współczynnik korelacji'],
    [/Sharpe Ratio/g, "Współczynnik Sharpe'a"],
    [/Information Ratio/g, 'Współczynnik informacji'],
    [/Force Index/g, 'Indeks force'],
    [/Ease Of Movement/g, 'Łatwość ruchu'],
    [/Ease of Movement/g, 'Łatwość ruchu'],
    [/Mass Index/g, 'Indeks Mass'],
    [/Choppiness Index/g, 'Indeks choppiness'],
    [/Historical Volatility/g, 'Historyczna zmienność'],
    [/Net Volume/g, 'Wolumen netto'],
    [/Accumulation/g, 'Akumulacja'],
    [/Pivot Point/g, 'Punkt pivot'],
    [/Price Levels/g, 'Poziomy cen'],
    [/Williams Fractals/g, 'Fraktale Williamsa'],
    [/Williams Percent Range/g, 'Procentowy zasięg Williamsa'],
    [/Williams Alligator/g, 'Alligator Williamsa'],
    [/Awesome Oscillator/g, 'Oscylator Awesome'],
    [/Fisher Transform/g, 'Transformata Fishera'],
    [/Vortex Indicator/g, 'Wskaźnik Vortex'],
    [/Balance Of Power/g, 'Balans siły'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Krzywa Coppocka'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'Sumuje wartości wskaźnika'],
    [/Measures distance between signals in strategy/g, 'Mierzy odległość między sygnałami'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      'Statystyczny tygodniowy model decyzyjny dla eksportera — dane godzinowe',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      'Statystyczny tygodniowy model decyzyjny dla importera — dane godzinowe',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      'Statystyczny miesięczny model decyzyjny dla eksportera — dane godzinowe',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      'Statystyczny miesięczny model decyzyjny dla importera — dane godzinowe',
    ],
  ];
  let out = en;
  for (const [re, rep] of map) out = out.replace(re, rep);
  return out;
}

const titleMap = {
  macdTitle: 'MACD',
  rsiTitle: 'RSI',
  emaTitle: 'EMA',
  smaTitle: 'SMA',
  atrTitle: 'ATR',
  adxTitle: 'ADX',
  bbandTitle: 'Wstęgi Bollingera',
  volumeTitle: 'VOLUME',
  obvTitle: 'OBV',
  cciTitle: 'CCI',
  wmaTitle: 'WMA',
  hmaTitle: 'HMA',
  mmaTitle: 'MMA',
  dmaTitle: 'DMA',
  dpoTitle: 'DPO',
  rocTitle: 'ROC',
  smiTitle: 'SMI',
  openintTitle: 'OPENINT',
  parsarTitle: 'PARSAR',
  chaikinTitle: 'CHAIKIN',
  dirmovTitle: 'DIRMOV',
  cexTitle: 'CEX',
  hlineTitle: 'HLINE',
  minusdiTitle: 'Minus DI',
  plusdiTitle: 'Plus DI',
  trendTitle: 'Trend cenowy',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'Ramka czasowa',
  forwardTitle: 'Forward',
  forecastTitle: 'Prognoza',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'Akumulacja',
  priceLevelsTitle: 'Poziomy cen',
  signalDistanceTitle: 'Odległość sygnałów',
  stochasticOscillatorTitle: 'Oscylator stochastyczny',
  ultimateOscillatorTitle: 'Oscylator ultimate',
  envelopeTitle: 'Koperta',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Oscylator Awesome',
  balanceOfPowerTitle: 'Balans siły',
  bbandsPercentTitle: '% wstęg Bollingera',
  bbandsWidthTitle: 'Szerokość wstęg Bollingera',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Oscylator momentum Chande',
  chaikinOscillatorTitle: 'Oscylator Chaikina',
  choppinessIndexTitle: 'Indeks choppiness',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Krzywa Coppocka',
  correlationCoefficientTitle: 'Współczynnik korelacji',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'Oscylator detrend DiNapoli',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'Predyktor MACD DiNapoli',
  diNapoliOscillatorPredictorTitle: 'Predyktor oscylatora DiNapoli',
  diNapoliPreferredStochasticTitle: 'Preferowany stochastyk DiNapoli',
  donchianChannelTitle: 'Kanał Donchiana',
  doubleEmaTitle: 'Podwójna EMA',
  easeOfMovementTitle: 'Łatwość ruchu',
  eldersForceIndexTitle: 'Indeks force Eldera',
  fisherTransformTitle: 'Transformata Fishera',
  forceIndexTitle: 'Indeks force',
  historicalVolatilityTitle: 'Historyczna zmienność',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Współczynnik informacji',
  keltnerChannelIndicatorTitle: 'Kanał Keltnera',
  massIndexTitle: 'Indeks Mass',
  netVolumeTitle: 'Wolumen netto',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'Punkt pivot',
  pivotPointHLTitle: 'Punkt pivot HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: "Współczynnik Sharpe'a",
  standardDeviationTitle: 'Odchylenie standardowe',
  tripleExponentialAverageTitle: 'Potrójna średnia wykładnicza',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Oscylator wolumenu',
  volumeRateOfChangeTitle: 'Tempo zmian wolumenu',
  vortexIndicatorTitle: 'Wskaźnik Vortex',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Alligator Williamsa',
  williamsFractalsTitle: 'Fraktale Williamsa',
  williamsPercentRangeTitle: '%R Williamsa',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'Podsumowanie equity',
  decisionLongBuyTitle: 'Decyzje kupna — miesięczne',
  decisionLongSellTitle: 'Decyzje sprzedaży — miesięczne',
  decisionShortBuyTitle: 'Decyzje kupna — tygodniowe',
  decisionShortSellTitle: 'Decyzje sprzedaży — tygodniowe',
};

const descriptionMap = {
  aroonDescription: 'Aroon góra/dół',
  balanceOfPowerDescription: 'Balans siły',
  bbandDescription: 'Wskaźnik zmienności autorstwa Johna Bollingera',
  chaikinOscillatorDescription: 'Oscylator Chaikina',
  chandeKrollStopDescription: 'Stop Chande Kroll',
  chandeMomentumOscillatorDescription: 'Oscylator momentum Chande',
  cmfDescription: 'Przepływ pieniędzy Chaikina',
  diNapoliDetrendOscillatorDescription: 'Detrendowany oscylator DiNapoli',
  diNapoliMacdPredictorDescription: 'Predyktor MACD DiNapoli',
  diNapoliOscillatorPredictorDescription: 'Predyktor oscylatora DiNapoli',
  doubleEmaDescription: 'Podwójna EMA',
  easeOfMovementDescription: 'Łatwość ruchu',
  forwardDescription: 'Wartość forward',
  hashiDescription: 'Wykres świeczkowy Heikin-Ashi',
  hl2Description: '(Maksimum + Minimum) / 2',
  hlc3Description: '(Maksimum + Minimum + Zamknięcie) / 3',
  ichimokuDescription: 'Wykres Ichimoku',
  minusdiDescription: 'Wskaźnik Minus DI',
  momentumDescription: 'Wskaźnik momentum',
  oc2Description: '(Otwarcie + Zamknięcie) / 2',
  ohlc4Description: '(Otwarcie + Maksimum + Minimum + Zamknięcie) / 4',
  pivotPointHLDescription: 'Szczyty i dołki',
  plusdiDescription: 'Wskaźnik Plus DI',
  rorDescription: 'Stopa zwrotu',
  tripleExponentialAverageDescription: 'Potrójna średnia wykładnicza',
  tsiDescription: 'Indeks True Strength',
  varbandsDescription: 'Pasmo varbands',
  williamsPercentRangeDescription: 'Procentowy zasięg Williamsa',
  zigzagDescription: 'Wskaźnik Zig Zag',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: 'Górny',
  lower: 'Dolny',
  middle: 'Środkowy',
  periods: 'Okresy',
  price: 'Cena',
  value: 'Wartość',
  line: 'Linia',
  signal: 'Sygnał',
  histogram: 'Histogram',
  priceOpen: 'Cena OTWARCIA',
  priceHigh: 'Cena MAKSIMUM',
  priceLow: 'Cena MINIMUM',
  priceClose: 'Cena ZAMKNIĘCIA',
  priceVolume: 'Wolumen',
  method: 'Metoda',
  displacement: 'Przesunięcie',
  distance: 'Odległość',
  type: 'Typ',
  spread: 'Spread',
  weight: 'Waga',
  multiplier: 'Mnożnik',
  shift: 'Przesunięcie',
  percent: 'Procent',
  probability: 'Prawdopodobieństwo',
  O: 'Otwarcie',
  H: 'Maksimum',
  L: 'Minimum',
  C: 'Zamknięcie',
  V: 'Wolumen',
  I: 'Otwarte zainteresowanie',
  hashiOpen: 'Otwarcie',
  hashiHigh: 'Maksimum',
  hashiLow: 'Minimum',
  hashiClose: 'Zamknięcie',
  aSeries: 'Seria A',
  bSeries: 'Seria B',
  cSeries: 'Seria C',
  dSeries: 'Seria D',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon góra',
  aroonDown: 'Aroon dół',
  envelopeUp: 'Koperta góra',
  envelopeDown: 'Koperta dół',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Polish translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/pl-PL-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
