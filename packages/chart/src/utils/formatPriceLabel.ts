import LIB from "./chartingCommons";

/** Minimum shared head length to enable compact ledger axis. */
export const PRICE_AXIS_PREFIX_MIN_LENGTH = 2;

/** Digits shown in the variable (suffix) column on compact axis. */
export const COMPACT_AXIS_SUFFIX_DIGITS = 3;

/** Strip trailing fractional zeros (e.g. 21650.00 → 21650). */
export function trimInsignificantFractionZeros(text: string): string {
  if (!text.includes(".")) {
    return text;
  }

  return text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

/** Full axis / last-price label (instrument precision, no compact suffix). */
export function formatFullAxisPrice(value: number, precision: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  const abs = Math.abs(value);
  if (abs > 999999) {
    return LIB.nFormatter(value, precision);
  }

  return trimInsignificantFractionZeros(value.toFixed(precision));
}

function parseFormattedPriceParts(formatted: string): {
  negative: boolean;
  intPart: string;
  fracPart: string;
} {
  const negative = formatted.startsWith("-");
  const body = negative ? formatted.slice(1) : formatted;
  const dotIndex = body.indexOf(".");

  if (dotIndex < 0) {
    return { negative, intPart: body, fracPart: "" };
  }

  return {
    negative,
    intPart: body.slice(0, dotIndex),
    fracPart: body.slice(dotIndex + 1),
  };
}

/** Integer head = all digits except the last {@link COMPACT_AXIS_SUFFIX_DIGITS}. */
export function integerHeadFromFormatted(formatted: string): string {
  const { negative, intPart } = parseFormattedPriceParts(formatted);
  if (intPart.length <= COMPACT_AXIS_SUFFIX_DIGITS) {
    return negative ? "-" : "";
  }

  const head = intPart.slice(0, intPart.length - COMPACT_AXIS_SUFFIX_DIGITS);
  return negative ? `-${head}` : head;
}

/** Longest common prefix across formatted price strings. */
export function computeValueAxisCommonPrefix(labels: string[]): string {
  const nonEmpty = labels.filter((label) => label.length > 0);
  if (nonEmpty.length < 2) {
    return "";
  }

  let prefix = nonEmpty[0];
  for (let i = 1; i < nonEmpty.length; i++) {
    const label = nonEmpty[i];
    let j = 0;
    while (j < prefix.length && j < label.length && prefix[j] === label[j]) {
      j++;
    }
    prefix = prefix.slice(0, j);
    if (prefix.length === 0) {
      return "";
    }
  }

  if (prefix.length < PRICE_AXIS_PREFIX_MIN_LENGTH) {
    return "";
  }

  return prefix;
}

export interface CompactAxisSplit {
  head: string;
  suffix: string;
  full: string;
}

/** Split price into fixed head column + suffix column (integer digits only). */
export function splitCompactAxisByHead(
  value: number,
  precision: number,
  headPrefix: string,
): CompactAxisSplit {
  const full = formatFullAxisPrice(value, precision);
  const { negative, intPart, fracPart } = parseFormattedPriceParts(full);
  const sign = negative ? "-" : "";

  if (headPrefix.length === 0 || intPart.length <= headPrefix.length) {
    return { head: "", suffix: full, full };
  }

  if (!intPart.startsWith(headPrefix)) {
    if (intPart.length <= COMPACT_AXIS_SUFFIX_DIGITS) {
      return { head: "", suffix: full, full };
    }

    const fallbackHead = intPart.slice(0, intPart.length - COMPACT_AXIS_SUFFIX_DIGITS);
    const fallbackSuffix = intPart.slice(-COMPACT_AXIS_SUFFIX_DIGITS);
    const suffix = fracPart ? `${fallbackSuffix}.${fracPart}` : fallbackSuffix;
    return { head: `${sign}${fallbackHead}`, suffix, full };
  }

  const intSuffix = intPart.slice(headPrefix.length);
  const suffix = fracPart ? `${intSuffix}.${fracPart}` : intSuffix;

  return {
    head: `${sign}${headPrefix}`,
    suffix,
    full,
  };
}

/** Shared integer head for all tick values on the visible axis. */
export function deriveCompactAxisHeadPrefix(values: number[], precision: number): string {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) {
    return "";
  }

  const heads = finite.map((value) =>
    integerHeadFromFormatted(formatFullAxisPrice(value, precision)),
  );

  const sorted = [...finite].sort((left, right) => left - right);
  const minHead = integerHeadFromFormatted(formatFullAxisPrice(sorted[0], precision));
  const maxHead = integerHeadFromFormatted(
    formatFullAxisPrice(sorted[sorted.length - 1], precision),
  );

  const rangePrefix = computeValueAxisCommonPrefix([minHead, maxHead].filter(Boolean));
  if (rangePrefix.length >= PRICE_AXIS_PREFIX_MIN_LENGTH) {
    return rangePrefix;
  }

  return computeValueAxisCommonPrefix(heads);
}

export interface ValueAxisLabelLayout {
  prefix: string;
  usePrefixHeader: boolean;
}

/** True when every value shares the same integer head under {@link headPrefix}. */
export function valuesShareCompactHead(
  values: number[],
  precision: number,
  headPrefix: string,
): boolean {
  if (headPrefix.length < PRICE_AXIS_PREFIX_MIN_LENGTH) {
    return false;
  }

  return values.every((value) => {
    const { intPart } = parseFormattedPriceParts(formatFullAxisPrice(value, precision));
    return intPart.length > headPrefix.length && intPart.startsWith(headPrefix);
  });
}

export function layoutValueAxisLabels(
  values: number[],
  precision: number,
  expanded: boolean,
): ValueAxisLabelLayout {
  if (expanded) {
    return { prefix: "", usePrefixHeader: false };
  }

  const prefix = deriveCompactAxisHeadPrefix(values, precision);
  const usePrefixHeader =
    prefix.length >= PRICE_AXIS_PREFIX_MIN_LENGTH &&
    valuesShareCompactHead(values, precision, prefix);

  return {
    prefix: usePrefixHeader ? prefix : "",
    usePrefixHeader,
  };
}

/** @deprecated Use splitCompactAxisByHead */
export function splitCompactAxisLabel(
  fullLabel: string,
  prefix: string,
): { head: string; suffix: string } {
  if (prefix.length > 0 && fullLabel.startsWith(prefix)) {
    const suffix = fullLabel.slice(prefix.length);
    if (suffix.length > 0) {
      return { head: prefix, suffix };
    }
  }

  return { head: "", suffix: fullLabel };
}

/** @deprecated Use deriveCompactAxisHeadPrefix */
export const deriveCompactAxisPrefix = deriveCompactAxisHeadPrefix;

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
  options: { expanded?: boolean; prefix?: string },
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  const abs = Math.abs(value);
  if (abs > 999999) {
    return LIB.nFormatter(value, precision);
  }

  if (options.expanded === true) {
    return formatFullAxisPrice(value, precision);
  }

  const headPrefix = options.prefix ?? "";
  if (headPrefix.length >= PRICE_AXIS_PREFIX_MIN_LENGTH) {
    return splitCompactAxisByHead(value, precision, headPrefix).suffix;
  }

  const rounded = Number(value.toFixed(precision));
  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(Math.round(rounded)));
  if (digits.length <= COMPACT_AXIS_SUFFIX_DIGITS) {
    return `${sign}${digits}`;
  }

  return `${sign}${digits.slice(-COMPACT_AXIS_SUFFIX_DIGITS)}`;
}
