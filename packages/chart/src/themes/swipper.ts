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

    tipBackground: { dark: blue },
    tipTextColor: { dark: "rgba(255, 255, 255, 0.8)" },
    tipUnderline: { dark: "rgba(255, 255, 255, 0.1)" },

    indicatorMarker: { dark: "yellow" },
    hitColor: { dark: "rgba(255, 255, 255, 0.7)" },
    darkTextColor: { dark: white },
    overlay: { dark: red },

    legendLabelColor: { dark: "rgba(255,255,255,0.7)" },
    legendValueColor: { dark: white },
    legendLineBackground: { dark: "rgba(10, 39, 56, 0.7)" },

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
    time: {
      dark: "300 11px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    legend: {
      dark: "300 12px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    legendSubscript: {
      dark: "300 10px Chivo, Roboto, Tahoma, Arial, sans-serif",
    },
    fontName: { dark: "Chivo" },
  },
};

export default chartTheme;