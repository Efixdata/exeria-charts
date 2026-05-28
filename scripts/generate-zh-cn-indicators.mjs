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
    [/Moving Average/g, '移动平均线'],
    [/Simple Moving Average/g, '简单移动平均线'],
    [/Exponential Moving Average/g, '指数移动平均线'],
    [/Weighted Moving Average/g, '加权移动平均线'],
    [/Hull Moving Average/g, 'Hull 移动平均线'],
    [/Displaced Moving Average/g, '位移移动平均线'],
    [/Modified Moving Average/g, '修正移动平均线'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, '随机振荡器'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, '布林带'],
    [/Bollinger Band/g, '布林带'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, '蔡金波动率'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, '价格趋势'],
    [/Horizontal Line/g, '水平线'],
    [/Horizontal price levels/g, '水平价格位'],
    [/Trading Time Frame/g, '交易时间框架'],
    [/Equity line/g, '权益曲线'],
    [/Equity summary line/g, '权益汇总线'],
    [/Volume/g, '成交量'],
    [/Momentum/g, '动量'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, '预测'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, '唐奇安通道'],
    [/Keltner Channel/g, '肯特纳通道'],
    [/Standard Deviation/g, '标准差'],
    [/Correlation Coefficient/g, '相关系数'],
    [/Sharpe Ratio/g, '夏普比率'],
    [/Information Ratio/g, '信息比率'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, '简易波动指标'],
    [/Ease of Movement/g, '简易波动指标'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, '历史波动率'],
    [/Net Volume/g, '净成交量'],
    [/Accumulation/g, '累积'],
    [/Pivot Point/g, '枢轴点'],
    [/Price Levels/g, '价格位'],
    [/Williams Fractals/g, 'Williams 分形'],
    [/Williams Percent Range/g, 'Williams %R'],
    [/Williams Alligator/g, 'Williams 鳄鱼线'],
    [/Awesome Oscillator/g, 'Awesome 振荡器'],
    [/Fisher Transform/g, 'Fisher 变换'],
    [/Vortex Indicator/g, 'Vortex 指标'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Coppock 曲线'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, '汇总指标数值'],
    [/Measures distance between signals in strategy/g, '测量策略中信号之间的距离'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      '出口商统计周决策模型 — 小时数据',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      '进口商统计周决策模型 — 小时数据',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      '出口商统计月决策模型 — 小时数据',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      '进口商统计月决策模型 — 小时数据',
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
  bbandTitle: '布林带',
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
  trendTitle: '价格趋势',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: '时间框架',
  forwardTitle: 'Forward',
  forecastTitle: '预测',
  varbandsTitle: 'Varbands',
  accumulationTitle: '累积',
  priceLevelsTitle: '价格位',
  signalDistanceTitle: '信号距离',
  stochasticOscillatorTitle: '随机振荡器',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: '动量',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'Awesome 振荡器',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: '布林带 %',
  bbandsWidthTitle: '布林带宽度',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: '蔡金振荡器',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Coppock 曲线',
  correlationCoefficientTitle: '相关系数',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: '唐奇安通道',
  doubleEmaTitle: '双 EMA',
  easeOfMovementTitle: '简易波动指标',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Fisher 变换',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: '历史波动率',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: '信息比率',
  keltnerChannelIndicatorTitle: '肯特纳通道',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: '净成交量',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: '枢轴点',
  pivotPointHLTitle: '枢轴点 HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: '夏普比率',
  standardDeviationTitle: '标准差',
  tripleExponentialAverageTitle: '三重指数移动平均',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: '成交量振荡器',
  volumeRateOfChangeTitle: '成交量变化率',
  vortexIndicatorTitle: 'Vortex 指标',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Williams 鳄鱼线',
  williamsFractalsTitle: 'Williams 分形',
  williamsPercentRangeTitle: 'Williams %R',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: '权益汇总',
  decisionLongBuyTitle: '买入决策 — 月度',
  decisionLongSellTitle: '卖出决策 — 月度',
  decisionShortBuyTitle: '买入决策 — 周度',
  decisionShortSellTitle: '卖出决策 — 周度',
};

const descriptionMap = {
  aroonDescription: 'Aroon 上/下',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'John Bollinger 波动率指标',
  chaikinOscillatorDescription: '蔡金振荡器',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Chande 动量振荡器',
  cmfDescription: '蔡金资金流',
  diNapoliDetrendOscillatorDescription: 'DiNapoli detrend 振荡器',
  diNapoliMacdPredictorDescription: 'DiNapoli MACD 预测器',
  diNapoliOscillatorPredictorDescription: 'DiNapoli 振荡器预测器',
  doubleEmaDescription: '双 EMA',
  easeOfMovementDescription: '简易波动指标',
  forwardDescription: 'Forward 值',
  hashiDescription: 'Heikin-Ashi K线图',
  hl2Description: '(最高 + 最低) / 2',
  hlc3Description: '(最高 + 最低 + 收盘) / 3',
  ichimokuDescription: 'Ichimoku 图表',
  minusdiDescription: 'Minus DI',
  momentumDescription: '动量指标',
  oc2Description: '(开盘 + 收盘) / 2',
  ohlc4Description: '(开盘 + 最高 + 最低 + 收盘) / 4',
  pivotPointHLDescription: '最高与最低',
  plusdiDescription: 'Plus DI',
  rorDescription: '回报率',
  tripleExponentialAverageDescription: '三重指数移动平均',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Williams %R',
  zigzagDescription: 'Zig Zag 指标',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: '上轨',
  lower: '下轨',
  middle: '中轨',
  periods: '周期',
  price: '价格',
  value: '数值',
  line: '线',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: '开盘价',
  priceHigh: '最高价',
  priceLow: '最低价',
  priceClose: '收盘价',
  priceVolume: '成交量',
  method: '方法',
  displacement: '位移',
  distance: '距离',
  type: '类型',
  spread: 'Spread',
  weight: '权重',
  multiplier: '乘数',
  shift: '位移',
  percent: '百分比',
  probability: '概率',
  O: '开盘',
  H: '最高',
  L: '最低',
  C: '收盘',
  V: '成交量',
  I: '未平仓合约',
  hashiOpen: '开盘',
  hashiHigh: '最高',
  hashiLow: '最低',
  hashiClose: '收盘',
  aSeries: 'A 系列',
  bSeries: 'B 系列',
  cSeries: 'C 系列',
  dSeries: 'D 系列',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon 上升',
  aroonDown: 'Aroon 下降',
  envelopeUp: '上轨 envelope',
  envelopeDown: '下轨 envelope',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Simplified Chinese translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/zh-CN-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
