import { expect, test } from "@playwright/test";

test.describe("Fintech wealth live app", () => {
  test("mounts compare chart on equities and toggles market", async ({ page }) => {
    await page.goto("/starters/fintech-integration/app");
    await expect(page.getByRole("heading", { name: "Nova Wealth" })).toBeVisible();

    const chart = page.getByTestId("fintech-compare-chart");
    await expect(chart).toBeVisible();
    await expect(chart).toHaveAttribute("data-loading", "false", { timeout: 45_000 });
    await expect(chart).toHaveAttribute("data-bar-count", /^(1\d{2}|[2-9]\d+|\d{3,})$/);

    await expect(page.getByRole("list", { name: "Chart series" })).toContainText("Apple", {
      timeout: 45_000,
    });

    await page.getByRole("tab", { name: "Crypto" }).click();
    await expect(page.getByRole("tab", { name: "Crypto" })).toHaveAttribute("aria-selected", "true");
    await expect(chart).toHaveAttribute("data-loading", "false", { timeout: 45_000 });
    await expect(page.getByRole("list", { name: "Chart series" })).toContainText("Bitcoin", {
      timeout: 45_000,
    });
  });

  test("toggles market while on Holdings tab", async ({ page }) => {
    await page.goto("/starters/fintech-integration/app");
    await expect(page.getByTestId("fintech-compare-chart")).toHaveAttribute("data-loading", "false", {
      timeout: 45_000,
    });

    await page.getByRole("tab", { name: "Holdings" }).click();
    await expect(page.getByRole("tab", { name: "Holdings" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: "Your holdings" })).toBeVisible();

    const holdings = page.getByRole("region", { name: "Holdings" });

    await page.getByRole("tab", { name: "Crypto" }).click();
    await expect(page.getByRole("tab", { name: "Crypto" })).toHaveAttribute("aria-selected", "true");
    await expect(holdings.getByRole("button", { name: /Bitcoin/i })).toBeVisible({ timeout: 45_000 });

    await page.getByRole("tab", { name: "Equities" }).click();
    await expect(page.getByRole("tab", { name: "Equities" })).toHaveAttribute("aria-selected", "true");
    await expect(holdings.getByRole("button", { name: /Apple/i })).toBeVisible({ timeout: 45_000 });
  });

  test("survives light and dark theme toggle", async ({ page }) => {
    await page.goto("/starters/fintech-integration/app");
    const chart = page.getByTestId("fintech-compare-chart");
    await expect(chart).toHaveAttribute("data-loading", "false", { timeout: 45_000 });
    await expect(chart).toHaveAttribute("data-bar-count", /^(1\d{2}|[2-9]\d+|\d{3,})$/);

    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(page.getByTestId("fintech-wealth-app")).toHaveAttribute("data-theme", "light");
    await expect(chart).toHaveAttribute("data-loading", "false", { timeout: 15_000 });
    await expect(chart).toHaveAttribute("data-bar-count", /^(1\d{2}|[2-9]\d+|\d{3,})$/);

    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.getByTestId("fintech-wealth-app")).toHaveAttribute("data-theme", "dark");
    await expect(chart).toHaveAttribute("data-loading", "false", { timeout: 15_000 });
    await expect(chart).toHaveAttribute("data-bar-count", /^(1\d{2}|[2-9]\d+|\d{3,})$/);
  });

  test("bank route loads light retail shell", async ({ page }) => {
    await page.goto("/starters/fintech-integration/app-bank");
    await expect(page.getByTestId("fintech-wealth-app")).toHaveAttribute("data-theme", "light");
    await expect(page.getByTestId("fintech-wealth-app")).toHaveAttribute("data-brand", "bank");
    await expect(page.getByText("Retail banking demo")).toBeVisible();
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toHaveCount(0);
  });
});
