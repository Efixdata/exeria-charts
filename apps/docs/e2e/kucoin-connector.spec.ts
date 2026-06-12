import { expect, test, type Page } from "@playwright/test";

async function mockKucoinApi(page: Page): Promise<void> {
  const nowSec = Math.floor(Date.now() / 1000);
  const klineRows = Array.from({ length: 30 }, (_, index) => {
    const time = nowSec - (30 - index) * 86_400;
    const price = 60_000 + index * 100;
    return [
      time.toString(),
      price.toFixed(1),
      (price + 20).toFixed(1),
      (price + 80).toFixed(1),
      (price - 60).toFixed(1),
      "12.5",
      "750000",
    ];
  });

  await page.route("**/api.kucoin.com/api/v1/market/candles**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: "200000",
        data: klineRows,
      }),
    });
  });

  await page.route("**/api.kucoin.com/api/v1/market/orderbook/level1**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: "200000",
        data: {
          time: Date.now(),
          price: "62869.5",
          size: "0.01",
          bestBid: "62869.0",
          bestBidSize: "0.01",
          bestAsk: "62869.5",
          bestAskSize: "1.0",
        },
      }),
    });
  });

  await page.route("**/api.kucoin.com/api/v1/bullet-public**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: "200000",
        data: {
          token: "mock-kucoin-ws-token",
          instanceServers: [
            {
              endpoint: "wss://ws-api-spot.kucoin.com/",
              encrypt: true,
              protocol: "websocket",
              pingInterval: 18000,
              pingTimeout: 10000,
            },
          ],
        },
      }),
    });
  });
}

test.describe("KuCoin Data Connector", () => {
  test.beforeEach(async ({ page }) => {
    await mockKucoinApi(page);
  });

  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/kucoin");
    await expect(page.getByRole("heading", { name: "KuCoin Data Connector" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/kucoin-example");
    await expect(page.getByRole("heading", { name: "KuCoin Data Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });
});
