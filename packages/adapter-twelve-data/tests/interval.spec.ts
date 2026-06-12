import { describe, expect, it } from "vitest";
import { toTwelveDataInterval } from "../src/interval";

describe("toTwelveDataInterval", () => {
  it("maps Exeria intervals to Twelve Data intervals", () => {
    expect(toTwelveDataInterval("1m")).toBe("1min");
    expect(toTwelveDataInterval("1h")).toBe("1h");
    expect(toTwelveDataInterval("1d")).toBe("1day");
    expect(toTwelveDataInterval("1w")).toBe("1week");
    expect(toTwelveDataInterval("1M")).toBe("1month");
  });

  it("defaults empty input to 1h", () => {
    expect(toTwelveDataInterval("")).toBe("1h");
  });
});
