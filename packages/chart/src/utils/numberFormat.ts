/** Strip trailing fractional zeros (e.g. 64.900000 → 64.9, 40900.00 → 40900). */
export function trimInsignificantFractionZeros(text: string): string {
  if (!text.includes(".")) {
    return text;
  }

  return text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

/** Format a price for labels/tags: instrument cap, no padded trailing zeros. */
export function formatDataPrice(value: number, maxPrecision: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (maxPrecision <= 0) {
    return String(Math.round(value));
  }

  const factor = 10 ** maxPrecision;
  const rounded = Math.round(value * factor) / factor;
  return trimInsignificantFractionZeros(rounded.toFixed(maxPrecision));
}
