import { expect, test } from "@playwright/test";
import { legacyRedirects } from "../legacyRedirects";

test.describe("Legacy URL redirects", () => {
  for (const { from, to } of legacyRedirects) {
    test(`redirects ${from} to ${to}`, async ({ page }) => {
      await page.goto(from);
      await page.waitForURL(`**${to}`);
      expect(page.url()).toContain(to);
    });
  }

  test("redirects /data-bridges to /data-connectors", async ({ page }) => {
    await page.goto("/data-bridges");
    await page.waitForURL("**/data-connectors");
    expect(page.url()).toContain("/data-connectors");
  });

  test("redirects /data-bridges with hash to /data-connectors", async ({ page }) => {
    await page.goto("/data-bridges#coingecko");
    await page.waitForURL("**/data-connectors**");
    expect(page.url()).toContain("/data-connectors");
    expect(page.url()).toContain("#coingecko");
  });

  test("redirects /data-bridges with Bybit hash to /data-connectors", async ({ page }) => {
    await page.goto("/data-bridges#bybit-public");
    await page.waitForURL("**/data-connectors**");
    expect(page.url()).toContain("/data-connectors");
    expect(page.url()).toContain("#bybit-public");
  });

  test("redirects /data-bridges with OKX hash to /data-connectors", async ({ page }) => {
    await page.goto("/data-bridges#okx-public");
    await page.waitForURL("**/data-connectors**");
    expect(page.url()).toContain("/data-connectors");
    expect(page.url()).toContain("#okx-public");
  });

  test("redirects /data-bridges with Kraken hash to /data-connectors", async ({ page }) => {
    await page.goto("/data-bridges#kraken-public");
    await page.waitForURL("**/data-connectors**");
    expect(page.url()).toContain("/data-connectors");
    expect(page.url()).toContain("#kraken-public");
  });

  test("redirects /data-bridges with KuCoin hash to /data-connectors", async ({ page }) => {
    await page.goto("/data-bridges#kucoin-public");
    await page.waitForURL("**/data-connectors**");
    expect(page.url()).toContain("/data-connectors");
    expect(page.url()).toContain("#kucoin-public");
  });

  test("redirects /data-bridges with Massive hash to /data-connectors", async ({ page }) => {
    await page.goto("/data-bridges#massive-public");
    await page.waitForURL("**/data-connectors**");
    expect(page.url()).toContain("/data-connectors");
    expect(page.url()).toContain("#massive-public");
  });

  test("redirects /data-bridges with Coinbase hash to /data-connectors", async ({ page }) => {
    await page.goto("/data-bridges#coinbase-public");
    await page.waitForURL("**/data-connectors**");
    expect(page.url()).toContain("/data-connectors");
    expect(page.url()).toContain("#coinbase-public");
  });

  test("redirects /data-bridges with Gate.io hash to /data-connectors", async ({ page }) => {
    await page.goto("/data-bridges#gate-public");
    await page.waitForURL("**/data-connectors**");
    expect(page.url()).toContain("/data-connectors");
    expect(page.url()).toContain("#gate-public");
  });

  test("redirects /data-bridges with EODHD hash to /data-connectors", async ({ page }) => {
    await page.goto("/data-bridges#eodhd");
    await page.waitForURL("**/data-connectors**");
    expect(page.url()).toContain("/data-connectors");
    expect(page.url()).toContain("#eodhd");
  });
});
