import { expect, test, type Page } from "@playwright/test";

async function mockKrakenApi(page: Page): Promise<void> {
  const pairKey = "XXBTZUSD";
  const nowSec = Math.floor(Date.now() / 1000);
  const ohlcRows = Array.from({ length: 30 }, (_, index) => {
    const time = nowSec - (30 - index) * 86_400;
    const price = 60_000 + index * 100;
    return [
      time,
      price.toFixed(1),
      (price + 80).toFixed(1),
      (price - 60).toFixed(1),
      (price + 20).toFixed(1),
      (price + 10).toFixed(1),
      "12.5",
      42,
    ];
  });

  await page.route("**/api.kraken.com/0/public/OHLC**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        error: [],
        result: {
          [pairKey]: ohlcRows,
          last: nowSec,
        },
      }),
    });
  });

  await page.route("**/api.kraken.com/0/public/Ticker**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        error: [],
        result: {
          [pairKey]: {
            c: ["62869.5", "0.1"],
            v: ["1000", "2000"],
          },
        },
      }),
    });
  });
}

test.describe("Kraken Data Connector", () => {
  test.beforeEach(async ({ page }) => {
    await mockKrakenApi(page);
  });

  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/kraken");
    await expect(page.getByRole("heading", { name: "Kraken Data Connector" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/kraken-example");
    await expect(page.getByRole("heading", { name: "Kraken Data Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });
});
