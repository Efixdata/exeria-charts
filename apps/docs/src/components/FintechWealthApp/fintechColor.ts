export function dimColor(hex: string, factor = 0.28): string {
  const normalized = hex.replace("#", "");
  const safe =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => value + value)
          .join("")
      : normalized.slice(0, 6);

  const channel = (start: number) => Number.parseInt(safe.slice(start, start + 2), 16);
  const toHex = (value: number) =>
    Math.min(255, Math.max(0, Math.round(value)))
      .toString(16)
      .padStart(2, "0");

  const mix = (value: number) => value * factor + 34 * (1 - factor);

  return `#${toHex(mix(channel(0)))}${toHex(mix(channel(2)))}${toHex(mix(channel(4)))}`;
}
