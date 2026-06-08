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
    [/Moving Average/g, 'ค่าเฉลี่ยเคลื่อนที่'],
    [/Simple Moving Average/g, 'ค่าเฉลี่ยเคลื่อนที่แบบง่าย'],
    [/Exponential Moving Average/g, 'ค่าเฉลี่ยเคลื่อนที่แบบ exponential'],
    [/Weighted Moving Average/g, 'ค่าเฉลี่ยเคลื่อนที่ถ่วงน้ำหนัก'],
    [/Hull Moving Average/g, 'ค่าเฉลี่ยเคลื่อนที่ Hull'],
    [/Displaced Moving Average/g, 'ค่าเฉลี่ยเคลื่อนที่เลื่อน'],
    [/Modified Moving Average/g, 'ค่าเฉลี่ยเคลื่อนที่ดัดแปลง'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, 'Stochastic Oscillator'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, 'Bollinger Bands'],
    [/Bollinger Band/g, 'Bollinger Band'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'ความผันผวน Chaikin'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, 'แนวโน้มราคา'],
    [/Horizontal Line/g, 'เส้นแนวนอน'],
    [/Horizontal price levels/g, 'ระดับราคาแนวนอน'],
    [/Trading Time Frame/g, 'กรอบเวลาการเทรด'],
    [/Equity line/g, 'เส้น equity'],
    [/Equity summary line/g, 'เส้นสรุป equity'],
    [/Volume/g, 'ปริมาณ'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, 'พยากรณ์'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'ช่อง Donchian'],
    [/Keltner Channel/g, 'ช่อง Keltner'],
    [/Standard Deviation/g, 'ส่วนเบี่ยงเบนมาตรฐาน'],
    [/Correlation Coefficient/g, 'สัมประสิทธิ์สหสัมพันธ์'],
    [/Sharpe Ratio/g, 'Sharpe Ratio'],
    [/Information Ratio/g, 'Information Ratio'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'Ease of Movement'],
    [/Ease of Movement/g, 'Ease of Movement'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, 'ความผันผวนทางประวัติ'],
    [/Net Volume/g, 'ปริมาณสุทธิ'],
    [/Accumulation/g, 'การสะสม'],
    [/Pivot Point/g, 'จุด pivot'],
    [/Price Levels/g, 'ระดับราคา'],
    [/Williams Fractals/g, 'Williams Fractals'],
    [/Williams Percent Range/g, 'Williams %R'],
    [/Williams Alligator/g, 'Williams Alligator'],
    [/Awesome Oscillator/g, 'Awesome Oscillator'],
    [/Fisher Transform/g, 'Fisher Transform'],
    [/Vortex Indicator/g, 'ตัวชี้วัด Vortex'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Coppock Curve'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'รวมค่าของตัวชี้วัด'],
    [/Measures distance between signals in strategy/g, 'วัดระยะห่างระหว่างสัญญาณในกลยุทธ์'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      'โมเดลตัดสินใจรายสัปดาห์เชิงสถิติสำหรับผู้ส่งออก — ข้อมูลรายชั่วโมง',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      'โมเดลตัดสินใจรายสัปดาห์เชิงสถิติสำหรับผู้นำเข้า — ข้อมูลรายชั่วโมง',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      'โมเดลตัดสินใจรายเดือนเชิงสถิติสำหรับผู้ส่งออก — ข้อมูลรายชั่วโมง',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      'โมเดลตัดสินใจรายเดือนเชิงสถิติสำหรับผู้นำเข้า — ข้อมูลรายชั่วโมง',
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
  bbandTitle: 'Bollinger Bands',
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
  trendTitle: 'แนวโน้มราคา',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'กรอบเวลา',
  forwardTitle: 'Forward',
  forecastTitle: 'พยากรณ์',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'การสะสม',
  priceLevelsTitle: 'ระดับราคา',
  signalDistanceTitle: 'ระยะห่างสัญญาณ',
  stochasticOscillatorTitle: 'Stochastic Oscillator',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Awesome Oscillator',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: '% Bollinger Bands',
  bbandsWidthTitle: 'ความกว้าง Bollinger Bands',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Chaikin Oscillator',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Coppock Curve',
  correlationCoefficientTitle: 'สัมประสิทธิ์สหสัมพันธ์',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'ช่อง Donchian',
  doubleEmaTitle: 'EMA คู่',
  easeOfMovementTitle: 'Ease of Movement',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Fisher Transform',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: 'ความผันผวนทางประวัติ',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Information Ratio',
  keltnerChannelIndicatorTitle: 'ช่อง Keltner',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'ปริมาณสุทธิ',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'จุด pivot',
  pivotPointHLTitle: 'จุด pivot HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'Sharpe Ratio',
  standardDeviationTitle: 'ส่วนเบี่ยงเบนมาตรฐาน',
  tripleExponentialAverageTitle: 'ค่าเฉลี่ย exponential สามชั้น',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Volume Oscillator',
  volumeRateOfChangeTitle: 'อัตราการเปลี่ยนแปลงปริมาณ',
  vortexIndicatorTitle: 'ตัวชี้วัด Vortex',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Williams Alligator',
  williamsFractalsTitle: 'Williams Fractals',
  williamsPercentRangeTitle: 'Williams %R',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'สรุป equity',
  decisionLongBuyTitle: 'การตัดสินใจซื้อ — รายเดือน',
  decisionLongSellTitle: 'การตัดสินใจขาย — รายเดือน',
  decisionShortBuyTitle: 'การตัดสินใจซื้อ — รายสัปดาห์',
  decisionShortSellTitle: 'การตัดสินใจขาย — รายสัปดาห์',
};

const descriptionMap = {
  aroonDescription: 'Aroon ขึ้น/ลง',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'ตัวชี้วัดความผันผวน John Bollinger',
  chaikinOscillatorDescription: 'Chaikin Oscillator',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Chande Momentum Oscillator',
  cmfDescription: 'Chaikin Money Flow',
  diNapoliDetrendOscillatorDescription: 'DiNapoli Detrend Oscillator',
  diNapoliMacdPredictorDescription: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorDescription: 'DiNapoli Oscillator Predictor',
  doubleEmaDescription: 'EMA คู่',
  easeOfMovementDescription: 'Ease of Movement',
  forwardDescription: 'ค่า forward',
  hashiDescription: 'กราฟแท่งเทียน Heikin-Ashi',
  hl2Description: '(สูง + ต่ำ) / 2',
  hlc3Description: '(สูง + ต่ำ + ปิด) / 3',
  ichimokuDescription: 'กราฟ Ichimoku',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'ตัวชี้วัด momentum',
  oc2Description: '(เปิด + ปิด) / 2',
  ohlc4Description: '(เปิด + สูง + ต่ำ + ปิด) / 4',
  pivotPointHLDescription: 'สูงและต่ำ',
  plusdiDescription: 'Plus DI',
  rorDescription: 'อัตราผลตอบแทน',
  tripleExponentialAverageDescription: 'ค่าเฉลี่ย exponential สามชั้น',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Williams %R',
  zigzagDescription: 'ตัวชี้วัด Zig Zag',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: 'บน',
  lower: 'ล่าง',
  middle: 'กลาง',
  periods: 'ช่วงเวลา',
  price: 'ราคา',
  value: 'ค่า',
  line: 'เส้น',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: 'ราคาเปิด',
  priceHigh: 'ราคาสูง',
  priceLow: 'ราคาต่ำ',
  priceClose: 'ราคาปิด',
  priceVolume: 'ปริมาณ',
  method: 'วิธี',
  displacement: 'การเลื่อน',
  distance: 'ระยะทาง',
  type: 'ประเภท',
  spread: 'Spread',
  weight: 'น้ำหนัก',
  multiplier: 'ตัวคูณ',
  shift: 'เลื่อน',
  percent: 'เปอร์เซ็นต์',
  probability: 'ความน่าจะเป็น',
  O: 'เปิด',
  H: 'สูง',
  L: 'ต่ำ',
  C: 'ปิด',
  V: 'ปริมาณ',
  I: 'Open interest',
  hashiOpen: 'เปิด',
  hashiHigh: 'สูง',
  hashiLow: 'ต่ำ',
  hashiClose: 'ปิด',
  aSeries: 'ชุด A',
  bSeries: 'ชุด B',
  cSeries: 'ชุด C',
  dSeries: 'ชุด D',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon ขึ้น',
  aroonDown: 'Aroon ลง',
  envelopeUp: 'Envelope บน',
  envelopeDown: 'Envelope ล่าง',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Thai translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/th-TH-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
