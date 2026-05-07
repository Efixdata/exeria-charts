import defaultTheme from "../themes/swipper";
import { isSmallScreen } from "./environment";

type LocaleDictionary = Record<string, unknown>;

type ThemeVariantName = "dark" | "light";

interface ThemeVariantValue {
  dark?: string;
  light?: string;
  bw?: string;
}

interface ThemePalette {
  colors?: Record<string, ThemeVariantValue>;
  fonts?: Record<string, ThemeVariantValue>;
  [key: string]: unknown;
}

interface TickLike {
  ask?: number;
  bid?: number;
  price?: number;
  [key: string]: unknown;
}

interface OrderLike {
  status?: string;
  [key: string]: unknown;
}

interface DateTimeParts {
  date: string;
  time: string;
}

class FormattedDate {
  private readonly date: Date;

  constructor(date: Date) {
    this.date = date;
  }

  toDateTime(timeSeparator?: string, dateSeparator?: string): DateTimeParts {
    return {
      date: this.toDate(dateSeparator),
      time: this.toTime(timeSeparator),
    };
  }

  toDateTimeString(timeSeparator?: string, dateSeparator?: string): string {
    const formatted = this.toDateTime(timeSeparator, dateSeparator);
    return `${formatted.date} ${formatted.time}`;
  }

  toTime(customSeparator = ":"): string {
    return [
      padNumber(this.date.getHours()),
      padNumber(this.date.getMinutes()),
      padNumber(this.date.getSeconds()),
    ].join(customSeparator);
  }

  toDate(customSeparator = "-"): string {
    return [
      this.date.getFullYear().toString(),
      padNumber(this.date.getMonth() + 1),
      padNumber(this.date.getDate()),
    ].join(customSeparator);
  }
}

function padNumber(value: number): string {
  return value.toString().padStart(2, "0");
}

class DateTimeFormatter {
  stamp(stamp: number): FormattedDate {
    return new FormattedDate(new Date(stamp));
  }

  date(date: Date): FormattedDate {
    return new FormattedDate(date);
  }
}

class Messages {
  [key: string]: any;

  private readonly locale: LocaleDictionary;

  constructor(locale: LocaleDictionary) {
    this.locale = locale;
    Object.assign(this, locale);
  }

  getMessage(key: string | null | undefined, defaultMsg?: any, emptyAllowed = true): any {
    if (key && this.locale[key] !== undefined) {
      return this.locale[key];
    }

    if (defaultMsg !== undefined) {
      return defaultMsg;
    }

    if (!emptyAllowed && key) {
      console.error("No locale", this.locale, key);
    }

    return key ? `NO LOCALE[${key}]!` : "";
  }
}

class ColorManager {
  theme: ThemePalette;
  variant: ThemeVariantName;
  bw?: boolean;

  constructor(theme: ThemePalette, variant: ThemeVariantName = "dark") {
    this.theme = theme;
    this.variant = variant;
  }

  setTheme(theme?: ThemePalette, variant?: string): void {
    if (theme) {
      this.theme = theme;
    }

    if (variant === "light" || variant === "dark") {
      this.variant = variant;
    }
  }

  getColor(colorName: string, fallback?: string): string {
    if (looksLikeRawColor(colorName)) {
      return colorName;
    }

    const color = this.theme.colors?.[colorName];
    if (this.bw && color?.bw) {
      return color.bw;
    }

    return color?.[this.variant] ?? fallback ?? colorName;
  }

  getFont(key: string, fallback?: string): string {
    if (looksLikeRawColor(key)) {
      return key;
    }

    const font = this.theme.fonts?.[key];
    if (this.bw && font?.bw) {
      return font.bw;
    }

    return font?.[this.variant] ?? fallback ?? key;
  }
}

function looksLikeRawColor(value: string): boolean {
  return value.includes("#") || value.toLowerCase().includes("rgb");
}

function getContrastColor(color: string, dark = "#424242", light = "#ffffff"): string {
  const rgb = parseColor(color);
  if (!rgb) {
    return light;
  }

  const sum = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return sum >= 135 ? dark : light;
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith("#")) {
    const normalized = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;

    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
    if (!match) {
      return null;
    }

    return {
      r: Number.parseInt(match[1], 16),
      g: Number.parseInt(match[2], 16),
      b: Number.parseInt(match[3], 16),
    };
  }

  const match = color.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) {
    return null;
  }

  return {
    r: Number.parseInt(match[1], 10),
    g: Number.parseInt(match[2], 10),
    b: Number.parseInt(match[3], 10),
  };
}

function roundPrice(price: number, step?: number, precision?: number): number {
  if (!step) {
    return price;
  }

  const stepDifference = price % step;
  const previousValue = price - stepDifference;
  const roundedPrice = stepDifference > step / 2 ? previousValue + step : previousValue;

  if (precision !== undefined) {
    return Number.parseFloat(roundedPrice.toFixed(precision));
  }

  return roundedPrice;
}

function getPriceFromTick(tick: TickLike, priceSide?: string): number {
  if (priceSide === "ASK" && typeof tick.ask === "number") {
    return tick.ask;
  }

  if (typeof tick.bid === "number") {
    return tick.bid;
  }

  if (typeof tick.price === "number") {
    return tick.price;
  }

  throw new Error("Both price and bid are not available");
}

function isOrderWaiting(order: OrderLike): boolean {
  return order.status === "HELD" || order.status === "PENDING";
}

function openWindowWithUrl(url: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const target = isSmallScreen() ? "_self" : "_blank";
  const opened = window.open(url, target, target === "_blank" ? "noopener,noreferrer" : undefined);

  if (!opened && target === "_self") {
    window.location.assign(url);
  }
}

export default class WebRCPUtils {
  dateTimeFormatter: DateTimeFormatter;
  colorManager: ColorManager;
  getContrastColor: typeof getContrastColor;
  getMessages: (locale: LocaleDictionary) => Messages;
  getPriceFromTick: typeof getPriceFromTick;
  isOrderWaiting: typeof isOrderWaiting;
  openWindowWithUrl: typeof openWindowWithUrl;
  roundPrice: typeof roundPrice;

  constructor() {
    this.dateTimeFormatter = new DateTimeFormatter();
    this.colorManager = new ColorManager(defaultTheme, "dark");
    this.getContrastColor = getContrastColor;
    this.getMessages = (locale: LocaleDictionary) => new Messages(locale);
    this.getPriceFromTick = getPriceFromTick;
    this.isOrderWaiting = isOrderWaiting;
    this.openWindowWithUrl = openWindowWithUrl;
    this.roundPrice = roundPrice;
  }
}

export type { LocaleDictionary, ThemePalette };