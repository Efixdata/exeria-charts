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
    [/Moving Average/g, 'Média móvel'],
    [/Simple Moving Average/g, 'Média móvel simples'],
    [/Exponential Moving Average/g, 'Média móvel exponencial'],
    [/Weighted Moving Average/g, 'Média móvel ponderada'],
    [/Hull Moving Average/g, 'Média móvel de Hull'],
    [/Displaced Moving Average/g, 'Média móvel deslocada'],
    [/Modified Moving Average/g, 'Média móvel modificada'],
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
    [/Chaikin's Volatility/gi, 'Volatilidade de Chaikin'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, 'Tendência de preços'],
    [/Horizontal Line/g, 'Linha horizontal'],
    [/Horizontal price levels/g, 'Níveis de preço horizontais'],
    [/Trading Time Frame/g, 'Time frame de trading'],
    [/Equity line/g, 'Linha de patrimônio'],
    [/Equity summary line/g, 'Linha de resumo de patrimônio'],
    [/Volume/g, 'Volume'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, 'Previsão'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'Canal de Donchian'],
    [/Keltner Channel/g, 'Canal de Keltner'],
    [/Standard Deviation/g, 'Desvio padrão'],
    [/Correlation Coefficient/g, 'Coeficiente de correlação'],
    [/Sharpe Ratio/g, 'Índice de Sharpe'],
    [/Information Ratio/g, 'Índice de informação'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'Facilidade de movimento'],
    [/Ease of Movement/g, 'Facilidade de movimento'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, 'Volatilidade histórica'],
    [/Net Volume/g, 'Volume líquido'],
    [/Accumulation/g, 'Acumulação'],
    [/Pivot Point/g, 'Ponto pivot'],
    [/Price Levels/g, 'Níveis de preço'],
    [/Williams Fractals/g, 'Fractais de Williams'],
    [/Williams Percent Range/g, 'Faixa percentual de Williams'],
    [/Williams Alligator/g, 'Alligator de Williams'],
    [/Awesome Oscillator/g, 'Oscilador Awesome'],
    [/Fisher Transform/g, 'Transformada de Fisher'],
    [/Vortex Indicator/g, 'Indicador Vortex'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Curva de Coppock'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'Soma os valores do indicador'],
    [/Measures distance between signals in strategy/g, 'Mede a distância entre sinais'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      'Modelo estatístico semanal de decisão para exportador — dados horários',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      'Modelo estatístico semanal de decisão para importador — dados horários',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      'Modelo estatístico mensal de decisão para exportador — dados horários',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      'Modelo estatístico mensal de decisão para importador — dados horários',
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
  trendTitle: 'Tendência de preços',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'Time frame',
  forwardTitle: 'Forward',
  forecastTitle: 'Previsão',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'Acumulação',
  priceLevelsTitle: 'Níveis de preço',
  signalDistanceTitle: 'Distância de sinais',
  stochasticOscillatorTitle: 'Oscilador estocástico',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Oscilador Awesome',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: '% das bandas de Bollinger',
  bbandsWidthTitle: 'Largura das bandas de Bollinger',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Oscilador de Chaikin',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Curva de Coppock',
  correlationCoefficientTitle: 'Coeficiente de correlação',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'Canal de Donchian',
  doubleEmaTitle: 'EMA dupla',
  easeOfMovementTitle: 'Facilidade de movimento',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Transformada de Fisher',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: 'Volatilidade histórica',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Índice de informação',
  keltnerChannelIndicatorTitle: 'Canal de Keltner',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'Volume líquido',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'Ponto pivot',
  pivotPointHLTitle: 'Ponto pivot HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'Índice de Sharpe',
  standardDeviationTitle: 'Desvio padrão',
  tripleExponentialAverageTitle: 'Média exponencial tripla',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Oscilador de volume',
  volumeRateOfChangeTitle: 'Taxa de variação do volume',
  vortexIndicatorTitle: 'Indicador Vortex',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Alligator de Williams',
  williamsFractalsTitle: 'Fractais de Williams',
  williamsPercentRangeTitle: '%R de Williams',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'Resumo de patrimônio',
  decisionLongBuyTitle: 'Decisões de compra — mensais',
  decisionLongSellTitle: 'Decisões de venda — mensais',
  decisionShortBuyTitle: 'Decisões de compra — semanais',
  decisionShortSellTitle: 'Decisões de venda — semanais',
};

const descriptionMap = {
  aroonDescription: 'Aroon alta/baixa',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'Indicador de volatilidade de John Bollinger',
  chaikinOscillatorDescription: 'Oscilador de Chaikin',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Oscilador de momentum Chande',
  cmfDescription: 'Fluxo de dinheiro de Chaikin',
  diNapoliDetrendOscillatorDescription: 'Oscilador detrend DiNapoli',
  diNapoliMacdPredictorDescription: 'Preditor MACD DiNapoli',
  diNapoliOscillatorPredictorDescription: 'Preditor de oscilador DiNapoli',
  doubleEmaDescription: 'EMA dupla',
  easeOfMovementDescription: 'Facilidade de movimento',
  forwardDescription: 'Valor forward',
  hashiDescription: 'Gráfico de velas Heikin-Ashi',
  hl2Description: '(Máxima + Mínima) / 2',
  hlc3Description: '(Máxima + Mínima + Fechamento) / 3',
  ichimokuDescription: 'Gráfico Ichimoku',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'Indicador de momentum',
  oc2Description: '(Abertura + Fechamento) / 2',
  ohlc4Description: '(Abertura + Máxima + Mínima + Fechamento) / 4',
  pivotPointHLDescription: 'Máximas e mínimas',
  plusdiDescription: 'Plus DI',
  rorDescription: 'Taxa de retorno',
  tripleExponentialAverageDescription: 'Média exponencial tripla',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Faixa percentual de Williams',
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
  middle: 'Médio',
  periods: 'Períodos',
  price: 'Preço',
  value: 'Valor',
  line: 'Linha',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: 'Preço de ABERTURA',
  priceHigh: 'Preço MÁXIMA',
  priceLow: 'Preço MÍNIMA',
  priceClose: 'Preço de FECHAMENTO',
  priceVolume: 'Volume',
  method: 'Método',
  displacement: 'Deslocamento',
  distance: 'Distância',
  type: 'Tipo',
  spread: 'Spread',
  weight: 'Peso',
  multiplier: 'Multiplicador',
  shift: 'Deslocamento',
  percent: 'Percentual',
  probability: 'Probabilidade',
  O: 'Abertura',
  H: 'Máxima',
  L: 'Mínima',
  C: 'Fechamento',
  V: 'Volume',
  I: 'Interesse aberto',
  hashiOpen: 'Abertura',
  hashiHigh: 'Máxima',
  hashiLow: 'Mínima',
  hashiClose: 'Fechamento',
  aSeries: 'Série A',
  bSeries: 'Série B',
  cSeries: 'Série C',
  dSeries: 'Série D',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon alta',
  aroonDown: 'Aroon baixa',
  envelopeUp: 'Envelope superior',
  envelopeDown: 'Envelope inferior',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Brazilian Portuguese translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/pt-BR-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
