import { expect, test } from "@playwright/test";

test.describe("Data Bridges page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-bridges");
    await page.waitForSelector("#catalog");
  });

  test("renders catalog, search, and comparison list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Bridge catalog" })).toBeVisible();
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.getByRole("table", { name: "Bridge comparison" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Binance", exact: true })).toBeVisible();
  });

  test("filters bridges via search", async ({ page }) => {
    const status = page.locator("#bridge-results-status");
    await page.getByRole("searchbox").fill("CoinGecko");
    await expect(status).toContainText("1 bridge");
    await expect(page.getByRole("heading", { name: "CoinGecko", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Binance", exact: true })).toHaveCount(0);
  });

  test("updates integration snippet when hovering a bridge card", async ({ page }) => {
    const snippet = page.getByTestId("integration-snippet").locator("pre");
    await expect(snippet).toContainText("createBinanceBridge");

    await page.getByRole("heading", { name: "CoinGecko", exact: true }).hover();
    await expect(snippet).toContainText("createCoingeckoBridge");
  });

  test("highlights bridge card from URL hash", async ({ page }) => {
    await page.goto("/data-bridges#coingecko");
    await page.waitForSelector("#coingecko");

    const card = page.locator("#coingecko");
    await expect(card).toHaveAttribute("data-highlighted", "true");
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText("createCoingeckoBridge");
  });

  test("visual snapshot of hero and catalog toolbar", async ({ page }) => {
    await expect(page.locator("#catalog")).toHaveScreenshot("data-bridges-catalog.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
