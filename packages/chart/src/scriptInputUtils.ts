import type { RuntimeScriptInput } from "./internal-types/scripts";

export function resolveScriptModelScalarInput(
  modelValue: unknown,
  fallback?: unknown,
): unknown {
  if (modelValue === undefined || modelValue === null) {
    return fallback;
  }

  if (typeof modelValue !== "object" || Array.isArray(modelValue)) {
    return modelValue;
  }

  if ("value" in modelValue) {
    const nested = (modelValue as RuntimeScriptInput).value;
    return nested !== undefined && nested !== null ? nested : fallback;
  }

  return fallback !== undefined ? fallback : modelValue;
}

export function resolveScriptInputProtoValue(
  templateInput: Pick<RuntimeScriptInput, "value">,
  protoInput: RuntimeScriptInput | unknown,
): unknown {
  if (protoInput === undefined || protoInput === null) {
    return templateInput.value;
  }

  if (typeof protoInput !== "object" || Array.isArray(protoInput)) {
    return protoInput;
  }

  const protoValue = (protoInput as RuntimeScriptInput).value;
  return protoValue !== undefined && protoValue !== null ? protoValue : templateInput.value;
}

export function mergeScriptInputProto(
  templateInput: RuntimeScriptInput,
  protoInput: RuntimeScriptInput | unknown,
): RuntimeScriptInput {
  const protoObject =
    typeof protoInput === "object" && protoInput !== null && !Array.isArray(protoInput)
      ? protoInput
      : {};

  return {
    ...templateInput,
    ...protoObject,
    value: resolveScriptInputProtoValue(templateInput, protoInput),
  };
}
