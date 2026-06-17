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
    [/Moving Average/g, '이동평균'],
    [/Simple Moving Average/g, '단순 이동평균'],
    [/Exponential Moving Average/g, '지수 이동평균'],
    [/Weighted Moving Average/g, '가중 이동평균'],
    [/Hull Moving Average/g, 'Hull 이동평균'],
    [/Displaced Moving Average/g, '이동 이동평균'],
    [/Modified Moving Average/g, '수정 이동평균'],
    [/Average True Range/g, 'Average True Range'],
    [/Average Directional Index/g, 'Average Directional Index'],
    [/Relative Strength Index/g, 'Relative Strength Index'],
    [/Rate Of Change/g, 'Rate of Change'],
    [/Open Interest/g, 'Open Interest'],
    [/On Balance Volume/g, 'On Balance Volume'],
    [/Accumulation Distribution/g, 'Accumulation/Distribution'],
    [/Commodity Channel Index/g, 'Commodity Channel Index'],
    [/Parabolic SAR/g, 'Parabolic SAR'],
    [/Stochastic Oscillator/g, '스토캐스틱 오실레이터'],
    [/Stochastic Momentum Index/g, 'Stochastic Momentum Index'],
    [/Ultimate Oscillator/g, 'Ultimate Oscillator'],
    [/Bollinger Bands/g, '볼린저 밴드'],
    [/Bollinger Band/g, '볼린저 밴드'],
    [/Chandelier Exit/g, 'Chandelier Exit'],
    [/Chaikin's Volatility/gi, 'Chaikin 변동성'],
    [/Directional Movement/g, 'Directional Movement'],
    [/Price Trend/g, '가격 추세'],
    [/Horizontal Line/g, '수평선'],
    [/Horizontal price levels/g, '수평 가격 레벨'],
    [/Trading Time Frame/g, '트레이딩 타임프레임'],
    [/Equity line/g, '자본 곡선'],
    [/Equity summary line/g, '자본 요약선'],
    [/Volume/g, '거래량'],
    [/Momentum/g, '모멘텀'],
    [/Envelope/g, 'Envelope'],
    [/Forecast/g, '예측'],
    [/Forward/g, 'Forward'],
    [/Ichimoku/g, 'Ichimoku'],
    [/Heikin-Ashi/g, 'Heikin-Ashi'],
    [/Detrended Price Oscillator/g, 'Detrended Price Oscillator'],
    [/Donchian Channel/g, 'Donchian 채널'],
    [/Keltner Channel/g, 'Keltner 채널'],
    [/Standard Deviation/g, '표준편차'],
    [/Correlation Coefficient/g, '상관계수'],
    [/Sharpe Ratio/g, '샤프 비율'],
    [/Information Ratio/g, '정보비율'],
    [/Force Index/g, 'Force Index'],
    [/Ease Of Movement/g, '이동 용이성'],
    [/Ease of Movement/g, '이동 용이성'],
    [/Mass Index/g, 'Mass Index'],
    [/Choppiness Index/g, 'Choppiness Index'],
    [/Historical Volatility/g, '역사적 변동성'],
    [/Net Volume/g, '순 거래량'],
    [/Accumulation/g, '누적'],
    [/Pivot Point/g, '피벗 포인트'],
    [/Price Levels/g, '가격 레벨'],
    [/Williams Fractals/g, 'Williams 프랙탈'],
    [/Williams Percent Range/g, 'Williams %R'],
    [/Williams Alligator/g, 'Williams 앨리게이터'],
    [/Awesome Oscillator/g, '어썸 오실레이터'],
    [/Fisher Transform/g, 'Fisher 변환'],
    [/Vortex Indicator/g, 'Vortex 지표'],
    [/Balance Of Power/g, 'Balance of Power'],
    [/Connors RSI/g, 'Connors RSI'],
    [/Coppock Curve/g, 'Coppock 곡선'],
    [/Zig Zag/g, 'Zig Zag'],
    [/Sums up values of an indicator/g, '지표 값을 합산'],
    [/Measures distance between signals in strategy/g, '전략의 신호 간 거리 측정'],
    [
      /Statistical weekly decision model for exporter - hourly data/g,
      '수출자용 통계적 주간 의사결정 모델 — 시간별 데이터',
    ],
    [
      /Statistical weekly decision model for importer - hourly data/g,
      '수입자용 통계적 주간 의사결정 모델 — 시간별 데이터',
    ],
    [
      /Statistical monthly decision model for exporter - hourly data/g,
      '수출자용 통계적 월간 의사결정 모델 — 시간별 데이터',
    ],
    [
      /Statistical monthly decision model for importer - hourly data/g,
      '수입자용 통계적 월간 의사결정 모델 — 시간별 데이터',
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
  bbandTitle: '볼린저 밴드',
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
  trendTitle: '가격 추세',
  hashiTitle: 'Heikin-Ashi',
  ichimokuTitle: 'Ichimoku',
  equityTitle: 'Equity',
  adlTitle: 'ADL',
  cmfTitle: 'CMF',
  ttfTitle: '타임프레임',
  forwardTitle: 'Forward',
  forecastTitle: '예측',
  varbandsTitle: 'Varbands',
  accumulationTitle: '누적',
  priceLevelsTitle: '가격 레벨',
  signalDistanceTitle: '신호 거리',
  stochasticOscillatorTitle: '스토캐스틱 오실레이터',
  ultimateOscillatorTitle: 'Ultimate Oscillator',
  envelopeTitle: 'Envelope',
  momentumTitle: '모멘텀',
  almaTitle: 'ALMA',
  aroonTitle: 'Aroon',
  awesomeOscillatorTitle: '어썸 오실레이터',
  balanceOfPowerTitle: 'Balance of Power',
  bbandsPercentTitle: '볼린저 밴드 %',
  bbandsWidthTitle: '볼린저 밴드 폭',
  chandeKrollStopTitle: 'Chande Kroll Stop',
  chandeMomentumOscillatorTitle: 'Chande Momentum Oscillator',
  chaikinOscillatorTitle: 'Chaikin 오실레이터',
  choppinessIndexTitle: 'Choppiness Index',
  connorsRsiTitle: 'Connors RSI',
  coppockCurveTitle: 'Coppock 곡선',
  correlationCoefficientTitle: '상관계수',
  diNapoli3x3Title: 'DiNapoli 3x3',
  diNapoliDetrendOscillatorTitle: 'DiNapoli Detrend Oscillator',
  diNapoliMacdTitle: 'DiNapoli MACD',
  diNapoliMacdPredictorTitle: 'DiNapoli MACD Predictor',
  diNapoliOscillatorPredictorTitle: 'DiNapoli Oscillator Predictor',
  diNapoliPreferredStochasticTitle: 'DiNapoli Preferred Stochastic',
  donchianChannelTitle: 'Donchian 채널',
  doubleEmaTitle: '이중 EMA',
  easeOfMovementTitle: '이동 용이성',
  eldersForceIndexTitle: 'Elders Force Index',
  fisherTransformTitle: 'Fisher 변환',
  forceIndexTitle: 'Force Index',
  historicalVolatilityTitle: '역사적 변동성',
  hl2Title: 'HL2',
  hlc3Title: 'HLC3',
  ohlc4Title: 'OHLC4',
  oc2Title: 'OC2',
  informationRatioTitle: '정보비율',
  keltnerChannelIndicatorTitle: 'Keltner 채널',
  massIndexTitle: 'Mass Index',
  netVolumeTitle: '순 거래량',
  nviTitle: 'NVI',
  pviTitle: 'PVI',
  pivotPointTitle: '피벗 포인트',
  pivotPointHLTitle: '피벗 포인트 HL',
  rorTitle: 'ROR',
  sharpeRatioTitle: '샤프 비율',
  standardDeviationTitle: '표준편차',
  tripleExponentialAverageTitle: '삼중 지수 이동평균',
  tsiTitle: 'TSI',
  volumeOscillatorTitle: '거래량 오실레이터',
  volumeRateOfChangeTitle: '거래량 변화율',
  vortexIndicatorTitle: 'Vortex 지표',
  vwmaTitle: 'VWMA',
  williamsAlligatorTitle: 'Williams 앨리게이터',
  williamsFractalsTitle: 'Williams 프랙탈',
  williamsPercentRangeTitle: 'Williams %R',
  zigzagTitle: 'Zig Zag',
  equitySummaryTitle: '자본 요약',
  decisionLongBuyTitle: '매수 결정 — 월간',
  decisionLongSellTitle: '매도 결정 — 월간',
  decisionShortBuyTitle: '매수 결정 — 주간',
  decisionShortSellTitle: '매도 결정 — 주간',
};

const descriptionMap = {
  aroonDescription: 'Aroon 상/하',
  balanceOfPowerDescription: 'Balance of Power',
  bbandDescription: 'John Bollinger 변동성 지표',
  chaikinOscillatorDescription: 'Chaikin 오실레이터',
  chandeKrollStopDescription: 'Chande Kroll Stop',
  chandeMomentumOscillatorDescription: 'Chande 모멘텀 오실레이터',
  cmfDescription: 'Chaikin 자금 흐름',
  diNapoliDetrendOscillatorDescription: 'DiNapoli detrend 오실레이터',
  diNapoliMacdPredictorDescription: 'DiNapoli MACD 예측기',
  diNapoliOscillatorPredictorDescription: 'DiNapoli 오실레이터 예측기',
  doubleEmaDescription: '이중 EMA',
  easeOfMovementDescription: '이동 용이성',
  forwardDescription: 'Forward 값',
  hashiDescription: 'Heikin-Ashi 캔들 차트',
  hl2Description: '(고가 + 저가) / 2',
  hlc3Description: '(고가 + 저가 + 종가) / 3',
  ichimokuDescription: 'Ichimoku 차트',
  minusdiDescription: 'Minus DI',
  momentumDescription: '모멘텀 지표',
  oc2Description: '(시가 + 종가) / 2',
  ohlc4Description: '(시가 + 고가 + 저가 + 종가) / 4',
  pivotPointHLDescription: '고점 및 저점',
  plusdiDescription: 'Plus DI',
  rorDescription: '수익률',
  tripleExponentialAverageDescription: '삼중 지수 이동평균',
  tsiDescription: 'True Strength Index',
  varbandsDescription: 'Varbands',
  williamsPercentRangeDescription: 'Williams %R',
  zigzagDescription: 'Zig Zag 지표',
};

function translateTitle(en, key) {
  if (titleMap[key]) return titleMap[key];
  if (key.endsWith('Title')) return translateDescription(en);
  return en;
}

const labelMap = {
  upper: '상단',
  lower: '하단',
  middle: '중간',
  periods: '기간',
  price: '가격',
  value: '값',
  line: '선',
  signal: 'Signal',
  histogram: 'Histogram',
  priceOpen: '시가',
  priceHigh: '고가',
  priceLow: '저가',
  priceClose: '종가',
  priceVolume: '거래량',
  method: '방법',
  displacement: '이동',
  distance: '거리',
  type: '유형',
  spread: 'Spread',
  weight: '가중치',
  multiplier: '승수',
  shift: '이동',
  percent: '비율',
  probability: '확률',
  O: '시가',
  H: '고가',
  L: '저가',
  C: '종가',
  V: '거래량',
  I: '미결제약정',
  hashiOpen: '시가',
  hashiHigh: '고가',
  hashiLow: '저가',
  hashiClose: '종가',
  aSeries: 'A 시리즈',
  bSeries: 'B 시리즈',
  cSeries: 'C 시리즈',
  dSeries: 'D 시리즈',
  pdi: 'PDI',
  mdi: 'MDI',
  aroonUp: 'Aroon 상승',
  aroonDown: 'Aroon 하락',
  envelopeUp: '상단 envelope',
  envelopeDown: '하단 envelope',
};

function translateKey(key, en) {
  if (descriptionMap[key]) return descriptionMap[key];
  if (key.endsWith('Title')) return translateTitle(en, key);
  if (key.endsWith('Description')) return translateDescription(en);
  return labelMap[key] ?? translateDescription(en);
}

const out = [];
out.push('/** Korean translations for indicator catalog keys (functions/strategies excluded). */');
out.push('const locale: Record<string, unknown> = {');
for (const key of finalKeys) {
  const en = locale[key];
  const translated = translateKey(key, en);
  const escaped = translated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.push(`  ${key}: "${escaped}",`);
}
out.push('};');
out.push('export default locale;');
fs.writeFileSync('packages/chart/src/locale/ko-KR-indicators.ts', out.join('\n'));
console.log('Generated', finalKeys.length, 'keys');
