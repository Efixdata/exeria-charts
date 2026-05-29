import LIB from "./chartingCommons";

/** Strip trailing fractional zeros (e.g. 21650.00 → 21650). */
export function trimInsignificantFractionZeros(text: string): string {
  if (!text.includes(".")) {
    return text;
  }

  return text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

/** Format axis price with limited significant digits on narrow layouts. */
export function formatCompactAxisPrice(
  value: number,
  precision: number,
  significantDigits = 3,
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return LIB.nFormatter(value, Math.min(precision, 2));
  }

  if (abs === 0) {
    return "0";
  }

  const order = Math.floor(Math.log10(abs));
  const fractionDigits = Math.max(0, significantDigits - order - 1);
  const rounded = Number(value.toFixed(fractionDigits));

  return String(rounded);
}

export function formatValueAxisPriceLabel(
  value: number,
  precision: number,
  options: { expanded?: boolean },
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  const abs = Math.abs(value);
  if (abs > 999999) {
    return LIB.nFormatter(value, precision);
  }

  if (options.expanded === true) {
    return trimInsignificantFractionZeros(value.toFixed(precision));
  }

  const rounded = Number(value.toFixed(precision));
  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(Math.round(rounded)));
  if (digits.length <= 3) {
    return `${sign}${digits}`;
  }

  return `${sign}${digits.slice(-3)}`;
}
