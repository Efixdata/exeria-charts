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
    [/Moving Average/g, 'Hareketli ortalama'],
    [/Simple Moving Average/g, 'Basit hareketli ortalama'],
    [/Exponential Moving Average/g, 'Üssel hareketli ortalama'],
    [/Weighted Moving Average/g, 'Ağırlıklı hareketli ortalama'],
    [/Hull Moving Average/g, 'Hull hareketli ortalama'],
    [/Displaced Moving Average/g, 'Kaydırılmış hareketli ortalama'],
    [/Modified Moving Average/g, 'Değiştirilmiş hareketli ortalama'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, 'Stokastik osilatör'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, 'Bollinger bantları'],
    [/Bollinger Band/g, 'Bollinger bandı'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'Chaikin volatilitesi'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, 'Fiyat trendi'],
    [/Horizontal Line/g, 'Yatay çizgi'],
    [/Horizontal price levels/g, 'Yatay fiyat seviyeleri'],
    [/Trading Time Frame/g, 'İşlem zaman dilimi'],
    [/Equity line/g, 'Özsermaye çizgisi'],
    [/Equity summary line/g, 'Özsermaye özet çizgisi'],
    [/Volume/g, 'Hacim'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, 'Tahmin'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'Donchian kanalı'],
    [/Keltner Channel/g, 'Keltner kanalı'],
    [/Standard Deviation/g, 'Standart sapma'],
    [/Correlation Coefficient/g, 'Korelasyon katsayısı'],
    [/Sharpe Ratio/g, 'Sharpe oranı'],
    [/Information Ratio/g, 'Bilgi oranı'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'Hareket kolaylığı'],
    [/Ease of Movement/g, 'Hareket kolaylığı'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, 'Tarihsel volatilite'],
    [/Net Volume/g, 'Net hacim'],
    [/Accumulation/g, 'Birikim'],
    [/Pivot Point/g, 'Pivot noktası'],
    [/Price Levels/g, 'Fiyat seviyeleri'],
    [/Williams Fractals/g, 'Williams fraktalleri'],
    [/Williams Percent Range/g, 'Williams yüzde aralığı'],
    [/Williams Alligator/g, 'Williams alligator'],
    [/Awesome Oscillator/g, 'Awesome osilatör'],
    [/Fisher Transform/g, 'Fisher dönüşümü'],
    [/Vortex Indicator/g, 'Vortex göstergesi'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Coppock eğrisi'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'Gösterge değerlerini toplar'],
    [/Measures distance between signals in strategy/g, 'Stratejideki sinyaller arası mesafeyi ölçer'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      'İhracatçı için istatistiksel haftalık karar modeli — saatlik veri',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      'İthalatçı için istatistiksel haftalık karar modeli — saatlik veri',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      'İhracatçı için istatistiksel aylık karar modeli — saatlik veri',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      'İthalatçı için istatistiksel aylık karar modeli — saatlik veri',
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
  bbandTitle: 'Bollinger bantları',
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
  trendTitle: 'Fiyat trendi',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'Zaman dilimi',
  forwardTitle: 'Forward',
  forecastTitle: 'Tahmin',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'Birikim',
  priceLevelsTitle: 'Fiyat seviyeleri',
  signalDistanceTitle: 'Sinyal mesafesi',
  stochasticOscillatorTitle: 'Stokastik osilatör',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Awesome osilatör',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: 'Bollinger bantları %',
  bbandsWidthTitle: 'Bollinger bant genişliği',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Chaikin osilatörü',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Coppock eğrisi',
  correlationCoefficientTitle: 'Korelasyon katsayısı',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'Donchian kanalı',
  doubleEmaTitle: 'Çift EMA',
  easeOfMovementTitle: 'Hareket kolaylığı',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Fisher dönüşümü',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: 'Tarihsel volatilite',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Bilgi oranı',
  keltnerChannelIndicatorTitle: 'Keltner kanalı',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'Net hacim',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'Pivot noktası',
  pivotPointHLTitle: 'Pivot noktası HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'Sharpe oranı',
  standardDeviationTitle: 'Standart sapma',
  tripleExponentialAverageTitle: 'Üçlü üssel ortalama',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Hacim osilatörü',
  volumeRateOfChangeTitle: 'Hacim değişim oranı',
  vortexIndicatorTitle: 'Vortex göstergesi',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Williams alligator',
  williamsFractalsTitle: 'Williams fraktalleri',
  williamsPercentRangeTitle: 'Williams %R',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'Özsermaye özeti',
  decisionLongBuyTitle: 'Alış kararları — aylık',
  decisionLongSellTitle: 'Satış kararları — aylık',
  decisionShortBuyTitle: 'Alış kararları — haftalık',
  decisionShortSellTitle: 'Satış kararları — haftalık',
};

const descriptionMap = {
  aroonDescription: 'Aroon yukarı/aşağı',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'John Bollinger volatilite göstergesi',
  chaikinOscillatorDescription: 'Chaikin osilatörü',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Chande momentum osilatörü',
  cmfDescription: 'Chaikin para akışı',
  diNapoliDetrendOscillatorDescription: 'DiNapoli detrend osilatörü',
  diNapoliMacdPredictorDescription: 'DiNapoli MACD tahmincisi',
  diNapoliOscillatorPredictorDescription: 'DiNapoli osilatör tahmincisi',
  doubleEmaDescription: 'Çift EMA',
  easeOfMovementDescription: 'Hareket kolaylığı',
  forwardDescription: 'Forward değeri',
  hashiDescription: 'Heikin-Ashi mum grafiği',
  hl2Description: '(Yüksek + Düşük) / 2',
  hlc3Description: '(Yüksek + Düşük + Kapanış) / 3',
  ichimokuDescription: 'Ichimoku grafiği',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'Momentum göstergesi',
  oc2Description: '(Açılış + Kapanış) / 2',
  ohlc4Description: '(Açılış + Yüksek + Düşük + Kapanış) / 4',
  pivotPointHLDescription: 'Yüksekler ve düşükler',
  plusdiDescription: 'Plus DI',
  rorDescription: 'Getiri oranı',
  tripleExponentialAverageDescription: 'Üçlü üssel ortalama',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Williams yüzde aralığı',
  zigzagDescription: 'Zig Zag göstergesi',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: 'Üst',
  lower: 'Alt',
  middle: 'Orta',
  periods: 'Periyotlar',
  price: 'Fiyat',
  value: 'Değer',
  line: 'Çizgi',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: 'AÇILIŞ fiyatı',
  priceHigh: 'YÜKSEK fiyat',
  priceLow: 'DÜŞÜK fiyat',
  priceClose: 'KAPANIŞ fiyatı',
  priceVolume: 'Hacim',
  method: 'Yöntem',
  displacement: 'Kaydırma',
  distance: 'Mesafe',
  type: 'Tür',
  spread: 'Spread',
  weight: 'Ağırlık',
  multiplier: 'Çarpan',
  shift: 'Kaydırma',
  percent: 'Yüzde',
  probability: 'Olasılık',
  O: 'Açılış',
  H: 'Yüksek',
  L: 'Düşük',
  C: 'Kapanış',
  V: 'Hacim',
  I: 'Açık pozisyon',
  hashiOpen: 'Açılış',
  hashiHigh: 'Yüksek',
  hashiLow: 'Düşük',
  hashiClose: 'Kapanış',
  aSeries: 'A serisi',
  bSeries: 'B serisi',
  cSeries: 'C serisi',
  dSeries: 'D serisi',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon yukarı',
  aroonDown: 'Aroon aşağı',
  envelopeUp: 'Üst envelope',
  envelopeDown: 'Alt envelope',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Turkish translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/tr-TR-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
