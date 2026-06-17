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
    [/Moving Average/g, 'Media móvil'],
    [/Simple Moving Average/g, 'Media móvil simple'],
    [/Exponential Moving Average/g, 'Media móvil exponencial'],
    [/Weighted Moving Average/g, 'Media móvil ponderada'],
    [/Hull Moving Average/g, 'Media móvil de Hull'],
    [/Displaced Moving Average/g, 'Media móvil desplazada'],
    [/Modified Moving Average/g, 'Media móvil modificada'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, 'Oscilador estocástico'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, 'Bandas de Bollinger'],
    [/Bollinger Band/g, 'Banda de Bollinger'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'Volatilidad de Chaikin'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, 'Tendencia de precios'],
    [/Horizontal Line/g, 'Línea horizontal'],
    [/Horizontal price levels/g, 'Niveles de precio horizontales'],
    [/Trading Time Frame/g, 'Marco temporal de trading'],
    [/Equity line/g, 'Línea de capital'],
    [/Equity summary line/g, 'Línea de resumen de capital'],
    [/Volume/g, 'Volumen'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, 'Previsión'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'Canal de Donchian'],
    [/Keltner Channel/g, 'Canal de Keltner'],
    [/Standard Deviation/g, 'Desviación estándar'],
    [/Correlation Coefficient/g, 'Coeficiente de correlación'],
    [/Sharpe Ratio/g, 'Ratio de Sharpe'],
    [/Information Ratio/g, 'Ratio de información'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'Facilidad de movimiento'],
    [/Ease of Movement/g, 'Facilidad de movimiento'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, 'Volatilidad histórica'],
    [/Net Volume/g, 'Volumen neto'],
    [/Accumulation/g, 'Acumulación'],
    [/Pivot Point/g, 'Punto pivot'],
    [/Price Levels/g, 'Niveles de precio'],
    [/Williams Fractals/g, 'Fractales de Williams'],
    [/Williams Percent Range/g, 'Rango porcentual de Williams'],
    [/Williams Alligator/g, 'Alligator de Williams'],
    [/Awesome Oscillator/g, 'Oscilador Awesome'],
    [/Fisher Transform/g, 'Transformada de Fisher'],
    [/Vortex Indicator/g, 'Indicador Vortex'],
    [/Balance Of Power/g, 'Balance de poder'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Curva de Coppock'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'Suma los valores del indicador'],
    [/Measures distance between signals in strategy/g, 'Mide la distancia entre señales'],
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
  bbandTitle: 'Bandas de Bollinger',
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
  trendTitle: 'Tendencia de precios',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'Marco temporal',
  forwardTitle: 'Forward',
  forecastTitle: 'Previsión',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'Acumulación',
  priceLevelsTitle: 'Niveles de precio',
  signalDistanceTitle: 'Distancia de señales',
  stochasticOscillatorTitle: 'Oscilador estocástico',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Sobre',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Oscilador Awesome',
  balanceOfPowerTitle: 'Balance de poder',
  bbandsPercentTitle: '% de bandas de Bollinger',
  bbandsWidthTitle: 'Ancho de bandas de Bollinger',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Oscilador de Chaikin',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Curva de Coppock',
  correlationCoefficientTitle: 'Coeficiente de correlación',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'Canal de Donchian',
  doubleEmaTitle: 'EMA doble',
  easeOfMovementTitle: 'Facilidad de movimiento',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Transformada de Fisher',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: 'Volatilidad histórica',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Ratio de información',
  keltnerChannelIndicatorTitle: 'Canal de Keltner',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'Volumen neto',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'Punto pivot',
  pivotPointHLTitle: 'Punto pivot HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'Ratio de Sharpe',
  standardDeviationTitle: 'Desviación estándar',
  tripleExponentialAverageTitle: 'Media exponencial triple',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Oscilador de volumen',
  volumeRateOfChangeTitle: 'Tasa de cambio del volumen',
  vortexIndicatorTitle: 'Indicador Vortex',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Alligator de Williams',
  williamsFractalsTitle: 'Fractales de Williams',
  williamsPercentRangeTitle: '%R de Williams',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'Resumen de capital',
  decisionLongBuyTitle: 'Decisiones de compra — mensuales',
  decisionLongSellTitle: 'Decisiones de venta — mensuales',
  decisionShortBuyTitle: 'Decisiones de compra — semanales',
  decisionShortSellTitle: 'Decisiones de venta — semanales',
};

const descriptionMap = {
  aroonDescription: 'Aroon arriba/abajo',
  balanceOfPowerDescription: 'Balance de poder',
  bbandDescription: 'Indicador de volatilidad de John Bollinger',
  chaikinOscillatorDescription: 'Oscilador de Chaikin',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Oscilador de momentum Chande',
  cmfDescription: 'Flujo de dinero de Chaikin',
  diNapoliDetrendOscillatorDescription: 'Oscilador detrend DiNapoli',
  diNapoliMacdPredictorDescription: 'Predictor MACD DiNapoli',
  diNapoliOscillatorPredictorDescription: 'Predictor de oscilador DiNapoli',
  doubleEmaDescription: 'EMA doble',
  easeOfMovementDescription: 'Facilidad de movimiento',
  forwardDescription: 'Valor forward',
  hashiDescription: 'Gráfico de velas Heikin-Ashi',
  hl2Description: '(Máximo + Mínimo) / 2',
  hlc3Description: '(Máximo + Mínimo + Cierre) / 3',
  ichimokuDescription: 'Gráfico Ichimoku',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'Indicador de momentum',
  oc2Description: '(Apertura + Cierre) / 2',
  ohlc4Description: '(Apertura + Máximo + Mínimo + Cierre) / 4',
  pivotPointHLDescription: 'Máximos y mínimos',
  plusdiDescription: 'Plus DI',
  rorDescription: 'Tasa de rendimiento',
  tripleExponentialAverageDescription: 'Media exponencial triple',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Rango porcentual de Williams',
  zigzagDescription: 'Indicador Zig Zag',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: 'Superior',
  lower: 'Inferior',
  middle: 'Medio',
  periods: 'Periodos',
  price: 'Precio',
  value: 'Valor',
  line: 'Línea',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: 'Precio de APERTURA',
  priceHigh: 'Precio MÁXIMO',
  priceLow: 'Precio MÍNIMO',
  priceClose: 'Precio de CIERRE',
  priceVolume: 'Volumen',
  method: 'Método',
  displacement: 'Desplazamiento',
  distance: 'Distancia',
  type: 'Typ',
  spread: 'Spread',
  weight: 'Peso',
  multiplier: 'Multiplicador',
  shift: 'Desplazamiento',
  percent: 'Porcentaje',
  probability: 'Probabilidad',
  O: 'Apertura',
  H: 'Máximo',
  L: 'Mínimo',
  C: 'Cierre',
  V: 'Volumen',
  I: 'Interés abierto',
  hashiOpen: 'Apertura',
  hashiHigh: 'Máximo',
  hashiLow: 'Mínimo',
  hashiClose: 'Cierre',
  aSeries: 'Serie A',
  bSeries: 'Serie B',
  cSeries: 'Serie C',
  dSeries: 'Serie D',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon arriba',
  aroonDown: 'Aroon abajo',
  envelopeUp: 'Sobre superior',
  envelopeDown: 'Sobre inferior',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Spanish translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/es-ES-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
