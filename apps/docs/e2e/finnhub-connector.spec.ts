import { expect, test } from "@playwright/test";

test.describe("Finnhub Connector", () => {
  test.setTimeout(60_000);

  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/finnhub");
    await expect(
      page.getByRole("heading", { name: "Finnhub Connector", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/finnhub-example");
    await expect(page.getByRole("heading", { name: "Finnhub Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch forex symbol", async ({ page }) => {
    await page.goto("/finnhub-example");
    await page.getByRole("button", { name: "EUR/USD", exact: true }).click();
    await expect(page.getByText("Euro / US Dollar", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch to crypto symbol", async ({ page }) => {
    await page.goto("/finnhub-example");
    await page.getByRole("button", { name: "BTCUSDT", exact: true }).click();
    await expect(page.getByText("Bitcoin / Tether", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });
});
