import { describe, expect, it } from "vitest";
import { resolveCcxtTimeframe } from "../src/interval";

describe("resolveCcxtTimeframe", () => {
  it("returns supported intervals unchanged", () => {
    expect(resolveCcxtTimeframe("1h")).toBe("1h");
    expect(resolveCcxtTimeframe("1d")).toBe("1d");
    expect(resolveCcxtTimeframe("1M")).toBe("1M");
  });

  it("defaults empty input to 1h", () => {
    expect(resolveCcxtTimeframe("")).toBe("1h");
  });
});
