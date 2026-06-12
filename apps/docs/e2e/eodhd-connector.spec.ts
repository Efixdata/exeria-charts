import { expect, test, type Page } from "@playwright/test";

function buildMockCandles(count = 30) {
  const now = Date.now();

  return Array.from({ length: count }, (_, index) => {
    const stamp = now - (count - index) * 86_400_000;
    const price = 180 + index;

    return {
      stamp,
      o: price,
      h: price + 2,
      l: price - 2,
      c: price + 1,
      v: 1_000_000 + index * 1000,
    };
  });
}

async function mockEodhdProxy(page: Page): Promise<void> {
  const candles = buildMockCandles();
  const last = candles[candles.length - 1]!;

  await page.route("**/api/eodhd/ohlcv**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ candles }),
    });
  });

  await page.route("**/api/eodhd/ticker**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tick: {
          stamp: last.stamp,
          c: last.c,
          price: last.c,
        },
      }),
    });
  });
}

test.describe("EODHD Connector", () => {
  test.beforeEach(async ({ page }) => {
    await mockEodhdProxy(page);
  });

  test.setTimeout(60_000);

  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/eodhd");
    await expect(
      page.getByRole("heading", { name: "EODHD Connector", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/eodhd-example");
    await expect(page.getByRole("heading", { name: "EODHD Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch forex symbol", async ({ page }) => {
    await page.goto("/eodhd-example");
    await page.getByRole("button", { name: "EUR/USD", exact: true }).click();
    await expect(page.getByText("Euro / US Dollar", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch to crypto symbol", async ({ page }) => {
    await page.goto("/eodhd-example");
    await page.getByRole("button", { name: "BTC-USD", exact: true }).click();
    await expect(page.getByText("Bitcoin / US Dollar", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });
});
