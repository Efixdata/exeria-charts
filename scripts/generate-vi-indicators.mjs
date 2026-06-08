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
    [/Moving Average/g, 'Trung bình động'],
    [/Simple Moving Average/g, 'Trung bình động đơn giản'],
    [/Exponential Moving Average/g, 'Trung bình động hàm mũ'],
    [/Weighted Moving Average/g, 'Trung bình động có trọng số'],
    [/Hull Moving Average/g, 'Trung bình động Hull'],
    [/Displaced Moving Average/g, 'Trung bình động dịch chuyển'],
    [/Modified Moving Average/g, 'Trung bình động sửa đổi'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, 'Dao động ngẫu nhiên'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, 'Dải Bollinger'],
    [/Bollinger Band/g, 'Dải Bollinger'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'Biến động Chaikin'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, 'Xu hướng giá'],
    [/Horizontal Line/g, 'Đường ngang'],
    [/Horizontal price levels/g, 'Mức giá ngang'],
    [/Trading Time Frame/g, 'Khung thời gian giao dịch'],
    [/Equity line/g, 'Đường vốn'],
    [/Equity summary line/g, 'Đường tóm tắt vốn'],
    [/Volume/g, 'Khối lượng'],
    [/Momentum/g, 'Momentum'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, 'Dự báo'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'Kênh Donchian'],
    [/Keltner Channel/g, 'Kênh Keltner'],
    [/Standard Deviation/g, 'Độ lệch chuẩn'],
    [/Correlation Coefficient/g, 'Hệ số tương quan'],
    [/Sharpe Ratio/g, 'Tỷ lệ Sharpe'],
    [/Information Ratio/g, 'Tỷ lệ thông tin'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'Ease of Movement'],
    [/Ease of Movement/g, 'Ease of Movement'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, 'Biến động lịch sử'],
    [/Net Volume/g, 'Khối lượng ròng'],
    [/Accumulation/g, 'Tích lũy'],
    [/Pivot Point/g, 'Điểm pivot'],
    [/Price Levels/g, 'Mức giá'],
    [/Williams Fractals/g, 'Fractal Williams'],
    [/Williams Percent Range/g, 'Williams %R'],
    [/Williams Alligator/g, 'Williams Alligator'],
    [/Awesome Oscillator/g, 'Awesome Oscillator'],
    [/Fisher Transform/g, 'Biến đổi Fisher'],
    [/Vortex Indicator/g, 'Chỉ báo Vortex'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Đường cong Coppock'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'Tổng hợp giá trị chỉ báo'],
    [/Measures distance between signals in strategy/g, 'Đo khoảng cách giữa tín hiệu trong chiến lược'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      'Mô hình quyết định thống kê hàng tuần cho nhà xuất khẩu — dữ liệu theo giờ',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      'Mô hình quyết định thống kê hàng tuần cho nhà nhập khẩu — dữ liệu theo giờ',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      'Mô hình quyết định thống kê hàng tháng cho nhà xuất khẩu — dữ liệu theo giờ',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      'Mô hình quyết định thống kê hàng tháng cho nhà nhập khẩu — dữ liệu theo giờ',
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
  bbandTitle: 'Dải Bollinger',
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
  trendTitle: 'Xu hướng giá',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: 'Khung thời gian',
  forwardTitle: 'Forward',
  forecastTitle: 'Dự báo',
  varbandsTitle: 'Varbands',
  accumulationTitle: 'Tích lũy',
  priceLevelsTitle: 'Mức giá',
  signalDistanceTitle: 'Khoảng cách tín hiệu',
  stochasticOscillatorTitle: 'Dao động ngẫu nhiên',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: 'Momentum',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Awesome Oscillator',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: '% dải Bollinger',
  bbandsWidthTitle: 'Độ rộng dải Bollinger',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Dao động Chaikin',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Đường cong Coppock',
  correlationCoefficientTitle: 'Hệ số tương quan',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'Kênh Donchian',
  doubleEmaTitle: 'EMA kép',
  easeOfMovementTitle: 'Ease of Movement',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Biến đổi Fisher',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: 'Biến động lịch sử',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'Tỷ lệ thông tin',
  keltnerChannelIndicatorTitle: 'Kênh Keltner',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'Khối lượng ròng',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'Điểm pivot',
  pivotPointHLTitle: 'Điểm pivot HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'Tỷ lệ Sharpe',
  standardDeviationTitle: 'Độ lệch chuẩn',
  tripleExponentialAverageTitle: 'Trung bình hàm mũ ba lần',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: 'Dao động khối lượng',
  volumeRateOfChangeTitle: 'Tỷ lệ thay đổi khối lượng',
  vortexIndicatorTitle: 'Chỉ báo Vortex',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Williams Alligator',
  williamsFractalsTitle: 'Fractal Williams',
  williamsPercentRangeTitle: 'Williams %R',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'Tóm tắt vốn',
  decisionLongBuyTitle: 'Quyết định mua — hàng tháng',
  decisionLongSellTitle: 'Quyết định bán — hàng tháng',
  decisionShortBuyTitle: 'Quyết định mua — hàng tuần',
  decisionShortSellTitle: 'Quyết định bán — hàng tuần',
};

const descriptionMap = {
  aroonDescription: 'Aroon lên/xuống',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'Chỉ báo biến động John Bollinger',
  chaikinOscillatorDescription: 'Dao động Chaikin',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Dao động momentum Chande',
  cmfDescription: 'Dòng tiền Chaikin',
  diNapoliDetrendOscillatorDescription: 'Dao động detrend DiNapoli',
  diNapoliMacdPredictorDescription: 'Dự báo MACD DiNapoli',
  diNapoliOscillatorPredictorDescription: 'Dự báo dao động DiNapoli',
  doubleEmaDescription: 'EMA kép',
  easeOfMovementDescription: 'Ease of Movement',
  forwardDescription: 'Giá trị forward',
  hashiDescription: 'Biểu đồ nến Heikin-Ashi',
  hl2Description: '(Cao + Thấp) / 2',
  hlc3Description: '(Cao + Thấp + Đóng) / 3',
  ichimokuDescription: 'Biểu đồ Ichimoku',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'Chỉ báo momentum',
  oc2Description: '(Mở + Đóng) / 2',
  ohlc4Description: '(Mở + Cao + Thấp + Đóng) / 4',
  pivotPointHLDescription: 'Cao và thấp',
  plusdiDescription: 'Plus DI',
  rorDescription: 'Tỷ suất lợi nhuận',
  tripleExponentialAverageDescription: 'Trung bình hàm mũ ba lần',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Williams %R',
  zigzagDescription: 'Chỉ báo Zig Zag',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: 'Trên',
  lower: 'Dưới',
  middle: 'Giữa',
  periods: 'Chu kỳ',
  price: 'Giá',
  value: 'Giá trị',
  line: 'Đường',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: 'Giá MỞ',
  priceHigh: 'Giá CAO',
  priceLow: 'Giá THẤP',
  priceClose: 'Giá ĐÓNG',
  priceVolume: 'Khối lượng',
  method: 'Phương pháp',
  displacement: 'Dịch chuyển',
  distance: 'Khoảng cách',
  type: 'Loại',
  spread: 'Spread',
  weight: 'Trọng số',
  multiplier: 'Hệ số',
  shift: 'Dịch chuyển',
  percent: 'Phần trăm',
  probability: 'Xác suất',
  O: 'Mở',
  H: 'Cao',
  L: 'Thấp',
  C: 'Đóng',
  V: 'Khối lượng',
  I: 'Hợp đồng mở',
  hashiOpen: 'Mở',
  hashiHigh: 'Cao',
  hashiLow: 'Thấp',
  hashiClose: 'Đóng',
  aSeries: 'Chuỗi A',
  bSeries: 'Chuỗi B',
  cSeries: 'Chuỗi C',
  dSeries: 'Chuỗi D',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon lên',
  aroonDown: 'Aroon xuống',
  envelopeUp: 'Envelope trên',
  envelopeDown: 'Envelope dưới',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Vietnamese translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/vi-VN-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
