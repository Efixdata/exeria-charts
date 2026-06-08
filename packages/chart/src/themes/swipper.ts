const blueLight = "#21C1F2";
const blue = "#1EA1CD";

const whiteTransparent = "rgba(255,255,255,0.1)";
const white = "#fff";

const greenLight = "#3CC3AF";
const green = "#25AD98";
const greenDark = "#1f9e8b";

const red = "#ce3e5b";
const redDark = "#af1d57";

const chartTheme = {
  colors: {
    accent: { dark: blue },
    primaryTextColor: { dark: white },
    disabledTextColor: { dark: "rgba(255, 255, 255, 0.5)" },
    iconColor: { dark: blueLight },
    backgroundColor: { dark: "transparent" },

    handlerColor: { dark: whiteTransparent },
    timeAxisBackground: { dark: "transparent" },
    priceAxisBackground: { dark: "transparent" },
    timeAxisTextColor: { dark: blue },
    priceAxisTextColor: { dark: blue },
    gridColor: { dark: whiteTransparent },

    chartZeroColor: { dark: blueLight },
    chartRed: { dark: red },
    chartGreen: { dark: greenLight },
    chartGreenBackground: { dark: greenDark },
    chartGray: { dark: blue },
    chartGrayPrimary: { dark: blue },
    chartRedStroke: { dark: redDark },
    chartGreenStroke: { dark: green },
    chartFill: { dark: blueLight },
    chartFillGradient: { dark: blueLight },
    chartStroke: { dark: blueLight },

    buyColor: { dark: greenLight },
    sellColor: { dark: red },
    exitAllColor: { dark: red },

    defaultToolColor: { dark: blue },
    defaultToolTextColor: { dark: blue },

    crosshairColor: { dark: blueLight },
    crosshairTextColor: { dark: white },
    crosshairInnerColor: { dark: blue },
    crosshairInnerTextColor: { dark: white },

    tipBackground: { dark: blue, light: "#F7F9FC" },
    tipTextColor: { dark: "rgba(255, 255, 255, 0.92)", light: "#131722" },
    tipTitleColor: { dark: "#FFFFFF", light: "#131722" },
    tipLabelColor: { dark: "rgba(255, 255, 255, 0.72)", light: "rgba(19, 23, 34, 0.62)" },
    tipUnderline: { dark: "rgba(255, 255, 255, 0.12)", light: "rgba(19, 23, 34, 0.12)" },
    tipBorder: { dark: "rgba(127, 157, 204, 0.35)", light: "rgba(19, 23, 34, 0.14)" },
    tipShadow: { dark: "rgba(0, 0, 0, 0.38)", light: "rgba(19, 23, 34, 0.14)" },

    indicatorMarker: { dark: "yellow" },
    hitColor: { dark: "rgba(255, 255, 255, 0.7)" },
    darkTextColor: { dark: white },
    overlay: { dark: red },

    legendLabelColor: { dark: "rgba(255,255,255,0.7)" },
    legendValueColor: { dark: white },
    legendLineBackground: { dark: "transparent" },

    fibonacciRetracementLine: { dark: "rgba(255, 255, 255, 0.1)" },
  },

  fonts: {
    title: {
      dark: "300 12px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    text: {
      dark: "300 11px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    price: {
      dark: "300 12px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    priceSubscript: {
      dark: "300 10px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    priceCompact: {
      dark: "300 10px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    priceSubscriptCompact: {
      dark: "300 9px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    time: {
      dark: "300 11px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    legend: {
      dark: "300 12px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    legendSubscript: {
      dark: "300 10px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    legendCompact: {
      dark: "300 10px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    legendSubscriptCompact: {
      dark: "300 9px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    fontName: { dark: "Chivo" },
  },
};

export default chartTheme;
