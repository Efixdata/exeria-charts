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
    [/Moving Average/g, 'Moyenne mobile'],
    [/Simple Moving Average/g, 'Moyenne mobile simple'],
    [/Exponential Moving Average/g, 'Moyenne mobile exponentielle'],
    [/Weighted Moving Average/g, 'Moyenne mobile pondérée'],
    [/Hull Moving Average/g, 'Moyenne mobile de Hull'],
    [/Displaced Moving Average/g, 'Moyenne mobile décalée'],
    [/Modified Moving Average/g, 'Moyenne mobile modifiée'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, 'Oscillateur stochastique'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, 'Bandes de Bollinger'],
    [/Bollinger Band/g, 'Bande de Bollinger'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'Volatilité de Chaikin'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, 'Tendance des prix'],
    [/Horizontal Line/g, 'Ligne horizontale'],
    [/Horizontal price levels/g, 'Niveaux de prix horizontaux'],
    [/Trading Time Frame/g, 'Intervalle de trading'],
    [/Equity line/g, 'Ligne de capitaux'],
    [/Equity summary line/g, 'Ligne de synthèse des capitaux'],
    [/Volume/g, 'Volume'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, 'Prévision'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'Canal de Donchian'],
    [/Keltner Channel/g, 'Canal de Keltner'],
    [/Standard Deviation/g, 'Écart type'],
    [/Correlation Coefficient/g, 'Coefficient de corrélation'],
    [/Sharpe Ratio/g, 'Ratio de Sharpe'],
    [/Information Ratio/g, 'Ratio d\'information'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'Facilité de mouvement'],
    [/Ease of Movement/g, 'Facilité de mouvement'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, 'Volatilité historique'],
    [/Net Volume/g, 'Volume net'],
    [/Accumulation/g, 'Accumulation'],
    [/Pivot Point/g, 'Point pivot'],
    [/Price Levels/g, 'Niveaux de prix'],
    [/Williams Fractals/g, 'Fractales de Williams'],
    [/Williams Percent Range/g, 'Fourchette de pourcentage de Williams'],
    [/Williams Alligator/g, 'Alligator de Williams'],
    [/Awesome Oscillator/g, 'Oscillateur Awesome'],
    [/Fisher Transform/g, 'Transformée de Fisher'],
    [/Vortex Indicator/g, 'Indicateur Vortex'],
    [/Balance Of Power/g, 'Balance des forces'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Courbe de Coppock'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'Somme les valeurs de l\'indicateur'],
    [/Measures distance between signals in strategy/g, 'Mesure la distance entre les signaux'],
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
  bbandTitle: 'Bandes de Bollinger',
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
  trendTitle: 'Tendance des prix',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'Intervalle',
  forwardTitle: 'Forward',
  forecastTitle: 'Prévision',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'Accumulation',
  priceLevelsTitle: 'Niveaux de prix',
  signalDistanceTitle: 'Distance des signaux',
  stochasticOscillatorTitle: 'Oscillateur stochastique',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Enveloppe',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Oscillateur Awesome',
  balanceOfPowerTitle: 'Balance des forces',
  bbandsPercentTitle: '% des bandes de Bollinger',
  bbandsWidthTitle: 'Largeur des bandes de Bollinger',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Oscillateur de Chaikin',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Courbe de Coppock',
  correlationCoefficientTitle: 'Coefficient de corrélation',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'Canal de Donchian',
  doubleEmaTitle: 'Double EMA',
  easeOfMovementTitle: 'Facilité de mouvement',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Transformée de Fisher',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: 'Volatilité historique',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Ratio d\'information',
  keltnerChannelIndicatorTitle: 'Canal de Keltner',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'Volume net',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'Point pivot',
  pivotPointHLTitle: 'Point pivot HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'Ratio de Sharpe',
  standardDeviationTitle: 'Écart type',
  tripleExponentialAverageTitle: 'Moyenne exponentielle triple',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Oscillateur de volume',
  volumeRateOfChangeTitle: 'Taux de variation du volume',
  vortexIndicatorTitle: 'Indicateur Vortex',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Alligator de Williams',
  williamsFractalsTitle: 'Fractales de Williams',
  williamsPercentRangeTitle: '%R de Williams',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'Synthèse des capitaux',
  decisionLongBuyTitle: 'Décisions d\'achat — mensuelles',
  decisionLongSellTitle: 'Décisions de vente — mensuelles',
  decisionShortBuyTitle: 'Décisions d\'achat — hebdomadaires',
  decisionShortSellTitle: 'Décisions de vente — hebdomadaires',
};

const descriptionMap = {
  aroonDescription: 'Aroon haut/bas',
  balanceOfPowerDescription: 'Balance des forces',
  bbandDescription: 'Indicateur de volatilité de John Bollinger',
  chaikinOscillatorDescription: 'Oscillateur de Chaikin',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Oscillateur de momentum Chande',
  cmfDescription: 'Flux monétaire de Chaikin',
  diNapoliDetrendOscillatorDescription: 'Oscillateur detrend DiNapoli',
  diNapoliMacdPredictorDescription: 'Prédicteur MACD DiNapoli',
  diNapoliOscillatorPredictorDescription: 'Prédicteur d\'oscillateur DiNapoli',
  doubleEmaDescription: 'Double EMA',
  easeOfMovementDescription: 'Facilité de mouvement',
  forwardDescription: 'Valeur forward',
  hashiDescription: 'Graphique en chandeliers Heikin-Ashi',
  hl2Description: '(Haut + Bas) / 2',
  hlc3Description: '(Haut + Bas + Clôture) / 3',
  ichimokuDescription: 'Graphique Ichimoku',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'Indicateur de momentum',
  oc2Description: '(Ouverture + Clôture) / 2',
  ohlc4Description: '(Ouverture + Haut + Bas + Clôture) / 4',
  pivotPointHLDescription: 'Sommets et creux',
  plusdiDescription: 'Plus DI',
  rorDescription: 'Taux de rendement',
  tripleExponentialAverageDescription: 'Moyenne exponentielle triple',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Fourchette de pourcentage de Williams',
  zigzagDescription: 'Indicateur Zig Zag',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: 'Supérieur',
  lower: 'Inférieur',
  middle: 'Médian',
  periods: 'Périodes',
  price: 'Prix',
  value: 'Valeur',
  line: 'Ligne',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: 'Prix d\'OUVERTURE',
  priceHigh: 'Prix le PLUS HAUT',
  priceLow: 'Prix le PLUS BAS',
  priceClose: 'Prix de CLÔTURE',
  priceVolume: 'Volume',
  method: 'Méthode',
  displacement: 'Décalage',
  distance: 'Distance',
  type: 'Typ',
  spread: 'Spread',
  weight: 'Poids',
  multiplier: 'Multiplicateur',
  shift: 'Décalage',
  percent: 'Pourcentage',
  probability: 'Probabilité',
  O: 'Ouverture',
  H: 'Haut',
  L: 'Bas',
  C: 'Clôture',
  V: 'Volume',
  I: 'Open interest',
  hashiOpen: 'Ouverture',
  hashiHigh: 'Haut',
  hashiLow: 'Bas',
  hashiClose: 'Clôture',
  aSeries: 'Série A',
  bSeries: 'Série B',
  cSeries: 'Série C',
  dSeries: 'Série D',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon haut',
  aroonDown: 'Aroon bas',
  envelopeUp: 'Enveloppe haute',
  envelopeDown: 'Enveloppe basse',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** French translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/fr-FR-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
