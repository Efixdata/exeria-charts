import LIB from "./chartingCommons";

/** Minimum shared prefix length before compact axis header is shown. */
export const PRICE_AXIS_PREFIX_MIN_LENGTH = 2;

const COMPACT_AXIS_SUFFIX_LENGTH = 3;

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

export interface ValueAxisLabelLayout {
  prefix: string;
  usePrefixHeader: boolean;
}

function labelHeadWithoutSuffix(label: string, suffixLength: number): string {
  const negative = label.startsWith("-");
  const body = negative ? label.slice(1) : label;
  if (body.length <= suffixLength) {
    return "";
  }

  const head = body.slice(0, body.length - suffixLength);
  return negative ? `-${head}` : head;
}

/** Fallback prefix: shared high-order digits when tick LCP is too short (e.g. 203xx). */
export function deriveCompactAxisPrefix(values: number[], precision: number): string {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) {
    return "";
  }

  const fullLabels = finite.map((value) => formatFullAxisPrice(value, precision));
  const tickPrefix = computeValueAxisCommonPrefix(fullLabels);
  if (tickPrefix.length >= PRICE_AXIS_PREFIX_MIN_LENGTH) {
    return tickPrefix;
  }

  const sorted = [...finite].sort((left, right) => left - right);
  const minLabel = formatFullAxisPrice(sorted[0], precision);
  const maxLabel = formatFullAxisPrice(sorted[sorted.length - 1], precision);
  const minHead = labelHeadWithoutSuffix(minLabel, COMPACT_AXIS_SUFFIX_LENGTH);
  const maxHead = labelHeadWithoutSuffix(maxLabel, COMPACT_AXIS_SUFFIX_LENGTH);
  const rangeHeadPrefix = computeValueAxisCommonPrefix([minHead, maxHead].filter(Boolean));
  if (rangeHeadPrefix.length >= PRICE_AXIS_PREFIX_MIN_LENGTH) {
    return rangeHeadPrefix;
  }

  const referenceLabel = formatFullAxisPrice(
    sorted[Math.floor(sorted.length / 2)],
    precision,
  );
  const head = labelHeadWithoutSuffix(referenceLabel, COMPACT_AXIS_SUFFIX_LENGTH);
  return head.length >= PRICE_AXIS_PREFIX_MIN_LENGTH ? head : "";
}

export function layoutValueAxisLabels(
  values: number[],
  precision: number,
  expanded: boolean,
): ValueAxisLabelLayout {
  if (expanded) {
    return { prefix: "", usePrefixHeader: false };
  }

  const prefix = deriveCompactAxisPrefix(values, precision);
  return {
    prefix,
    usePrefixHeader: prefix.length >= PRICE_AXIS_PREFIX_MIN_LENGTH,
  };
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

  const full = formatFullAxisPrice(value, precision);
  const prefix = options.prefix ?? "";

  if (prefix.length > 0 && full.startsWith(prefix)) {
    const suffix = full.slice(prefix.length);
    if (suffix.length > 0) {
      return suffix;
    }
  }

  const rounded = Number(value.toFixed(precision));
  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(Math.round(rounded)));
  if (digits.length <= 3) {
    return `${sign}${digits}`;
  }

  return `${sign}${digits.slice(-3)}`;
}
