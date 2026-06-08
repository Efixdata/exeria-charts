export type BooleanListOption = {
  key: string;
  label: string;
  checked: boolean;
};

export type BooleanListValue = Record<string, boolean>;

const readBooleanListEntry = (entry: unknown): boolean => {
  if (typeof entry === "boolean") {
    return entry;
  }

  if (entry && typeof entry === "object" && "value" in entry) {
    return !!(entry as { value?: boolean }).value;
  }

  return false;
};

const readBooleanListLabelKey = (key: string, entry: unknown): string => {
  if (entry && typeof entry === "object" && "name" in entry) {
    const name = (entry as { name?: string }).name;
    if (name) {
      return String(name);
    }
  }

  return key;
};

export const normalizeBooleanListForDialog = (value: unknown): BooleanListValue => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const normalized: BooleanListValue = {};

  for (const key in value as Record<string, unknown>) {
    normalized[key] = readBooleanListEntry((value as Record<string, unknown>)[key]);
  }

  return normalized;
};

export const buildBooleanListOptions = (
  value: unknown,
  translate: (key: string) => string,
): BooleanListOption[] => {
  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.keys(value as Record<string, unknown>).map((key) => {
    const entry = (value as Record<string, unknown>)[key];
    const labelKey = readBooleanListLabelKey(key, entry);
    const translated = translate(labelKey);

    return {
      key,
      label: translated !== labelKey ? translated : key,
      checked: readBooleanListEntry(entry),
    };
  });
};

export const flattenBooleanListValue = (options: BooleanListOption[]): BooleanListValue => {
  const flattened: BooleanListValue = {};

  for (const option of options) {
    flattened[option.key] = option.checked;
  }

  return flattened;
};

export const isBooleanListValid = (value: BooleanListValue | null | undefined) => {
  if (!value) {
    return false;
  }

  return Object.values(value).some((checked) => checked);
};
