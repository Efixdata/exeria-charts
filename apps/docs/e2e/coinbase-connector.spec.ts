import { expect, test, type Page } from "@playwright/test";

async function mockCoinbaseProxy(page: Page): Promise<void> {
  const now = Date.now();
  const candles = Array.from({ length: 30 }, (_, index) => {
    const stamp = now - (30 - index) * 86_400_000;
    const price = 60_000 + index * 100;

    return {
      stamp,
      o: price - 10,
      h: price + 50,
      l: price - 50,
      c: price,
      v: 12.5,
    };
  });

  await page.route("**/api/coinbase/ohlcv**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ candles }),
    });
  });

  await page.route("**/api/coinbase/ticker**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tick: {
          stamp: now,
          c: 62_869.5,
          price: 62_869.5,
        },
      }),
    });
  });
}

test.describe("Coinbase Connector", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinbaseProxy(page);
  });

  test.setTimeout(60_000);

  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/coinbase");
    await expect(
      page.getByRole("heading", { name: "Coinbase Data Connector", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/coinbase-example");
    await expect(page.getByRole("heading", { name: "Coinbase Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch to ETH-USD symbol", async ({ page }) => {
    await page.goto("/coinbase-example");
    await page.getByRole("button", { name: "ETH", exact: true }).click();
    await expect(page.getByText("Ethereum / USD", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch to USDC pair", async ({ page }) => {
    await page.goto("/coinbase-example");
    await page.getByRole("button", { name: "BTCC", exact: true }).click();
    await expect(page.getByText("Bitcoin / USDC", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });
});
