import { expect, test, type Page } from "@playwright/test";

async function mockCoingeckoApi(page: Page): Promise<void> {
  const ohlc = Array.from({ length: 30 }, (_, index) => {
    const stamp = Date.now() - (30 - index) * 86_400_000;
    const price = 60_000 + index * 100;
    return [stamp, price, price + 80, price - 60, price + 20];
  });

  await page.route("**/api.coingecko.com/api/v3/coins/*/ohlc**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ohlc),
    });
  });

  await page.route("**/api.coingecko.com/api/v3/simple/price**", async (route) => {
    const url = new URL(route.request().url());
    const ids = url.searchParams.get("ids")?.split(",") ?? ["bitcoin"];
    const body: Record<string, { usd: number; last_updated_at: number }> = {};

    for (const id of ids) {
      body[id] = {
        usd: 62_869,
        last_updated_at: Math.floor(Date.now() / 1000),
      };
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

test.describe("CoinGecko Data Connector", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoingeckoApi(page);
  });

  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/coingecko");
    await expect(
      page.getByRole("heading", { name: "CoinGecko Data Connector" }),
    ).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/coingecko-example");
    await expect(
      page.getByRole("heading", { name: "CoinGecko Data Connector Demo" }),
    ).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });
});
