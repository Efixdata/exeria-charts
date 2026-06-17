import { expect, test } from "@playwright/test";

test.describe("Twelve Data Connector", () => {
  test.setTimeout(60_000);

  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/twelve-data");
    await expect(
      page.getByRole("heading", { name: "Twelve Data Connector", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/twelve-data-example");
    await expect(page.getByRole("heading", { name: "Twelve Data Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch forex symbol", async ({ page }) => {
    await page.goto("/twelve-data-example");
    await page.getByRole("button", { name: "GBPUSD", exact: true }).click();
    await expect(page.getByText("British Pound / US Dollar", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("can switch to stock symbol", async ({ page }) => {
    await page.goto("/twelve-data-example");
    await page.getByRole("button", { name: "AAPL", exact: true }).click();
    await expect(page.getByText("Apple Inc.", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 45_000,
    });
  });
});
