import WEBRCP from "./WebRCP";

export default {
  mainSeries:	null,
  instrumentsSeries: [],
  autoScale: true,
  orders: {
    list: [],
    visible: true
  },
  positions: {
    list: [],
    visible: true
  },
  interval: "1h",
  valueAxisWidth:	80,
  timeAxisHeight: 24,
  minValueTickHeight: 30,
  minTimeTickWidth: 120,
      // handlerColor: WEBRCP.utils.colorManager.getColor("handlerColor"),
      font: 'normal 11px Roboto, Tahoma, Arial, sans-serif',
      valueFont: 'normal 700 11px/11px Roboto, Tahoma, Arial, sans-serif',
      timeFont: 'normal 700 11px/11px Roboto, Tahoma, Arial, sans-serif',
      ordersAndPositionsFont: '10px normal Roboto, Tahoma, Arial, sans-serif',
      // timeAxisBackground: WEBRCP.utils.colorManager.getColor("timeAxisBackground"),
      // valueColor: WEBRCP.utils.colorManager.getColor("valueColor"),
      // timeColor: WEBRCP.utils.colorManager.getColor("timeColor"),
      // gridColor: WEBRCP.utils.colorManager.getColor("gridColor"),
  periodWidth: 6,
  viewportLeft: 0,
  endMargin: 100,
  extremesMargin: 0.1,
  minPanelHeight: 24,
      legendLabelColor: '#ffffff',
      legendLabelFont: 'normal 300 11px/11px Roboto, Tahoma, Arial, sans-serif',
      legendValueFont: 'normal 300 11px/11px Roboto, Tahoma, Arial, sans-serif',
  mode: "normal",  //normal, plain
  scripts: [],
  panels:	[{
    id: "1",
    valueAxisMode: "lin",  //perc
    main: true,
    hGrid: true,
    vGrid: true,
    basis: 100,
    vMax: 100,
    vMin: 0,
    precision: 5,
    centerZero: false,
    // zeroLine: {color: WEBRCP.utils.colorManager.getColor("chartZeroColor"), width: 1, dash: [3, 3]},
    zeroLine: "#ffff00",
    objects: []
  }]
};