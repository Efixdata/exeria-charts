import { expect, test, type Page } from "@playwright/test";

async function mockMassiveProxy(page: Page): Promise<void> {
  const now = Date.now();
  const candles = Array.from({ length: 30 }, (_, index) => {
    const stamp = now - (30 - index) * 86_400_000;
    const price = 150 + index;
    return {
      stamp,
      o: price - 1,
      h: price + 2,
      l: price - 2,
      c: price,
      v: 1_000_000,
    };
  });

  await page.route("**/api/massive/ohlcv**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ candles }),
    });
  });

  await page.route("**/api/massive/ticker**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tick: {
          stamp: now,
          c: 189.42,
          price: 189.42,
        },
      }),
    });
  });
}

test.describe("Massive Connector", () => {
  test.beforeEach(async ({ page }) => {
    await mockMassiveProxy(page);
  });

  test.setTimeout(60_000);

  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/massive");
    await expect(
      page.getByRole("heading", { name: "Massive Connector", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/massive-example");
    await expect(page.getByRole("heading", { name: "Massive Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch stock symbol", async ({ page }) => {
    await page.goto("/massive-example");
    await page.getByRole("button", { name: "MSFT", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Microsoft" })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch forex symbol", async ({ page }) => {
    await page.goto("/massive-example");
    await page.getByRole("button", { name: "EUR/USD", exact: true }).click();
    await expect(page.getByText("Euro / US Dollar", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch crypto symbol", async ({ page }) => {
    await page.goto("/massive-example");
    await page.getByRole("button", { name: "BTC-USD", exact: true }).click();
    await expect(page.getByText("Bitcoin / USD", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });
});
