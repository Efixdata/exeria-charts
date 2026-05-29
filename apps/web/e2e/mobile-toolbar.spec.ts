import { expect, test } from "@playwright/test";

test.describe("mobile chart chrome", () => {
  test("shows compact toolbar and overflow on phone viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("toolbar", { name: /chart toolbar/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /more chart actions/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /drawing tools/i })).toBeVisible();
  });

  test("mobile preview frame applies phone-width class", async ({ page }) => {
    await page.goto("/");
    const panel = page.locator(".reviewChartPanel");
    await expect(panel).toBeVisible({ timeout: 30_000 });

    const toggle = page.getByRole("checkbox", { name: /constrain chart panel/i });
    await toggle.click({ force: true });
    await expect(panel).toHaveClass(/reviewChartPanel--mobilePreview/);

    const box = await panel.boundingBox();
    expect(box?.width).toBeDefined();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(395);
    }
  });
});
