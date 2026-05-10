const defaultWatermarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="66" viewBox="0 0 240 66">
  <g opacity="0.15">
    <rect x="0" y="0" width="240" height="66" rx="8" fill="#0f172a" />
    <text x="120" y="39" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#ffffff">Chart</text>
  </g>
</svg>`;

export default function useGenerateWatermark(watermarkSvg?: string) {
  const svg64 = btoa(watermarkSvg || defaultWatermarkSvg);
  const b64Start = "data:image/svg+xml;base64,";
  const waterMark64 = b64Start + svg64;

  return { waterMark64 };
}
