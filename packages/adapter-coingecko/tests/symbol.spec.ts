import { describe, expect, it } from "vitest";
import { normalizeCoinId } from "../src/symbol";

describe("normalizeCoinId", () => {
  it("lowercases and trims coin ids", () => {
    expect(normalizeCoinId(" Bitcoin ")).toBe("bitcoin");
    expect(normalizeCoinId("ETHEREUM")).toBe("ethereum");
  });
});
