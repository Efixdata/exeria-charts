/**
 * CoinGecko uses lowercase coin ids (e.g. "bitcoin"), not exchange trading pairs.
 */
export function normalizeCoinId(symbol: string): string {
  return symbol.trim().toLowerCase();
}
