import { expect, test } from "@playwright/test";

test.describe("OKX Data Connector", () => {
  test("docs page renders interactive example", async ({ page }) => {
    await page.goto("/docs/data-connectors/okx");
    await expect(page.getByRole("heading", { name: "OKX Data Connector" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("standalone demo page loads chart data", async ({ page }) => {
    await page.goto("/okx-example");
    await expect(page.getByRole("heading", { name: "OKX Data Connector Demo" })).toBeVisible();
    await expect(page.getByText("Candles Loaded", { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  });
});
