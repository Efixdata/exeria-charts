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
    [/Moving Average/g, 'Gleitender Durchschnitt'],
    [/Simple Moving Average/g, 'Einfacher gleitender Durchschnitt'],
    [/Exponential Moving Average/g, 'Exponentieller gleitender Durchschnitt'],
    [/Weighted Moving Average/g, 'Gewichteter gleitender Durchschnitt'],
    [/Hull Moving Average/g, 'Hull-Gleitender Durchschnitt'],
    [/Displaced Moving Average/g, 'Verschobener gleitender Durchschnitt'],
    [/Modified Moving Average/g, 'Modifizierter gleitender Durchschnitt'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, 'Stochastik-Oszillator'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, 'Bollinger-Bänder'],
    [/Bollinger Band/g, 'Bollinger-Band'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'Chaikin-Volatilität'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, 'Preistrend'],
    [/Horizontal Line/g, 'Horizontale Linie'],
    [/Horizontal price levels/g, 'Horizontale Preislevel'],
    [/Trading Time Frame/g, 'Trading-Zeitrahmen'],
    [/Equity line/g, 'Equity-Linie'],
    [/Equity summary line/g, 'Equity-Zusammenfassungslinie'],
    [/Volume/g, 'Volumen'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, 'Prognose'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'Donchian-Kanal'],
    [/Keltner Channel/g, 'Keltner-Kanal'],
    [/Standard Deviation/g, 'Standardabweichung'],
    [/Correlation Coefficient/g, 'Korrelationskoeffizient'],
    [/Sharpe Ratio/g, 'Sharpe-Ratio'],
    [/Information Ratio/g, 'Information Ratio'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'Ease of Movement'],
    [/Ease of Movement/g, 'Ease of Movement'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, 'Historische Volatilität'],
    [/Net Volume/g, 'Netto-Volumen'],
    [/Accumulation/g, 'Akkumulation'],
    [/Pivot Point/g, 'Pivot Point'],
    [/Price Levels/g, 'Preislevel'],
    [/Williams Fractals/g, 'Williams-Fraktale'],
    [/Williams Percent Range/g, 'Williams Percent Range'],
    [/Williams Alligator/g, 'Williams Alligator'],
    [/Awesome Oscillator/g, 'Awesome Oscillator'],
    [/Fisher Transform/g, 'Fisher Transform'],
    [/Vortex Indicator/g, 'Vortex Indicator'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Coppock Curve'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'Summiert Indikatorwerte'],
    [/Measures distance between signals in strategy/g, 'Misst Abstand zwischen Signalen'],
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
  bbandTitle: 'Bollinger-Bänder',
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
  trendTitle: 'Preistrend',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'Zeitrahmen',
  forwardTitle: 'Forward',
  forecastTitle: 'Prognose',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'Akkumulation',
  priceLevelsTitle: 'Preislevel',
  signalDistanceTitle: 'Signalabstand',
  stochasticOscillatorTitle: 'Stochastik-Oszillator',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Awesome Oscillator',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: '% der Bollinger-Bänder',
  bbandsWidthTitle: 'Breite der Bollinger-Bänder',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Chaikin-Oszillator',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Coppock Curve',
  correlationCoefficientTitle: 'Korrelationskoeffizient',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'Donchian-Kanal',
  doubleEmaTitle: 'Doppel-EMA',
  easeOfMovementTitle: 'Ease of Movement',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Fisher Transform',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: 'Historische Volatilität',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Information Ratio',
  keltnerChannelIndicatorTitle: 'Keltner-Kanal',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'Netto-Volumen',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'Pivot Point',
  pivotPointHLTitle: 'Pivot Point HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'Sharpe-Ratio',
  standardDeviationTitle: 'Standardabweichung',
  tripleExponentialAverageTitle: 'Dreifacher exponentieller Durchschnitt',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Volumen-Oszillator',
  volumeRateOfChangeTitle: 'Volumen Rate of Change',
  vortexIndicatorTitle: 'Vortex Indicator',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Williams Alligator',
  williamsFractalsTitle: 'Williams-Fraktale',
  williamsPercentRangeTitle: 'Williams %R',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'Equity-Zusammenfassung',
  decisionLongBuyTitle: 'Kaufentscheidungen — monatlich',
  decisionLongSellTitle: 'Verkaufsentscheidungen — monatlich',
  decisionShortBuyTitle: 'Kaufentscheidungen — wöchentlich',
  decisionShortSellTitle: 'Verkaufsentscheidungen — wöchentlich',
};

const descriptionMap = {
  aroonDescription: 'Aroon oben/unten',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'Volatilitätsindikator von John Bollinger',
  chaikinOscillatorDescription: 'Chaikin-Oszillator',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Chande Momentum Oscillator',
  cmfDescription: 'Chaikin Money Flow',
  diNapoliDetrendOscillatorDescription: 'DiNapoli Detrend Oscillator',
  diNapoliMacdPredictorDescription: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorDescription: 'DiNapoli Oscillator Predictor',
  doubleEmaDescription: 'Doppel-EMA',
  easeOfMovementDescription: 'Ease of Movement',
  forwardDescription: 'Forward-Wert',
  hashiDescription: 'Heikin-Ashi-Kerzenchart',
  hl2Description: '(Hoch + Tief) / 2',
  hlc3Description: '(Hoch + Tief + Schluss) / 3',
  ichimokuDescription: 'Ichimoku-Chart',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'Momentum-Indikator',
  oc2Description: '(Eröffnung + Schluss) / 2',
  ohlc4Description: '(Eröffnung + Hoch + Tief + Schluss) / 4',
  pivotPointHLDescription: 'Hochs und Tiefs',
  plusdiDescription: 'Plus DI',
  rorDescription: 'Rate of Return',
  tripleExponentialAverageDescription: 'Dreifacher exponentieller Durchschnitt',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Williams Percent Range',
  zigzagDescription: 'Zig-Zag-Indikator',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: 'Oben',
  lower: 'Unten',
  middle: 'Mitte',
  periods: 'Perioden',
  price: 'Preis',
  value: 'Wert',
  line: 'Linie',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: 'Eröffnungspreis',
  priceHigh: 'Hochstpreis',
  priceLow: 'Tiefstpreis',
  priceClose: 'Schlusspreis',
  priceVolume: 'Volumen',
  method: 'Methode',
  displacement: 'Verschiebung',
  distance: 'Abstand',
  type: 'Typ',
  spread: 'Spread',
  weight: 'Gewicht',
  multiplier: 'Multiplikator',
  shift: 'Verschiebung',
  percent: 'Prozent',
  probability: 'Wahrscheinlichkeit',
  O: 'Eröffnung',
  H: 'Hoch',
  L: 'Tief',
  C: 'Schluss',
  V: 'Volumen',
  I: 'Open Interest',
  hashiOpen: 'Eröffnung',
  hashiHigh: 'Hoch',
  hashiLow: 'Tief',
  hashiClose: 'Schluss',
  aSeries: 'Serie A',
  bSeries: 'Serie B',
  cSeries: 'Serie C',
  dSeries: 'Serie D',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon oben',
  aroonDown: 'Aroon unten',
  envelopeUp: 'Envelope oben',
  envelopeDown: 'Envelope unten',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** German translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/de-DE-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
