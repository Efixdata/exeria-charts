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
    [/Moving Average/g, 'Media mobile'],
    [/Simple Moving Average/g, 'Media mobile semplice'],
    [/Exponential Moving Average/g, 'Media mobile esponenziale'],
    [/Weighted Moving Average/g, 'Media mobile ponderata'],
    [/Hull Moving Average/g, 'Media mobile di Hull'],
    [/Displaced Moving Average/g, 'Media mobile spostata'],
    [/Modified Moving Average/g, 'Media mobile modificata'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, 'Oscillatore stocastico'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, 'Bande di Bollinger'],
    [/Bollinger Band/g, 'Banda di Bollinger'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'Volatilità di Chaikin'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, 'Trend di prezzo'],
    [/Horizontal Line/g, 'Linea orizzontale'],
    [/Horizontal price levels/g, 'Livelli di prezzo orizzontali'],
    [/Trading Time Frame/g, 'Time frame di trading'],
    [/Equity line/g, 'Linea equity'],
    [/Equity summary line/g, 'Linea riepilogo equity'],
    [/Volume/g, 'Volume'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, 'Previsione'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'Canale di Donchian'],
    [/Keltner Channel/g, 'Canale di Keltner'],
    [/Standard Deviation/g, 'Deviazione standard'],
    [/Correlation Coefficient/g, 'Coefficiente di correlazione'],
    [/Sharpe Ratio/g, 'Indice di Sharpe'],
    [/Information Ratio/g, 'Indice di informazione'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'Facilità di movimento'],
    [/Ease of Movement/g, 'Facilità di movimento'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, 'Volatilità storica'],
    [/Net Volume/g, 'Volume netto'],
    [/Accumulation/g, 'Accumulazione'],
    [/Pivot Point/g, 'Punto pivot'],
    [/Price Levels/g, 'Livelli di prezzo'],
    [/Williams Fractals/g, 'Frattali di Williams'],
    [/Williams Percent Range/g, 'Range percentuale di Williams'],
    [/Williams Alligator/g, 'Alligator di Williams'],
    [/Awesome Oscillator/g, 'Oscillatore Awesome'],
    [/Fisher Transform/g, 'Trasformata di Fisher'],
    [/Vortex Indicator/g, 'Indicatore Vortex'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Curva di Coppock'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, "Somma i valori dell'indicatore"],
    [/Measures distance between signals in strategy/g, 'Misura la distanza tra i segnali'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      'Modello decisionale statistico settimanale per esportatore — dati orari',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      'Modello decisionale statistico settimanale per importatore — dati orari',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      'Modello decisionale statistico mensile per esportatore — dati orari',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      'Modello decisionale statistico mensile per importatore — dati orari',
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
  bbandTitle: 'Bande di Bollinger',
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
  trendTitle: 'Trend di prezzo',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'Time frame',
  forwardTitle: 'Forward',
  forecastTitle: 'Previsione',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'Accumulazione',
  priceLevelsTitle: 'Livelli di prezzo',
  signalDistanceTitle: 'Distanza segnali',
  stochasticOscillatorTitle: 'Oscillatore stocastico',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Oscillatore Awesome',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: '% bande di Bollinger',
  bbandsWidthTitle: 'Larghezza bande di Bollinger',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Oscillatore di Chaikin',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Curva di Coppock',
  correlationCoefficientTitle: 'Coefficiente di correlazione',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'Canale di Donchian',
  doubleEmaTitle: 'EMA doppia',
  easeOfMovementTitle: 'Facilità di movimento',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Trasformata di Fisher',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: 'Volatilità storica',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Indice di informazione',
  keltnerChannelIndicatorTitle: 'Canale di Keltner',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'Volume netto',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'Punto pivot',
  pivotPointHLTitle: 'Punto pivot HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'Indice di Sharpe',
  standardDeviationTitle: 'Deviazione standard',
  tripleExponentialAverageTitle: 'Media esponenziale tripla',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Oscillatore volume',
  volumeRateOfChangeTitle: 'Tasso di variazione del volume',
  vortexIndicatorTitle: 'Indicatore Vortex',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Alligator di Williams',
  williamsFractalsTitle: 'Frattali di Williams',
  williamsPercentRangeTitle: '%R di Williams',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'Riepilogo equity',
  decisionLongBuyTitle: 'Decisioni acquisto — mensili',
  decisionLongSellTitle: 'Decisioni vendita — mensili',
  decisionShortBuyTitle: 'Decisioni acquisto — settimanali',
  decisionShortSellTitle: 'Decisioni vendita — settimanali',
};

const descriptionMap = {
  aroonDescription: 'Aroon su/giù',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'Indicatore di volatilità di John Bollinger',
  chaikinOscillatorDescription: 'Oscillatore di Chaikin',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Oscillatore momentum Chande',
  cmfDescription: 'Flusso monetario di Chaikin',
  diNapoliDetrendOscillatorDescription: 'Oscillatore detrend DiNapoli',
  diNapoliMacdPredictorDescription: 'Predittore MACD DiNapoli',
  diNapoliOscillatorPredictorDescription: 'Predittore oscillatore DiNapoli',
  doubleEmaDescription: 'EMA doppia',
  easeOfMovementDescription: 'Facilità di movimento',
  forwardDescription: 'Valore forward',
  hashiDescription: 'Grafico candele Heikin-Ashi',
  hl2Description: '(Massimo + Minimo) / 2',
  hlc3Description: '(Massimo + Minimo + Chiusura) / 3',
  ichimokuDescription: 'Grafico Ichimoku',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'Indicatore momentum',
  oc2Description: '(Apertura + Chiusura) / 2',
  ohlc4Description: '(Apertura + Massimo + Minimo + Chiusura) / 4',
  pivotPointHLDescription: 'Massimi e minimi',
  plusdiDescription: 'Plus DI',
  rorDescription: 'Tasso di rendimento',
  tripleExponentialAverageDescription: 'Media esponenziale tripla',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Range percentuale di Williams',
  zigzagDescription: 'Indicatore Zig Zag',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: 'Superiore',
  lower: 'Inferiore',
  middle: 'Medio',
  periods: 'Periodi',
  price: 'Prezzo',
  value: 'Valore',
  line: 'Linea',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: 'Prezzo APERTURA',
  priceHigh: 'Prezzo MASSIMO',
  priceLow: 'Prezzo MINIMO',
  priceClose: 'Prezzo CHIUSURA',
  priceVolume: 'Volume',
  method: 'Metodo',
  displacement: 'Spostamento',
  distance: 'Distanza',
  type: 'Tipo',
  spread: 'Spread',
  weight: 'Peso',
  multiplier: 'Moltiplicatore',
  shift: 'Spostamento',
  percent: 'Percentuale',
  probability: 'Probabilità',
  O: 'Apertura',
  H: 'Massimo',
  L: 'Minimo',
  C: 'Chiusura',
  V: 'Volume',
  I: 'Open interest',
  hashiOpen: 'Apertura',
  hashiHigh: 'Massimo',
  hashiLow: 'Minimo',
  hashiClose: 'Chiusura',
  aSeries: 'Serie A',
  bSeries: 'Serie B',
  cSeries: 'Serie C',
  dSeries: 'Serie D',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon su',
  aroonDown: 'Aroon giù',
  envelopeUp: 'Envelope superiore',
  envelopeDown: 'Envelope inferiore',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Italian translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/it-IT-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
