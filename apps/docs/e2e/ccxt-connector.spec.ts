import { expect, test } from "@playwright/test";

test.describe("CCXT Data Connector", () => {
  test.setTimeout(60_000);
  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/ccxt");
    await expect(
      page.getByRole("heading", { name: "CCXT Data Connector", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/ccxt-example");
    await expect(page.getByRole("heading", { name: "CCXT Data Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch to Binance dedicated connector", async ({ page }) => {
    await page.goto("/ccxt-example");
    await page.getByRole("button", { name: "Binance", exact: true }).click();
    await expect(page.getByText("Dedicated connector with WebSocket", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });
});
