import { expect, test, type Page } from "@playwright/test";

function buildMockCandles(count = 30) {
  const now = Date.now();

  return Array.from({ length: count }, (_, index) => {
    const stamp = now - (count - index) * 86_400_000;
    const price = 60_000 + index * 100;

    return {
      stamp,
      o: price,
      h: price + 50,
      l: price - 50,
      c: price - 10,
      v: 12.5,
    };
  });
}

async function mockGateProxy(page: Page): Promise<void> {
  const candles = buildMockCandles();
  const last = candles[candles.length - 1]!;

  await page.route("**/api/gate/ohlcv**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ candles }),
    });
  });

  await page.route("**/api/gate/ticker**", async (route) => {
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

test.describe("Gate.io Connector", () => {
  test.beforeEach(async ({ page }) => {
    await mockGateProxy(page);
  });

  test.setTimeout(60_000);

  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/gate");
    await expect(
      page.getByRole("heading", { name: "Gate.io Data Connector", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/gate-example");
    await expect(page.getByRole("heading", { name: "Gate.io Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch to ETH_USDT symbol", async ({ page }) => {
    await page.goto("/gate-example");
    await page.getByRole("button", { name: "ETH", exact: true }).click();
    await expect(page.getByText("Ethereum / USDT", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });
});
