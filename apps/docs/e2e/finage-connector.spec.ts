import { expect, test } from "@playwright/test";

test.describe("Finage Connector", () => {
  test.setTimeout(60_000);

  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/finage");
    await expect(
      page.getByRole("heading", { name: "Finage Connector", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/finage-example");
    await expect(page.getByRole("heading", { name: "Finage Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch forex symbol", async ({ page }) => {
    await page.goto("/finage-example");
    await page.getByRole("button", { name: "GBPUSD", exact: true }).click();
    await expect(page.getByText("British Pound / US Dollar", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch to ETF symbol", async ({ page }) => {
    await page.goto("/finage-example");
    await page.getByRole("button", { name: "SPY", exact: true }).click();
    await expect(page.getByText("SPDR S&P 500 ETF", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });
});
