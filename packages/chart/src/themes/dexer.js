const blue = "#2196f3";
const orange = "#ff9800";
const black = "#000000";
const white = "#ffffff";
const gray = "#666666";

// DARK COLORS
const d_dividerColor = "rgb(51, 53, 63)";
const d_componentBackground = "#100C22";
const d_componentDarkGrayD = "#1f2029";
// -- CHART
const d_gridColor = "#353741";
const d_chartRed = "#e51c23";
const d_chartGreen = "#259b24";
const d_chartGray = "#757578";
const d_chartGrayLight = "#adadad";
const d_chartRedStroke = "#ea494f";
const d_chartGreenStroke = "#51af50";
const d_buyColor = "#229021";
const d_sellColor = "#e11920";
const d_border = "#1c1d25";

// LIGHT COLORS
const l_accentColor = "#1e6cab"; //"#536e79";
const l_opaqueAccentColor = "rgba(83, 110, 121, 0.1)";
const l_primaryTextColor = "rgba(0, 0, 0, 0.87)";
const l_secondaryTextColor = "rgba(0, 0, 0, 0.54)";
const l_disabledTextColor = "rgba(0, 0, 0, 0.38)";
const l_chartStroke = "#666";
const l_chartFill = "rgba(0, 0, 0, 0.06)";
const l_dividerColor = "#e0e0e0";
const l_componentBackground = "#f1f1f1";
const l_dots = "rgba(0, 0, 0, 0.24)";
const l_border = "#c2c2c2";
const l_red = "#e53c42"; //#f95151";
const l_green = "#00b05d"; //#34c772";
const l_menu_color = "#666";

// -- CHART
const l_chartRed = l_red;
const l_chartGreen = l_green;

const theme = {
  colors: {
    accent: { light: l_accentColor, dark: blue },
    primaryTextColor: { light: l_primaryTextColor, dark: white },
    disabledTextColor: {
      light: l_disabledTextColor,
      dark: "rgba(255, 255, 255, 0.5)",
    },
    handlerColor: { light: l_border, dark: d_border },
    iconColor: { light: black, dark: white },
    backgroundColor: { light: l_componentBackground, dark: "#100C22" },
    timeAxisBackground: { light: l_componentBackground, dark: "#100C22" },
    priceAxisBackground: { light: l_componentBackground, dark: "#100C22" },
    timeAxisTextColor: { light: l_secondaryTextColor, dark: "#6D86B1" },
    priceAxisTextColor: { light: l_secondaryTextColor, dark: "#6D86B1" },
    gridColor: { light: l_dividerColor, dark: "#15132B" },
    chartZeroColor: { light: "#dd7423", dark: "#ffff00" },
    chartRed: { light: l_chartRed, dark: "#FF007B", bw: black },
    chartGreen: { light: l_chartGreen, dark: "#17F7AB", bw: white },
    chartGray: { light: gray, dark: d_chartGray },
    chartGrayPrimary: { light: l_chartStroke, dark: d_chartGrayLight },
    chartRedStroke: { light: "#800000", dark: "#CB026B", bw: black },
    chartGreenStroke: { light: "#134d2c", dark: "#24C687", bw: black },
    chartFill: { light: l_chartFill, dark: "rgba(45,86,109,.3)" },
    chartStroke: { light: l_chartStroke, dark: "#2d566d" },
    buyColor: { light: l_green, dark: d_buyColor },
    sellColor: { light: l_red, dark: "#FF007B" },
    exitAllColor: { light: gray, dark: "#aaaaaa" },
    defaultToolColor: { light: "#465054", dark: "#fafafa" },
    defaultToolTextColor: { light: white, dark: "#001122" },
    crosshairColor: { light: "#465054", dark: blue },
    crosshairTextColor: { light: white, dark: white },
    crosshairInnerColor: { light: "#465054", dark: "#246197" },
    tipBackground: { light: l_menu_color, dark: "#201E3E" },
    tipTextColor: { light: white, dark: "#e3e3e3" },
    tipUnderline: {
      light: "rgba(255, 255, 255, 0.12)",
      dark: "rgba(255, 255, 255, 0.12)",//"#0F0C22",
    },
    indicatorMarker: { light: l_accentColor, dark: d_componentDarkGrayD },
    hitColor: {
      light: "rgba(0, 0, 0, 0.54)",
      dark: "rgba(255, 255, 255, 0.7)",
    },
    darkTextColor: { light: l_primaryTextColor, dark: l_primaryTextColor },
    overlay: { light: l_dividerColor, dark: d_componentDarkGrayD },
    legendLabelColor: { light: white, dark: white },
  },

  fonts: {
    title: {
      light: "bold 12px Mulish, Roboto, Tahoma, Arial, sans-serif",
      dark: "bold 12px Mulish, Roboto, Tahoma, Arial, sans-serif",
    },
    text: {
      light: "11px Mulish, Roboto, Tahoma, Arial, sans-serif",
      dark: "11px Mulish, Roboto, Tahoma, Arial, sans-serif",
    },
    price: {
      light: "bold 11px Mulish, Roboto, Tahoma, Arial, sans-serif",
      dark: "bold 11px Mulish, Roboto, Tahoma, Arial, sans-serif",
    },
    time: {
      light: "bold 11px Mulish, Roboto, Tahoma, Arial, sans-serif",
      dark: "bold 11px Mulish, Roboto, Tahoma, Arial, sans-serif",
    },
    legend: {
      light: "11px Mulish, Roboto, Tahoma, Arial, sans-serif",
      dark: "11px Mulish, Roboto, Tahoma, Arial, sans-serif",
    },
    fontName: { light: "Mulish", dark: "Mulish" },
  },
};

export default theme;
