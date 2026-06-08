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
    [/Moving Average/g, 'Rata-rata bergerak'],
    [/Simple Moving Average/g, 'Rata-rata bergerak sederhana'],
    [/Exponential Moving Average/g, 'Rata-rata bergerak eksponensial'],
    [/Weighted Moving Average/g, 'Rata-rata bergerak tertimbang'],
    [/Hull Moving Average/g, 'Rata-rata bergerak Hull'],
    [/Displaced Moving Average/g, 'Rata-rata bergerak bergeser'],
    [/Modified Moving Average/g, 'Rata-rata bergerak dimodifikasi'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, 'Osilator stokastik'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, 'Pita Bollinger'],
    [/Bollinger Band/g, 'Pita Bollinger'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'Volatilitas Chaikin'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, 'Tren harga'],
    [/Horizontal Line/g, 'Garis horizontal'],
    [/Horizontal price levels/g, 'Level harga horizontal'],
    [/Trading Time Frame/g, 'Kerangka waktu trading'],
    [/Equity line/g, 'Garis ekuitas'],
    [/Equity summary line/g, 'Garis ringkasan ekuitas'],
    [/Volume/g, 'Volume'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, 'Prakiraan'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'Saluran Donchian'],
    [/Keltner Channel/g, 'Saluran Keltner'],
    [/Standard Deviation/g, 'Deviasi standar'],
    [/Correlation Coefficient/g, 'Koefisien korelasi'],
    [/Sharpe Ratio/g, 'Rasio Sharpe'],
    [/Information Ratio/g, 'Rasio informasi'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'Kemudahan pergerakan'],
    [/Ease of Movement/g, 'Kemudahan pergerakan'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, 'Volatilitas historis'],
    [/Net Volume/g, 'Volume neto'],
    [/Accumulation/g, 'Akumulasi'],
    [/Pivot Point/g, 'Titik pivot'],
    [/Price Levels/g, 'Level harga'],
    [/Williams Fractals/g, 'Fraktal Williams'],
    [/Williams Percent Range/g, 'Rentang persentase Williams'],
    [/Williams Alligator/g, 'Alligator Williams'],
    [/Awesome Oscillator/g, 'Osilator Awesome'],
    [/Fisher Transform/g, 'Transformasi Fisher'],
    [/Vortex Indicator/g, 'Indikator Vortex'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Kurva Coppock'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'Menjumlahkan nilai indikator'],
    [/Measures distance between signals in strategy/g, 'Mengukur jarak antar sinyal dalam strategi'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      'Model keputusan statistik mingguan untuk eksportir — data per jam',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      'Model keputusan statistik mingguan untuk importir — data per jam',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      'Model keputusan statistik bulanan untuk eksportir — data per jam',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      'Model keputusan statistik bulanan untuk importir — data per jam',
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
  bbandTitle: 'Pita Bollinger',
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
  trendTitle: 'Tren harga',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'Kerangka waktu',
  forwardTitle: 'Forward',
  forecastTitle: 'Prakiraan',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'Akumulasi',
  priceLevelsTitle: 'Level harga',
  signalDistanceTitle: 'Jarak sinyal',
  stochasticOscillatorTitle: 'Osilator stokastik',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Osilator Awesome',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: '% pita Bollinger',
  bbandsWidthTitle: 'Lebar pita Bollinger',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Osilator Chaikin',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Kurva Coppock',
  correlationCoefficientTitle: 'Koefisien korelasi',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'Saluran Donchian',
  doubleEmaTitle: 'EMA ganda',
  easeOfMovementTitle: 'Kemudahan pergerakan',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Transformasi Fisher',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: 'Volatilitas historis',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Rasio informasi',
  keltnerChannelIndicatorTitle: 'Saluran Keltner',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'Volume neto',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'Titik pivot',
  pivotPointHLTitle: 'Titik pivot HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'Rasio Sharpe',
  standardDeviationTitle: 'Deviasi standar',
  tripleExponentialAverageTitle: 'Rata-rata eksponensial triple',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Osilator volume',
  volumeRateOfChangeTitle: 'Laju perubahan volume',
  vortexIndicatorTitle: 'Indikator Vortex',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Alligator Williams',
  williamsFractalsTitle: 'Fraktal Williams',
  williamsPercentRangeTitle: '%R Williams',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'Ringkasan ekuitas',
  decisionLongBuyTitle: 'Keputusan beli — bulanan',
  decisionLongSellTitle: 'Keputusan jual — bulanan',
  decisionShortBuyTitle: 'Keputusan beli — mingguan',
  decisionShortSellTitle: 'Keputusan jual — mingguan',
};

const descriptionMap = {
  aroonDescription: 'Aroon naik/turun',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'Indikator volatilitas John Bollinger',
  chaikinOscillatorDescription: 'Osilator Chaikin',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Osilator momentum Chande',
  cmfDescription: 'Arus uang Chaikin',
  diNapoliDetrendOscillatorDescription: 'Osilator detrend DiNapoli',
  diNapoliMacdPredictorDescription: 'Prediktor MACD DiNapoli',
  diNapoliOscillatorPredictorDescription: 'Prediktor osilator DiNapoli',
  doubleEmaDescription: 'EMA ganda',
  easeOfMovementDescription: 'Kemudahan pergerakan',
  forwardDescription: 'Nilai forward',
  hashiDescription: 'Grafik lilin Heikin-Ashi',
  hl2Description: '(Tinggi + Rendah) / 2',
  hlc3Description: '(Tinggi + Rendah + Tutup) / 3',
  ichimokuDescription: 'Grafik Ichimoku',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'Indikator momentum',
  oc2Description: '(Buka + Tutup) / 2',
  ohlc4Description: '(Buka + Tinggi + Rendah + Tutup) / 4',
  pivotPointHLDescription: 'Tertinggi dan terendah',
  plusdiDescription: 'Plus DI',
  rorDescription: 'Tingkat pengembalian',
  tripleExponentialAverageDescription: 'Rata-rata eksponensial triple',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Rentang persentase Williams',
  zigzagDescription: 'Indikator Zig Zag',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: 'Atas',
  lower: 'Bawah',
  middle: 'Tengah',
  periods: 'Periode',
  price: 'Harga',
  value: 'Nilai',
  line: 'Garis',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: 'Harga BUKA',
  priceHigh: 'Harga TINGGI',
  priceLow: 'Harga RENDAH',
  priceClose: 'Harga TUTUP',
  priceVolume: 'Volume',
  method: 'Metode',
  displacement: 'Pergeseran',
  distance: 'Jarak',
  type: 'Tipe',
  spread: 'Spread',
  weight: 'Bobot',
  multiplier: 'Pengali',
  shift: 'Pergeseran',
  percent: 'Persentase',
  probability: 'Probabilitas',
  O: 'Buka',
  H: 'Tinggi',
  L: 'Rendah',
  C: 'Tutup',
  V: 'Volume',
  I: 'Open interest',
  hashiOpen: 'Buka',
  hashiHigh: 'Tinggi',
  hashiLow: 'Rendah',
  hashiClose: 'Tutup',
  aSeries: 'Seri A',
  bSeries: 'Seri B',
  cSeries: 'Seri C',
  dSeries: 'Seri D',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon naik',
  aroonDown: 'Aroon turun',
  envelopeUp: 'Envelope atas',
  envelopeDown: 'Envelope bawah',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Indonesian translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/id-ID-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
