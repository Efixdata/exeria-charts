import { expect, test } from "@playwright/test";

test.describe("Docs sidebar search", () => {
  test("desktop suggestions are spaced and stay in sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("tick");
    await page.waitForTimeout(500);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible();
    const count = await suggestions.count();
    expect(count).toBeGreaterThan(1);

    const firstBox = await suggestions.nth(0).boundingBox();
    const secondBox = await suggestions.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(secondBox!.y - (firstBox!.y + firstBox!.height)).toBeGreaterThan(2);

    const dropdownParent = await searchRoot
      .locator('[class*="dropdownMenu"]')
      .evaluate((el) => el.parentElement?.className ?? "");
    expect(dropdownParent).toMatch(/searchBar/);

    const sidebarClipPath = await page
      .locator(".theme-doc-sidebar-container")
      .evaluate((el) => getComputedStyle(el).clipPath);
    expect(sidebarClipPath).toBe("none");

    const dropdownBorder = await searchRoot
      .locator('[class*="dropdownMenu"]')
      .evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(dropdownBorder).not.toBe("0px");
  });

  test("finds OKX connector documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("OKX");
    await page.waitForTimeout(500);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible();
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("OKX");
  });

  test("finds CoinGecko connector documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("CoinGecko");
    await page.waitForTimeout(500);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible();
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("CoinGecko");
  });

  test("finds Kraken connector documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("Kraken");
    await page.waitForTimeout(500);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible();
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("Kraken");
  });

  test("finds Coinbase connector documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("Coinbase");
    await page.waitForTimeout(1000);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 10_000 });
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("Coinbase");
  });

  test("finds coinbase adapter documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("coinbase adapter");
    await page.waitForTimeout(1000);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 10_000 });
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("Coinbase");
  });

  test("finds EODHD connector documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("EODHD");
    await page.waitForTimeout(1000);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 10_000 });
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("EODHD");
  });

  test("finds eodhd adapter documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("eodhd adapter");
    await page.waitForTimeout(1000);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 10_000 });
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("EODHD");
  });

  test("finds Gate.io connector documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("Gate.io");
    await page.waitForTimeout(1000);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 10_000 });
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("Gate.io");
  });

  test("finds gate adapter documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("gate adapter");
    await page.waitForTimeout(1000);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 10_000 });
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("Gate.io");
  });

  test("finds KuCoin connector documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("KuCoin");
    await page.waitForTimeout(500);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible();
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("KuCoin");
  });

  test("finds Massive connector documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("Massive");
    await page.waitForTimeout(1000);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 10_000 });
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("Massive");
  });

  test("finds massive adapter documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("adapter-massive");
    await page.waitForTimeout(1000);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 10_000 });
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("Massive");
  });

  test("finds polygon adapter documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("Polygon.io");
    await page.waitForTimeout(1000);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 10_000 });
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("Massive");
  });

  test("finds kucoin adapter documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("kucoin adapter");
    await page.waitForTimeout(500);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible();
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("KuCoin");
  });

  test("finds kraken adapter documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("kraken adapter");
    await page.waitForTimeout(500);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible();
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("Kraken");
  });

  test("finds coingecko adapter documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("coingecko adapter");
    await page.waitForTimeout(500);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible();
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("CoinGecko");
  });

  test("finds Bybit connector documentation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/docs/intro");
    await page.waitForLoadState("networkidle");

    const searchRoot = page.locator(".theme-doc-sidebar-container [data-docs-sidebar-search]");
    const searchInput = searchRoot.locator(".navbar__search-input");
    await searchInput.click();
    await searchInput.fill("Bybit");
    await page.waitForTimeout(500);

    const suggestions = searchRoot.locator('[class*="dropdownMenu"] [class*="suggestion_"]');
    await expect(suggestions.first()).toBeVisible();
    await expect(searchRoot.locator('[class*="dropdownMenu"]')).toContainText("Bybit");
  });
});
