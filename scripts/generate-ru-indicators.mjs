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
    [/Moving Average/g, 'Скользящая средняя'],
    [/Simple Moving Average/g, 'Простая скользящая средняя'],
    [/Exponential Moving Average/g, 'Экспоненциальная скользящая средняя'],
    [/Weighted Moving Average/g, 'Взвешенная скользящая средняя'],
    [/Hull Moving Average/g, 'Скользящая средняя Hull'],
    [/Displaced Moving Average/g, 'Смещённая скользящая средняя'],
    [/Modified Moving Average/g, 'Модифицированная скользящая средняя'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, 'Стохастический осциллятор'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, 'Полосы Боллинджера'],
    [/Bollinger Band/g, 'Полоса Боллинджера'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'Волатильность Chaikin'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, 'Тренд цены'],
    [/Horizontal Line/g, 'Горизонтальная линия'],
    [/Horizontal price levels/g, 'Горизонтальные уровни цены'],
    [/Trading Time Frame/g, 'Торговый таймфрейм'],
    [/Equity line/g, 'Линия капитала'],
    [/Equity summary line/g, 'Сводная линия капитала'],
    [/Volume/g, 'Объём'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, 'Прогноз'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'Канал Donchian'],
    [/Keltner Channel/g, 'Канал Keltner'],
    [/Standard Deviation/g, 'Стандартное отклонение'],
    [/Correlation Coefficient/g, 'Коэффициент корреляции'],
    [/Sharpe Ratio/g, 'Коэффициент Шарпа'],
    [/Information Ratio/g, 'Информационный коэффициент'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'Ease of Movement'],
    [/Ease of Movement/g, 'Ease of Movement'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, 'Историческая волатильность'],
    [/Net Volume/g, 'Чистый объём'],
    [/Accumulation/g, 'Накопление'],
    [/Pivot Point/g, 'Точка разворота'],
    [/Price Levels/g, 'Уровни цены'],
    [/Williams Fractals/g, 'Фракталы Williams'],
    [/Williams Percent Range/g, 'Williams %R'],
    [/Williams Alligator/g, 'Williams Alligator'],
    [/Awesome Oscillator/g, 'Awesome Oscillator'],
    [/Fisher Transform/g, 'Преобразование Fisher'],
    [/Vortex Indicator/g, 'Индикатор Vortex'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Кривая Coppock'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'Суммирует значения индикатора'],
    [/Measures distance between signals in strategy/g, 'Измеряет расстояние между сигналами в стратегии'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      'Статистическая недельная модель решений для экспортёра — почасовые данные',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      'Статистическая недельная модель решений для импортёра — почасовые данные',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      'Статистическая месячная модель решений для экспортёра — почасовые данные',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      'Статистическая месячная модель решений для импортёра — почасовые данные',
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
  bbandTitle: 'Полосы Боллинджера',
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
  trendTitle: 'Тренд цены',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'Таймфрейм',
  forwardTitle: 'Forward',
  forecastTitle: 'Прогноз',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'Накопление',
  priceLevelsTitle: 'Уровни цены',
  signalDistanceTitle: 'Расстояние сигналов',
  stochasticOscillatorTitle: 'Стохастический осциллятор',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Awesome Oscillator',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: '% полос Боллинджера',
  bbandsWidthTitle: 'Ширина полос Боллинджера',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Осциллятор Chaikin',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Кривая Coppock',
  correlationCoefficientTitle: 'Коэффициент корреляции',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'Канал Donchian',
  doubleEmaTitle: 'Двойная EMA',
  easeOfMovementTitle: 'Ease of Movement',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Преобразование Fisher',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: 'Историческая волатильность',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Информационный коэффициент',
  keltnerChannelIndicatorTitle: 'Канал Keltner',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'Чистый объём',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'Точка разворота',
  pivotPointHLTitle: 'Точка разворота HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'Коэффициент Шарпа',
  standardDeviationTitle: 'Стандартное отклонение',
  tripleExponentialAverageTitle: 'Тройная экспоненциальная средняя',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Осциллятор объёма',
  volumeRateOfChangeTitle: 'Скорость изменения объёма',
  vortexIndicatorTitle: 'Индикатор Vortex',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Williams Alligator',
  williamsFractalsTitle: 'Фракталы Williams',
  williamsPercentRangeTitle: 'Williams %R',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'Сводка капитала',
  decisionLongBuyTitle: 'Решения на покупку — месячные',
  decisionLongSellTitle: 'Решения на продажу — месячные',
  decisionShortBuyTitle: 'Решения на покупку — недельные',
  decisionShortSellTitle: 'Решения на продажу — недельные',
};

const descriptionMap = {
  aroonDescription: 'Aroon вверх/вниз',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'Индикатор волатильности John Bollinger',
  chaikinOscillatorDescription: 'Осциллятор Chaikin',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Осциллятор momentum Chande',
  cmfDescription: 'Денежный поток Chaikin',
  diNapoliDetrendOscillatorDescription: 'Detrend-осциллятор DiNapoli',
  diNapoliMacdPredictorDescription: 'Предиктор MACD DiNapoli',
  diNapoliOscillatorPredictorDescription: 'Предиктор осциллятора DiNapoli',
  doubleEmaDescription: 'Двойная EMA',
  easeOfMovementDescription: 'Ease of Movement',
  forwardDescription: 'Forward-значение',
  hashiDescription: 'Свечной график Heikin-Ashi',
  hl2Description: '(Макс + Мин) / 2',
  hlc3Description: '(Макс + Мин + Закр) / 3',
  ichimokuDescription: 'График Ichimoku',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'Индикатор momentum',
  oc2Description: '(Откр + Закр) / 2',
  ohlc4Description: '(Откр + Макс + Мин + Закр) / 4',
  pivotPointHLDescription: 'Максимумы и минимумы',
  plusdiDescription: 'Plus DI',
  rorDescription: 'Норма доходности',
  tripleExponentialAverageDescription: 'Тройная экспоненциальная средняя',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Williams %R',
  zigzagDescription: 'Индикатор Zig Zag',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: 'Верхняя',
  lower: 'Нижняя',
  middle: 'Средняя',
  periods: 'Периоды',
  price: 'Цена',
  value: 'Значение',
  line: 'Линия',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: 'Цена ОТКР',
  priceHigh: 'Цена МАКС',
  priceLow: 'Цена МИН',
  priceClose: 'Цена ЗАКР',
  priceVolume: 'Объём',
  method: 'Метод',
  displacement: 'Смещение',
  distance: 'Расстояние',
  type: 'Тип',
  spread: 'Spread',
  weight: 'Вес',
  multiplier: 'Множитель',
  shift: 'Смещение',
  percent: 'Процент',
  probability: 'Вероятность',
  O: 'Откр',
  H: 'Макс',
  L: 'Мин',
  C: 'Закр',
  V: 'Объём',
  I: 'Открытый интерес',
  hashiOpen: 'Откр',
  hashiHigh: 'Макс',
  hashiLow: 'Мин',
  hashiClose: 'Закр',
  aSeries: 'Серия A',
  bSeries: 'Серия B',
  cSeries: 'Серия C',
  dSeries: 'Серия D',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon вверх',
  aroonDown: 'Aroon вниз',
  envelopeUp: 'Верхний envelope',
  envelopeDown: 'Нижний envelope',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Russian translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/ru-RU-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
