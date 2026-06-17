import { describe, expect, it } from "vitest";
import {
  mergeScriptInputProto,
  resolveScriptInputProtoValue,
  resolveScriptModelScalarInput,
} from "./scriptInputUtils";

describe("resolveScriptInputProtoValue", () => {
  const templateInput = { value: 14 };

  it("keeps template default when proto input is missing", () => {
    expect(resolveScriptInputProtoValue(templateInput, undefined)).toBe(14);
  });

  it("reads nested proto values", () => {
    expect(resolveScriptInputProtoValue(templateInput, { value: 28, type: "integer" })).toBe(28);
  });

  it("reads flat scalar proto values", () => {
    expect(resolveScriptInputProtoValue(templateInput, 28)).toBe(28);
  });
});

describe("resolveScriptModelScalarInput", () => {
  it("keeps flat scalar values", () => {
    expect(resolveScriptModelScalarInput(28, 14)).toBe(28);
  });

  it("unwraps nested input objects", () => {
    expect(resolveScriptModelScalarInput({ type: "integer", value: 28 }, 14)).toBe(28);
  });

  it("falls back when nested value is missing", () => {
    expect(resolveScriptModelScalarInput({ type: "integer" }, 14)).toBe(14);
  });
});

describe("mergeScriptInputProto", () => {
  it("merges nested proto values without dropping scalar overrides", () => {
    const merged = mergeScriptInputProto(
      { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 14 },
      { value: 28, type: "integer" },
    );

    expect(merged.value).toBe(28);
    expect(merged.type).toBe("integer");
  });

  it("merges flat scalar proto values", () => {
    const merged = mergeScriptInputProto(
      { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 14 },
      28,
    );

    expect(merged.value).toBe(28);
  });
});
