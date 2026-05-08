const locale: Record<string, unknown> = {
  BUY: "Buy",
  BUY_TO_OPEN: "Buy To Open",
  BUY_TO_CLOSE: "Buy To Close",
  BUY_TO_COVER: "Buy To Cover",
  SELL: "Sell",
  SELL_TO_OPEN: "Sell To Open",
  SELL_TO_CLOSE: "Sell To Close",
  SELL_SHORT: "Sell Short",
  MARKET: "Market",
  LIMIT: "Limit",
  STOP: "Stop",
  STOP_LIMIT: "Stop Limit",
  TRAILING_STOP: "Trailing Stop",
  STOP_LOSS: "Stop Loss",
  TAKE_PROFIT: "Take Profit",
  TAKE_PROFIT_MARKET: "TP Market",
  TAKE_PROFIT_LIMIT: "TP Limit",

  OK: "OK",
  Cancel: "Cancel",
  list_options: "List management",
  network_share: "Share in Exeria Network",
  export_to_library: "Export to the library",
  remove: "Remove",
  tabs_or_grid: "Tabs / grid",
  new_list: "New list",
  edit_title: "Rename",
  add_attachment: "Add attachment",
  instruments_not_found: "Instruments not found",
  instruments_unavailable_message: [
    "Some of the instruments are not available.",
    "In order to proceed, accept the replacement instruments we have proposed or choose your own. Unavailable intervals will be replaced with the closest available ones.",
  ],
  instruments_unavailable_message_trade: [
    "Some of the instruments are not available.",
    "In order to proceed, accept the replacement instruments we have proposed or choose your own.",
    "<b>Some components of the order may not be available to all brokers</b>",
  ],
  choose_instrument_replacement: "Choose a replacement instrument for ",
  close_tab: "Close tab",
  strategies: "Strategies",
  charts: "Charts",
  portfolios: "Portfolios",
  trades: "Trades",
  price: "Price",
  quantity: "Quantity",
  periods: "Periods",
  deviations: "Deviations",
  firstPeriod: "First Period",
  secondPeriod: "Second Period",
  thirdPeriod: "Third Period",
  signalPeriod: "Signal Period",
  line: "Line",
  signal: "Signal",
  histogram: "Histogram",
  priceOpen: "Price OPEN",
  priceHigh: "Price HIGH",
  priceLow: "Price LOW",
  priceClose: "Price CLOSE",
  priceClose2: "Second Price CLOSE",
  priceVolume: "Price VOLUME",
  value: "Value",
  Value: "Value",
  lineSeries: "Line series",
  verticalShift: " Vertical shift",
  indicator: "Indicator",
  boolean: "boolean",
  series: "Series",

  "Power of": "Exponentiation",
  Divide: "Division",
  Multiply: "Multiplication",
  Substract: "Subtraction",
  Add: "Addition",

  add_study: "Add study",
  search: "Search",
  indicators: "Indicators",
  functions: "Functions",
  for_testing: "For testing",
  "my strategies": "My strategies",

  fusion_dialog_panel_selector_label: "Panel",
  fusion_dialog_panel_selector_new_panel: "New panel",
  fusion_dialog_panel_selector_panel: "Panel",
  fusion_dialog_name_input_label: "Name (optional)",
  is_visible: "Visible",

  not_available_packages:
    "Some of the objects or indicators are unavailable. Please subscribe following packages to display full content of the chart",

  period: "Period",
  macdTitle: "MACD",
  macdDescription: "Moving Average Convergence / Divergence",

  bbandTitle: "Bollinger Bands",
  bbandDescription: "Volatility indicator by John Bollinger",
  bbandOutputTitle: "Bollinger Band",
  upper: "Upper",
  lower: "Lower",
  middle: "Middle",

  atrTitle: "ATR",
  atrDescription: "Average True Range",

  adxTitle: "ADX",
  adxDescription: "Average Directional Index",

  ifTitle: "IF",
  ifDescription: "If function",
  ifAValue: "A value",
  ifBValue: "B value",
  ifXValue: "If A > B then",
  ifYValue: "If A = B then",
  ifZValue: "If A < B then",

  hlineTitle: "HLINE",
  hlineDescription: "Horizontal Line",

  objectTitle: "OBJECT",
  objectUserName: "LineIndicator",
  objectDescription: "Use line as indicator",

  smaTitle: "SMA",
  smaDescription: "Simple Moving Average",

  emaTitle: "EMA",
  emaDescription: "Expotential Moving Average",

  cciTitle: "CCI",
  cciDescription: "Commodity Channel Index",

  cexTitle: "CEX",
  cexDescription: "Chandelier Exit",
  periodsATR: " Periods ATR",
  rateATR: "Rate ATR",

  chaikinTitle: "CHAIKIN",
  chaikinDescription: "Chaikin's Volatility",
  mavPeriods: "MAV Periods",
  rovPeriods: "ROV Periods",

  dirmovTitle: "DIRMOV",
  dirmovDescription: "Directional Movement",
  pdi: "PDI",
  mdi: "MDI",

  envelopeTitle: "Envelope",
  envelopeDescription: "Envelope",
  envelopeUp: "Envelope Up",
  envelopeDown: "Envelope Down",

  minusdiTitle: "Minus DI",
  minusdiDescription: "Minus DI",

  momentumTitle: "Momentum",
  momentumDescription: "Momentum",
  method: "Method",

  openintTitle: "OPENINT",
  openintDescription: "Open Interest",

  volumeTitle: "VOLUME",
  volumeDescription: "Volume",

  parsarTitle: "PARSAR",
  parsarDescription: "Parabolic SAR",
  iaf: "Increment AF",
  maf: "Max AF",

  plusdiTitle: "Plus DI",
  plusdiDescription: "Plus DI",

  trendTitle: "Price Trend",
  trendDescription: "Price Trend",

  rocTitle: "ROC",
  rocDescription: "Rate Of Change",
  percentageMode: "Percentage Mode",

  rsiTitle: "RSI",
  rsiDescription: "Relative Strength Index",
  hiBaseline: "Hi Base Line",
  loBaseline: "Low Base Line",
  RSIBaseHI: "RSIBaseHI",
  RSIBaseLO: "RSIBaseLO",

  smiTitle: "SMI",
  smiDescription: "Stochastic Momentum Index",
  kSlowPeriod: "K Slow Period",
  dSlowPeriod: "D Slow Period",
  SMISignal: "SMISignal",
  SMIBaseHI: "SMIBaseHI",
  SMIBaseLO: "SMIBaseLO",

  stochasticOscillatorTitle: "Stochastic Oscillator",
  stochasticOscillatorDescription: "Stochastic Oscillator",
  SOLineK: "SOLineK",
  SOLineD: "SOLineD",
  SOBaseHI: "SOBaseHI",
  SOBaseLO: "SOBaseLO",

  ultimateOscillatorTitle: "Ultimate Oscillator",
  ultimateOscillatorDescription: "Ultimate Oscillator",

  highestTitle: "Highest",
  highestDescription: "Highest value",

  lowestTitle: "Lowest",
  lowestDescription: "Lowest value",

  iglueTitle: "Indicator Glue",
  iglueDescription: "Indicator Glue",
  firstIndicator: "First indicator",
  secondIndicator: "Second Indicator",
  operation: "Operation",

  imodTitle: "Indicator Modifier",
  imodDescription: "Indicator Modifier",
  indicatorModifier: "Inidicator modifier",

  displaceTitle: "Displace",
  displaceDescription: "Displace function",

  wmaTitle: "WMA",
  wmaDescription: "Weighted Moving Average",

  hmaTitle: "HMA",
  hmaDescription: "Hull Moving Average",

  hashiTitle: "Heikin-Ashi",
  hashiDescription: "Candle Chart Heikin-Ashi",
  hashiOpen: "Open",
  hashiHigh: "High",
  hashiLow: "Low",
  hashiClose: "Close",

  O: "Open",
  H: "High",
  L: "Low",
  C: "Close",
  V: "Volume",
  I: "Open Interest",

  aSeries: "A Series",
  bSeries: "B Series",
  cSeries: "C Series",
  dSeries: "D Series",
  singleSignal: "Single signal",
  strategy: "Strategy",
  Buy: "Buy",
  Sell: "Sell",
  "Exit long": "Exit long",
  "Exit short": "Exit short",
  "Exit all": "Exit all",
  "Do nothing": "Do nothing",

  exceedTitle: "Exceed",
  exceedDescription: "Exceed strategy",
  exceedInfo1:
    "Signal occure when series C is above series A (single signal possible after choosing the option)",
  exceedInfo2:
    "or when series D is below series B (single signal possible after choosing the option).",
  exceedUpper: "Upper Band (A)",
  exceedLower: "Lower Band (B)",
  exceedOnDn: "If C Series exceeds up (A) Band",
  exceedOnUp: "If D Series exceeds down (B) Band",

  crossTitle: "Cross",
  crossDescription: "Cross strategy",
  crossInfo: "Signals after series A and series B cross each other.",
  crossOnDn: "A cross B from up to down",
  crossOnUp: "A cross B from down to up",

  reboundTitle: "Rebound",
  reboundDescription: "Rebound strategy",
  reboundInfo1:
    "Signals when series C comes back from above to the range between upper band (series A) and lower band (series B).",
  reboundInfo2:
    "Signals when series C comes back from below to the range between upper band (series A) and lower band (series B).",
  reboundUpper: "Upper A Series",
  reboundLower: "Lower B Series",
  reboundOnDn: "On return up",
  reboundOnUp: "On return down",

  greaterLessTitle: "Greater-Less",
  greaterLessDescription: "Greater-Less Strategy",
  greaterLessInfo1:
    "Signals when series A is above series B (single signal possible after choosing the option).",
  greaterLessInfo2:
    "Signals when series A is below series B (single signal possible after choosing the option).",
  greaterLessInfo3: "Signals when series A is equal to series B",
  "greater than": "greater than",
  "less than": "less than",
  equals: "equals",
  greaterLessChoice: "If the A Series compared to B series is",
  greaterLessRt: "Signals",

  singleSignalsTitle: "Single Signals",
  singleSignalsInfo1: "Removes duplicate signals.",
  singleSignalsInfo2:
    "If Reverse option is selected then position size will be equal to 1 after buy signal and -1 after sell signal.",
  simpleOrReverse: "Simple or reverse",
  Simple: "Simple",
  Reverse: "Reverse",

  joinTitle: "Join",
  joinDescription: "Join Signals",
  joinInfo:
    'Combination between X and Y strategy signals. Click "Table button" to see which signals are generated depending on strategy X and Y signals.',
  xStrategy: "X Strategy",
  yStrategy: "Y Strategy",
  joiningTable: "Joining table",

  doubleCheckTitle: "Double Check",
  doubleCheckDescription: "Double Check",
  doubleCheckInfo: "Signal occur when both input signals are the same.",
  mixingTable: "Mixing table",
  showMixingTable: "SHOW MIXING TABLE",

  selectiveSignalsTitle: "Selective signals",
  selectiveSignalsDescription: "Selective signals",
  selectiveSignalsInfo:
    'Combination of signals from strategy X and strategy Y as defined by the User in the table. click "Table button" to indicate which signal is generated depending on signals from strategies X and Y.',

  positionSizeTitle: "Position size",
  positionSizeInfo:
    "Indicator displays position size of chosen strategy (X). Position size can be multiplied by the Multiplier and Weight. The Multiplier can be any series (e.g. rate of exchange) and/or constant (e.g. 2).",
  weight: "Weight",
  multiplier: "Multiplier",

  buySellSizeTitle: "Buy Sell Size",
  buySellSizeInfo:
    "Transform Position Size into strategy which contains only Buy and Sell signals with proper strength (size). You can also transform chosen strategy (X) then calculations are performed on strategies position size.",
  buySellSizePs: "Position size X Series",

  equityTitle: "Equity",
  equityDescription: "Equity line",
  equityStrategy: "Strategy series",
  spread: "Spread",
  commision: "Commision [%]",
  initialEquity: "Initial equity",
  lotSize: "Trade Size (number of units):",
  equityCapital: "Show results as return with capital",
  equityPerc: "Show results as % of maximum value of investment",
  position: "Position",
  equityPL: "Equity profit/lost",
  equityLine: "Equity Line",

  equitySummaryTitle: "Equity summary",
  equitySummaryDescription: "Equity summary line",

  ichimokuTitle: "Ichimoku",
  ichimokuDescription: "Ichimoku",
  chikouSpanDisplace: "Chikou span displace",
  tenkanSenPeriod: "Tenkan Sen Period",
  kijunSenPeriod: "Kijun Sen Period",
  senkouSenPeriod: "Senkou Span Period",
  ichimokuTenkanSen: "Tenkan Sen",
  ichimokuKijunSen: "Kijun Sen",
  ichimokuChikouSpan: "Chikou span",
  ichimokuSenkouA: "Senkou span A",
  ichimokuSenkouB: "Senkou span B",

  mmaTitle: "MMA",
  mmaDescription: "Modified Moving Average - Wilders Smoothing",

  dpoTitle: "DPO",
  dpoDescription: "Detrended Price Oscillator",

  dmaTitle: "DMA",
  dmaDescription: "Displaced Moving Average",
  displacement: "Displacement",

  diNapoliDetrendOscillatorTitle: "DiNapoli Detrend Oscillator",
  diNapoliDetrendOscillatorDescription: "DiNapoli Detrend Oscillator",

  diNapoli3x3Title: "DiNapoli 3x3",
  diNapoli3x3Description: "DiNapoli Displaced Moving Average 3x3",

  diNapoliPreferredStochasticTitle: "DiNapoli Preferred Stochastic",
  diNapoliPreferredStochasticDescription: "DiNapoli Preferred Stochastic Oscillator",

  diNapoliMacdTitle: "DiNapoli MACD",
  diNapoliMacdDescription: "DiNapoli Moving Average Convergence / Divergence",

  smoothingFactor1: "Smoothing factor 1",
  smoothingFactor2: "Smoothing factor 2",
  signalLineSmoothingFactor: "Signal line smoothing factor",

  diNapoliOscillatorPredictorTitle: "DiNapoli Oscillator Predictor",
  diNapoliOscillatorPredictorDescription: "DiNapoli Oscillator Predictor",
  diNapoliOscillatorPredictorHigh: "High",
  diNapoliOscillatorPredictorLow: "Low",

  diNapoliMacdPredictorTitle: "DiNapoli MACD Predictor",
  diNapoliMacdPredictorDescription: "DiNapoli MACD Predictor",
  shift: "Shift",
  percent: "Percent",
  lookbackPeriods: "Lookback periods",
  peaksAndThroughs: "Number of peaks and throughs",

  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",

  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
  Sunday: "Sunday",

  ttfTitle: "Trading Time Frame",
  ttfDescription: "Trading Time Frame",
  ttfDays: "Days:",
  hourFrom: "From:",
  hourTo: "To:",
  timezone: "Time zone: ",

  candlestickPatternsTitle: "Candlestick patterns",
  candlestickPatternsDescription: "Signal occurs if candlestick pattern is detected",
  chooseCandlestickPatterns: "Choose candlestick patterns: ",
  DIFFUSION: "Diffusion",
  MORNINGSTAR: "Morning star",
  SHOOTINGSTAR: "Shooting star",
  EVENINGSTAR: "Evening star",
  BEARISHHARAMI: "Bearish harami",
  BULLISHHARAMI: "Bullish harami",
  HAMMER: "Hammer",
  BESSAHUG: "Bessa hug",
  HOSSAHUG: "Hossa hug",
  REVERSEDHAMMER: "Reversed hammer",
  HANGMAN: "Hangman",
  HIGHWAVEDOWN: "High wave down",
  HIGHWAVEUP: "High wave up",
  DARKCLOUDCOVER: "Dark cloud cover",
  DOJIDOWN: "Doji down",
  DOJIUP: "Doji up",

  forwardTitle: "Forward",
  forwardDescription: "Forward",
  interest1: "Interest 1",
  interest2: "Interest 2",

  forecastTitle: "Forecast",
  forecastDescription: "Forecast",
  periodsForAnalysis: "Periods for analysis",
  prognosisPeriods: "Prognosis periods",
  probability: "Probability",

  varbandsTitle: "Varbands",
  varbandsDescription: "Varbands",

  decisionShortSellTitle: "Sell decisions - weekly",
  decisionShortSellDescription: "Statistical weekly decision model for exporter - hourly data",
  decisionShortBuyTitle: "Buy decisions - weekly",
  decisionShortBuyDescription: "Statistical weekly decision model for importer - hourly data",

  decisionLongSellTitle: "Sell decisions - monthly",
  decisionLongSellDescription: "Statistical monthly decision model for exporter - hourly data",
  decisionLongBuyTitle: "Buy decisions - monthly",
  decisionLongBuyDescription: "Statistical monthly decision model for importer - hourly data",

  signalDistanceTitle: "Signal distance",
  signalDistanceDescription: "Measures distance between signals in strategy",

  accumulationTitle: "Accumulation",
  accumulationDescription: "Sums up values of an indicator",

  priceLevelsTitle: "Price Levels",
  priceLevelsDescription: "Horizontal price levels",
  distance: "Distance",
  type: "Type",

  errorMessage: "There was an error during component initialization",
  connectBrokerError: "An error occurred while adding the broker account",
  instrument_not_tradable:
    "Instrument not tradable. <br/><br/>To create an order, make sure, you added broker account and selected the instrument supported by connected broker",
  instrument_not_tradable_error: "Instrument is not tradable",
  add_order: "Add order",

  brokers: {
    bitmex: "BitMEX",
    "bitmex-testnet": "BitMEX Testnet",
    bitmexTestnet: "BitMEX Testnet",
    binance: "Binance",
    "okex-spot": "Okex Spot",
    "okex-perpetual": "Okex Perpetual",
    dragon: "Exeria",
    tradier: "Tradier",
    CI: "City Index",
    TTR: "Trade Tech Alpha",
  },

  subscriptionPacks: {
    diNapoliTools: {
      name: "DiNapoli Tools",
      accountNumberRequired: false,
      features: [
        "Full set of the tools used by their creator - Joe DiNapoli",
        "Extremely useful in trading on any liquid financial markets",
      ],
      detailed_features: [
        "Full set of the tools used by their creator - Joe DiNapoli",
        "Extremely useful in trading on any liquid financial markets.",
        "Graphic tools: DiNapoli Levels (DiNapoli Retracements), DiNapoli Expansion (DiNapoli Expansion Analysis)",
        "Indicators: DiNapoli MACD Predictor, DiNapoli 3x3 (Shifted Moving Average), DiNapoli MACD, DiNapoli Preferred Stochastic, DiNapoli Oscillator Predictor, DiNapoli Detrend Oscillator",
        "<a class='webrcp-link' href='https://exeria.com/dinapoli-tools/' target='_blank'>Learn more<a/>",
      ],
      infoLink: "https://exeria.com/dinapoli-tools/",
    },
    importerExporterTools: {
      name: "FX Predictor",
      accountNumberRequired: false,
      features: [
        "A decision model that makes it easier to choose when to buy or sell a currency",
        "A forecast model for the range of future price changes",
        "Calculator of current and historical forward rates",
        "Access to current prices of currencies, commodities and indices",
      ],
      detailed_features: [
        "A decision model that makes it easier to choose when to buy or sell a currency. Thanks to the model, it is possible to conclude transactions with a price 0.6% - 1% better than the average market price. For currency transactions worth EUR 10 million a year, this means savings of EUR 60,000",
        "A forecast model for the range of future price changes that will allow you to determine your future price in the budget, pricing policy, tender or company forecasts.",
        "Calculator of current and historical forward rates",
        "Access to ongoing analyzes, assessments and forecasts of experts in the field of currencies and commodities",
        "<a class='webrcp-link' href='https://exeria.com/fx-predictor/' target='_blank'>Learn more</a>",
        "<a class='webrcp-link' href='https://landing.exeria.com/en-fx-predictor' target='_blank'>Fill out the order form for companies if you want to use another payment method</a>",
        "<a class='webrcp-link' href='https://about.exeria.com/en/importers_exporters_terms.html' target='_blank'>Terms of Service</a>",
      ],
      infoLink: "https://exeria.com/fx-predictor/",
    },
    tradierStocks: {
      name: "Tradier Pro Stock",
      accountNumberRequired: true,
      features: ["$0 instead of&nbsp;$3.49 per order"],
      detailed_features: [
        "$0 instead of&nbsp;$3.49 per order",
        "The offer is valid for any account with Tradier broker, that supports stock, or stock and options transactions, created through <a target='_blank' class='webrcp-link' href='https://exeria.com/en/open_account.html'>exeria.com</a> service",
      ],
    },
    tradierStocksAndOptions: {
      name: "Tradier Pro Stock and Options",
      accountNumberRequired: true,
      features: ["$0 instead of&nbsp;$3.49 per order", "$0 instead of&nbsp;$0.35 per contract"],
      detailed_features: [
        "$0 instead of&nbsp;$3.49 per order",
        "$0 instead of&nbsp;$0.35 per contract",
        "The offer is valid for any account with Tradier broker, that supports stock and options transactions, created through <a target='_blank' class='webrcp-link' href='https://exeria.com/en/open_account.html'>exeria.com</a> service",
      ],
    },
  },

  new_features: "Check out our new features!",
  dont_show: "Don't show this message again",
  read_more: "Read more",
  click_to_subscribe: "Click to subscribe to the",
  click_to_unlock: "and unlock this functionality",

  month: "month",
  monthNames: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  monthNamesShort: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  dayNamesMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  hours: "Hours",
  minutes: "Minutes",
  am: "am",
  pm: "pm",

  obvTitle: "OBV",
  obvDescription: "On Balance Volume",

  adlTitle: "ADL",
  adlDescription: "Accumulation Distribution",

  cmfTitle: "CMF",
  cmfDescription: "Chaikin Money Flow",

  nviTitle: "NVI",
  nviDescription: "Negative Volume Index",

  pviTitle: "PVI",
  pviDescription: "Positive Volume Index",

  zigzagTitle: "Zig Zag",
  zigzagDescription: "Zig Zag",
  extendToLastBar: "Extend to last bar",

  pivotPointTitle: "Pivot Point",
  pivotPointDescription: "Pivot Point",
  pivotPointSupport1: "Support 1",
  pivotPointSupport2: "Support 2",
  pivotPointSupport3: "Support 3",
  pivotPointResistance1: "Resistance 1",
  pivotPointResistance2: "Resistance 2",
  pivotPointResistance3: "Resistance 3",

  pivotPointHLTitle: "Tops and Bottoms",
  pivotPointHLDescription: "Tops and Bottoms",

  williamsPercentRangeTitle: "Williams' Percent Range",
  williamsPercentRangeDescription: "Williams' Percent Range",

  forceIndexTitle: "Force Index",
  forceIndexDescription: "Force Index",

  keltnerChannelIndicatorTitle: "Keltner Channel Indicator",
  keltnerChannelIndicatorDescription: "Keltner Channel Indicator",
  ATRPeriods: "ATR Periods",

  donchianChannelTitle: "Donchian Channel",
  donchianChannelDescription: "Donchian Channel",

  massIndexTitle: "Mass Index",
  massIndexDescription: "Mass Index",
  EMAPeriods: "EMA Periods",

  tripleExponentialAverageTitle: "Triple Exponential Average",
  tripleExponentialAverageDescription: "Triple Exponential Average",

  volumeOscillatorTitle: "Volume Oscillator",
  volumeOscillatorDescription: "Volume Oscillator",
  shortPeriod: "Short period",
  longPeriod: "Long period",

  volumeRateOfChangeTitle: "Volume Rate of Change",
  volumeRateOfChangeDescription: "Volume Rate of Change",

  almaTitle: "ALMA",
  almaDescription: "Arnaud Legoux Moving Average",
  offset: "Offset",
  sigma: "Sigma",

  aroonTitle: "Aroon",
  aroonDescription: "Aroon Up/Down",
  aroonUp: "Aroon Up",
  aroonDown: "Aroon Down",

  awesomeOscillatorTitle: "Awesome Oscillator",
  awesomeOscillatorDescription: "Awesome Oscillator",

  balanceOfPowerTitle: "Balance of Power",
  balanceOfPowerDescription: "Balance of Power",

  bbandsPercentTitle: "Bollinger Bands %B",
  bbandsPercentDescription: "Bollinger Bands %B (Percentage Bandwidth)",
  upperBand: "Upper band",
  lowerBand: "Lower band",

  bbandsWidthTitle: "Bollinger Bands Width",
  bbandsWidthDescription: "Bollinger Bands Width",

  chaikinOscillatorTitle: "Chaikin Oscillator",
  chaikinOscillatorDescription: "Chaikin Oscillator",

  chandeKrollStopTitle: "Chande Kroll Stop",
  chandeKrollStopDescription: "Chande Kroll Stop",
  chandeKrollStopP: "P",
  chandeKrollStopQ: "Q",
  chandeKrollStopX: "X",
  chandeKrollStopUp: "Stop short",
  chandeKrollStopDown: "Stop long",

  chandeMomentumOscillatorTitle: "CMO",
  chandeMomentumOscillatorDescription: "Chande Momentum Oscillator",

  choppinessIndexTitle: "Choppiness Index",
  choppinessIndexDescription: "Choppiness Index",

  connorsRsiTitle: "Connors RSI",
  connorsRsiDescription: "Connors Relative Strength Index",
  rsiPeriods: "RSI Periods",
  upDownPeriods: "UpDown Periods",
  rocPeriods: "ROC Periods",

  coppockCurveTitle: "Coppock Curve",
  coppockCurveDescription: "Coppock Curve",
  wmaPeriod: "WMA Period",
  shortRocPeriod: "Short ROC Period",
  longRocPeriod: "Long ROC Period",

  correlationCoefficientTitle: "Correlation Coefficient",
  correlationCoefficientDescription: "Correlation Coefficient",

  doubleEmaTitle: "Double EMA",
  doubleEmaDescription: "Double EMA",

  easeOfMovementTitle: "EOM",
  easeOfMovementDescription: "Eease of Movement",
  divisor: "Divisor",

  eldersForceIndexTitle: "EFI",
  eldersForceIndexDescription: "Elder's Force Index",

  fisherTransformTitle: "Fisher Transform",
  fisherTransformDescription: "Fisher Transform",
  trigger: "Trigger",

  historicalVolatilityTitle: "HV",
  historicalVolatilityDescription: "Historical Volatility",
  tradingDays: "Trading Days",

  netVolumeTitle: "Net Volume",
  netVolumeDescription: "Net Volume",

  tsiTitle: "TSI",
  tsiDescription: "True Strength Index",

  vortexIndicatorTitle: "VI",
  vortexIndicatorDescription: "Vortex Indicator",
  vortexIndicatorPlus: "VI +",
  vortexIndicatorMinus: "VI -",

  vwmaTitle: "VWMA",
  vwmaDescription: "Volume Weighted Moving Average",

  williamsAlligatorTitle: "Williams Alligator",
  williamsAlligatorDescription: "Williams Alligator",
  jaw: "Jaw",
  teeth: "Teeth",
  lips: "Lips",
  jawPeriods: "Jaw Periods",
  teethPeriods: "Teeth Periods",
  lipsPeriods: "Lips Periods",
  jawOffset: "Jaw Offset",
  teethOffset: "Teeth Offset",
  lipsOffset: "Lips Offset",

  williamsFractalsTitle: "Williams Fractals",
  williamsFractalsDescription: "Williams Fractals",

  oc2Title: "OC2",
  oc2Description: "(Open + Close) / 2",

  hl2Title: "HL2",
  hl2Description: "(High + Low) / 2",

  hlc3Title: "HLC3",
  hlc3Description: "(High + Low + Close) / 3",

  ohlc4Title: "OHLC4",
  ohlc4Description: "(Open + High + Low + Close) / 4",

  "1xTitle": "1/x",
  "1xDescription": "1 / x",

  sumTitle: "Sum",
  sumDescription: "Sum of indicators",
  indicator1: "Indicator 1",
  indicator2: "Indicator 2",
  indicator3: "Indicator 3",
  indicator4: "Indicator 4",
  indicator5: "Indicator 5",
  indicator6: "Indicator 6",
  indicator7: "Indicator 7",
  indicator8: "Indicator 8",
  indicator9: "Indicator 9",
  indicator10: "Indicator 10",

  averageTitle: "Average",
  averageDescription: "Average of indicators",

  standardDeviationTitle: "Standard Deviation",
  standardDeviationDescription: "Standard Deviation",

  fibonacciTitle: "Fibonacci",
  fibonacciDescription: "Fibonacci Levels",
  fibonacciValue0: "0",
  fibonacciValue2: "38.2",
  fibonacciValue3: "50",
  fibonacciValue4: "61.8",
  fibonacciValue6: "100",
  fibonacciValue7: "161.8",

  sharpeRatioTitle: "Sharpe Ratio",
  sharpeRatioDescription: "Sharpe Ratio",
  rorPeriods: "The number of periods for calculating the expected rate of return",
  sharpePeriods: "The number of returns to calculate the average and standard deviation",
  riskFreeRateOfReturn: "Risk free assets rate of return %",
  stddev: "Std dev",
  ror: "ROR",

  rorTitle: "ROR",
  rorDescription: "Rate of Return",

  informationRatioTitle: "Information Ratio",
  informationRatioDescription: "Information Ratio",
  informationRatioPeriods: "The number of returns to calculate the average and tracking error",
  benchmark: "Benchmark",
  benchmarkReturn: "Benchmark return",
  trackingError: "Tracking error",
  portfolioReturn: "Portfolio return",

  "1m": "1 minute",
  "3m": "3 minutes",
  "5m": "5 minutes",
  "15m": "15 minutes",
  "30m": "30 minutes",
  "1h": "1 hour",
  "2h": "2 hours",
  "4h": "4 hours",
  "1d": "1 day",
  "1D": "1 day",
  "1W": "1 week",
  "1M": "1 month",

  interval: "Interval",
  change_interval: "Change interval",
  subscribe: "Subscribe",

  logo_subtitle: "Powerful trading space for investors",
  light: "Light",
  dark: "Dark",

  layouts_launch: "Launch",
  layouts_charts_title: "Charts",
  layouts_charts_description: "Check your quotes, charts and make analysis with one click.",
  layouts_sn_title: "Social Network",
  layouts_sn_description:
    "Recommendations, news, interesting facts. Follow your friends and experts.",
  layouts_front_title: "Trading Platform",
  layouts_front_description:
    "Trade from any device with multiple brokers using algorythmic trading and cloud computing.",
  layouts_title: "Start exploring Exeria with predefined layouts",
  layouts_mobile_title: "Trading Platform",
  layouts_mobile_description:
    "Trade with many brokers, view and analyse charts, read recommendations and run automated strategies in one place.",

  pages_open: "Open",
  pages_strategies_url: "https://about.exeria.com/en/strategies.html",
  pages_strategies_title: "Automatic Strategies",
  pages_strategies_description:
    "Browse and use ready-made algorithms to control the markets and execute trades.",
  pages_about_url: "https://exeria.com/en/home/",
  pages_about_title: "About Exeria",
  pages_about_description: "Take a closer look at Exeria and our services.",
  pages_blog_url: "https://exeria.com/en/blog-en/",
  pages_blog_title: "Investment Blog",
  pages_blog_description:
    "Read analysis created by experts and learn to trade in financial markets.",
  pages_title: "Find more resources and information",

  have_account: "Already have an account?",
  sign_in: "Sign in.",
};

export default locale;
