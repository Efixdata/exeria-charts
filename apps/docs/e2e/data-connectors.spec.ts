import { expect, test } from "@playwright/test";

test.describe("Data Connectors page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-connectors");
    await page.waitForSelector("#catalog");
  });

  test("renders catalog, search, and comparison list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Connector catalog" })).toBeVisible();
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.getByRole("table", { name: "Connector comparison" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Binance", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bybit", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "OKX", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kraken", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "KuCoin", exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "CCXT (multi-exchange)", exact: true }),
    ).toBeVisible();
  });

  test("filters connectors via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("CoinGecko");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "CoinGecko", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Binance", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Bybit", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "OKX", exact: true })).toHaveCount(0);
  });

  test("filters Bybit connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("Bybit");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "Bybit", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText("BybitAdapter");
  });

  test("filters Twelve Data connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("Twelve Data");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "Twelve Data", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "createTwelveDataAdapter",
    );
  });

  test("filters Finage connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("Finage");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "Finage", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "createFinageAdapter",
    );
  });

  test("filters Massive connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("adapter-massive");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "Massive", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "MassiveAdapter",
    );
  });

  test("filters CCXT connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("CCXT");
    await expect(status).toContainText("1 connector");
    await expect(
      page.getByRole("heading", { name: "CCXT (multi-exchange)", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "createCcxtAdapter",
    );
  });

  test("filters CoinGecko connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("CoinGecko");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "CoinGecko", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "CoingeckoAdapter",
    );
  });

  test("filters OKX connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("OKX");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "OKX", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText("OkxAdapter");
  });

  test("filters Kraken connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("adapter-kraken");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "Kraken", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "KrakenAdapter",
    );
  });

  test("filters KuCoin connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("adapter-kucoin");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "KuCoin", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "KucoinAdapter",
    );
  });

  test("filters Coinbase connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("adapter-coinbase");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "Coinbase", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "CoinbaseAdapter",
    );
  });

  test("filters Gate.io connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("adapter-gate");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "Gate.io", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "GateAdapter",
    );
  });

  test("filters EODHD connector via search", async ({ page }) => {
    const status = page.locator("#connector-results-status");
    await page.getByRole("searchbox").fill("adapter-eodhd");
    await expect(status).toContainText("1 connector");
    await expect(page.getByRole("heading", { name: "EODHD", exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "createEodhdAdapter",
    );
  });

  test("updates integration snippet when hovering a connector card", async ({ page }) => {
    const snippet = page.getByTestId("integration-snippet").locator("pre");
    await expect(snippet).toContainText("BinanceAdapter");

    await page.getByRole("heading", { name: "Bybit", exact: true }).hover();
    await expect(snippet).toContainText("BybitAdapter");

    await page.getByRole("heading", { name: "OKX", exact: true }).hover();
    await expect(snippet).toContainText("OkxAdapter");

    await page.getByRole("heading", { name: "Kraken", exact: true }).hover();
    await expect(snippet).toContainText("KrakenAdapter");

    await page.getByRole("heading", { name: "KuCoin", exact: true }).hover();
    await expect(snippet).toContainText("KucoinAdapter");

    await page.getByRole("heading", { name: "Coinbase", exact: true }).hover();
    await expect(snippet).toContainText("CoinbaseAdapter");

    await page.getByRole("heading", { name: "Gate.io", exact: true }).hover();
    await expect(snippet).toContainText("GateAdapter");

    await page.getByRole("heading", { name: "EODHD", exact: true }).hover();
    await expect(snippet).toContainText("createEodhdAdapter");

    await page.getByRole("heading", { name: "Massive", exact: true }).hover();
    await expect(snippet).toContainText("MassiveAdapter");

    await page.getByRole("heading", { name: "CoinGecko", exact: true }).hover();
    await expect(snippet).toContainText("CoingeckoAdapter");
  });

  test("highlights Bybit connector card from URL hash", async ({ page }) => {
    await page.goto("/data-connectors#bybit-public");
    await page.waitForSelector("#bybit-public");

    const card = page.locator("#bybit-public");
    await expect(card).toHaveAttribute("data-highlighted", "true");
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText("BybitAdapter");
  });

  test("highlights OKX connector card from URL hash", async ({ page }) => {
    await page.goto("/data-connectors#okx-public");
    await page.waitForSelector("#okx-public");

    const card = page.locator("#okx-public");
    await expect(card).toHaveAttribute("data-highlighted", "true");
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText("OkxAdapter");
  });

  test("highlights Kraken connector card from URL hash", async ({ page }) => {
    await page.goto("/data-connectors#kraken-public");
    await page.waitForSelector("#kraken-public");

    const card = page.locator("#kraken-public");
    await expect(card).toHaveAttribute("data-highlighted", "true");
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "KrakenAdapter",
    );
  });

  test("highlights KuCoin connector card from URL hash", async ({ page }) => {
    await page.goto("/data-connectors#kucoin-public");
    await page.waitForSelector("#kucoin-public");

    const card = page.locator("#kucoin-public");
    await expect(card).toHaveAttribute("data-highlighted", "true");
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "KucoinAdapter",
    );
  });

  test("highlights Massive connector card from URL hash", async ({ page }) => {
    await page.goto("/data-connectors#massive-public");
    await page.waitForSelector("#massive-public");

    const card = page.locator("#massive-public");
    await expect(card).toHaveAttribute("data-highlighted", "true");
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "MassiveAdapter",
    );
  });

  test("highlights Coinbase connector card from URL hash", async ({ page }) => {
    await page.goto("/data-connectors#coinbase-public");
    await page.waitForSelector("#coinbase-public");

    const card = page.locator("#coinbase-public");
    await expect(card).toHaveAttribute("data-highlighted", "true");
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "CoinbaseAdapter",
    );
  });

  test("highlights Gate.io connector card from URL hash", async ({ page }) => {
    await page.goto("/data-connectors#gate-public");
    await page.waitForSelector("#gate-public");

    const card = page.locator("#gate-public");
    await expect(card).toHaveAttribute("data-highlighted", "true");
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "GateAdapter",
    );
  });

  test("highlights EODHD connector card from URL hash", async ({ page }) => {
    await page.goto("/data-connectors#eodhd");
    await page.waitForSelector("#eodhd");

    const card = page.locator("#eodhd");
    await expect(card).toHaveAttribute("data-highlighted", "true");
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText(
      "createEodhdAdapter",
    );
  });

  test("highlights connector card from URL hash", async ({ page }) => {
    await page.goto("/data-connectors#coingecko");
    await page.waitForSelector("#coingecko");

    const card = page.locator("#coingecko");
    await expect(card).toHaveAttribute("data-highlighted", "true");
    await expect(page.getByTestId("integration-snippet").locator("pre")).toContainText("CoingeckoAdapter");
  });

  test("visual snapshot of hero and catalog toolbar", async ({ page }) => {
    await expect(page.locator("#catalog")).toHaveScreenshot("data-connectors-catalog.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
