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
    [/Moving Average/g, '移動平均'],
    [/Simple Moving Average/g, '単純移動平均'],
    [/Exponential Moving Average/g, '指数移動平均'],
    [/Weighted Moving Average/g, '加重移動平均'],
    [/Hull Moving Average/g, 'Hull 移動平均'],
    [/Displaced Moving Average/g, '位移移動平均'],
    [/Modified Moving Average/g, '修正移動平均'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, 'ストキャスティクス'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, 'ボリンジャーバンド'],
    [/Bollinger Band/g, 'ボリンジャーバンド'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'チャイキン・ボラティリティ'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, '価格トレンド'],
    [/Horizontal Line/g, '水平線'],
    [/Horizontal price levels/g, '水平価格レベル'],
    [/Trading Time Frame/g, '取引時間枠'],
    [/Equity line/g, 'エクイティライン'],
    [/Equity summary line/g, 'エクイティ概要ライン'],
    [/Volume/g, '出来高'],
    [/Momentum/g, 'モメンタム'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, '予測'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'ドンチャンチャネル'],
    [/Keltner Channel/g, 'ケルトナーチャネル'],
    [/Standard Deviation/g, '標準偏差'],
    [/Correlation Coefficient/g, '相関係数'],
    [/Sharpe Ratio/g, 'シャープレシオ'],
    [/Information Ratio/g, 'インフォメーションレシオ'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, 'イーズ・オブ・ムーブメント'],
    [/Ease of Movement/g, 'イーズ・オブ・ムーブメント'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, '歴史的ボラティリティ'],
    [/Net Volume/g, 'ネット出来高'],
    [/Accumulation/g, '蓄積'],
    [/Pivot Point/g, 'ピボットポイント'],
    [/Price Levels/g, '価格レベル'],
    [/Williams Fractals/g, 'Williams フラクタル'],
    [/Williams Percent Range/g, 'Williams %R'],
    [/Williams Alligator/g, 'Williams アリゲーター'],
    [/Awesome Oscillator/g, 'オーサムオシレーター'],
    [/Fisher Transform/g, 'Fisher 変換'],
    [/Vortex Indicator/g, 'Vortex インジケーター'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Coppock カーブ'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, 'インジケーターの値を合計'],
    [/Measures distance between signals in strategy/g, 'ストラテジー内のシグナル間距離を測定'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      '輸出者向け統計週次意思決定モデル — 時間足データ',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      '輸入者向け統計週次意思決定モデル — 時間足データ',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      '輸出者向け統計月次意思決定モデル — 時間足データ',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      '輸入者向け統計月次意思決定モデル — 時間足データ',
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
  bbandTitle: 'ボリンジャーバンド',
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
  trendTitle: '価格トレンド',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: '時間枠',
  forwardTitle: 'Forward',
  forecastTitle: '予測',
  varbandsTitle: 'Varbands',
  accumulationTitle: '蓄積',
  priceLevelsTitle: '価格レベル',
  signalDistanceTitle: 'シグナル距離',
  stochasticOscillatorTitle: 'ストキャスティクス',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: 'モメンタム',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: 'オーサムオシレーター',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: 'ボリンジャーバンド %',
  bbandsWidthTitle: 'ボリンジャーバンド幅',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'チャイキンオシレーター',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Coppock カーブ',
  correlationCoefficientTitle: '相関係数',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'ドンチャンチャネル',
  doubleEmaTitle: 'ダブル EMA',
  easeOfMovementTitle: 'イーズ・オブ・ムーブメント',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Fisher 変換',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: '歴史的ボラティリティ',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: 'インフォメーションレシオ',
  keltnerChannelIndicatorTitle: 'ケルトナーチャネル',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: 'ネット出来高',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: 'ピボットポイント',
  pivotPointHLTitle: 'ピボットポイント HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: 'シャープレシオ',
  standardDeviationTitle: '標準偏差',
  tripleExponentialAverageTitle: '三重指数移動平均',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: '出来高オシレーター',
  volumeRateOfChangeTitle: '出来高変化率',
  vortexIndicatorTitle: 'Vortex インジケーター',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Williams アリゲーター',
  williamsFractalsTitle: 'Williams フラクタル',
  williamsPercentRangeTitle: 'Williams %R',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: 'エクイティ概要',
  decisionLongBuyTitle: '買い判断 — 月次',
  decisionLongSellTitle: '売り判断 — 月次',
  decisionShortBuyTitle: '買い判断 — 週次',
  decisionShortSellTitle: '売り判断 — 週次',
};

const descriptionMap = {
  aroonDescription: 'Aroon 上/下',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'John Bollinger ボラティリティ指標',
  chaikinOscillatorDescription: 'チャイキンオシレーター',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Chande モメンタムオシレーター',
  cmfDescription: 'チャイキン・マネーフロー',
  diNapoliDetrendOscillatorDescription: 'DiNapoli detrend オシレーター',
  diNapoliMacdPredictorDescription: 'DiNapoli MACD 予測器',
  diNapoliOscillatorPredictorDescription: 'DiNapoli オシレーター予測器',
  doubleEmaDescription: 'ダブル EMA',
  easeOfMovementDescription: 'イーズ・オブ・ムーブメント',
  forwardDescription: 'Forward 値',
  hashiDescription: 'Heikin-Ashi ローソク足チャート',
  hl2Description: '(高値 + 安値) / 2',
  hlc3Description: '(高値 + 安値 + 終値) / 3',
  ichimokuDescription: 'Ichimoku チャート',
  minusdiDescription: 'Minus DI',
  momentumDescription: 'モメンタム指標',
  oc2Description: '(始値 + 終値) / 2',
  ohlc4Description: '(始値 + 高値 + 安値 + 終値) / 4',
  pivotPointHLDescription: '高値と安値',
  plusdiDescription: 'Plus DI',
  rorDescription: 'リターン率',
  tripleExponentialAverageDescription: '三重指数移動平均',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Williams %R',
  zigzagDescription: 'Zig Zag 指標',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: '上限',
  lower: '下限',
  middle: '中央',
  periods: '期間',
  price: '価格',
  value: '値',
  line: 'ライン',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: '始値',
  priceHigh: '高値',
  priceLow: '安値',
  priceClose: '終値',
  priceVolume: '出来高',
  method: '方法',
  displacement: '位移',
  distance: '距離',
  type: 'タイプ',
  spread: 'Spread',
  weight: '重み',
  multiplier: '乗数',
  shift: 'シフト',
  percent: '割合',
  probability: '確率',
  O: '始値',
  H: '高値',
  L: '安値',
  C: '終値',
  V: '出来高',
  I: '建玉',
  hashiOpen: '始値',
  hashiHigh: '高値',
  hashiLow: '安値',
  hashiClose: '終値',
  aSeries: 'A 系列',
  bSeries: 'B 系列',
  cSeries: 'C 系列',
  dSeries: 'D 系列',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon 上昇',
  aroonDown: 'Aroon 下降',
  envelopeUp: '上限 envelope',
  envelopeDown: '下限 envelope',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Japanese translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/ja-JP-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
