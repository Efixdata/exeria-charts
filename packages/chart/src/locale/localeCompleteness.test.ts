import { describe, expect, it } from "vitest";
import enUS from "./en-US";
import { DEFAULT_LOCALE_ID, SUPPORTED_LOCALES } from "./index";

type Dict = Record<string, unknown>;

// Eagerly load every module in this folder, then classify by filename.
// `import.meta.glob` is a Vite/Vitest runtime feature that `tsc` does not know about,
// so we narrow the result type ourselves instead of relying on Vite client typings.
const allModules = (import.meta as unknown as {
  glob: (pattern: string, options: { eager: true }) => Record<string, { default: Dict }>;
}).glob("./*.ts", { eager: true });

const baseOverrides = new Map<string, Dict>();
const indicatorOverrides = new Map<string, Dict>();

for (const [filePath, mod] of Object.entries(allModules)) {
  const indicatorMatch = filePath.match(/^\.\/([a-z]{2}-[A-Z]{2})-indicators\.ts$/);
  if (indicatorMatch) {
    indicatorOverrides.set(indicatorMatch[1], mod.default);
    continue;
  }

  const baseMatch = filePath.match(/^\.\/([a-z]{2}-[A-Z]{2})\.ts$/);
  if (baseMatch) {
    baseOverrides.set(baseMatch[1], mod.default);
  }
}

const localeNameKeys = Object.keys(enUS).filter((key) => key.startsWith("locale_name_"));

const nonDefaultLocales = SUPPORTED_LOCALES.map((entry) => entry.id).filter(
  (id) => id !== DEFAULT_LOCALE_ID,
);

describe("locale registry wiring", () => {
  it("registers a label key in en-US for every supported locale", () => {
    for (const { id, labelKey } of SUPPORTED_LOCALES) {
      expect(enUS, `en-US is missing label key ${labelKey} for ${id}`).toHaveProperty(labelKey);
    }
  });

  it("provides a base override bundle for every non-default locale", () => {
    for (const id of nonDefaultLocales) {
      expect(baseOverrides.has(id), `Missing base override file for ${id}`).toBe(true);
    }
  });

  it("provides an indicators override bundle for every non-default locale", () => {
    for (const id of nonDefaultLocales) {
      expect(indicatorOverrides.has(id), `Missing -indicators file for ${id}`).toBe(true);
    }
  });
});

describe("language picker labels", () => {
  it.each(nonDefaultLocales)("%s translates every locale_name_* label", (id) => {
    const override = baseOverrides.get(id) ?? {};
    const missing = localeNameKeys.filter((key) => !(key in override));
    expect(missing, `${id} is missing picker labels: ${missing.join(", ")}`).toEqual([]);
  });
});

describe("indicator catalog key parity", () => {
  it("every -indicators bundle covers the same key set", () => {
    const reference = indicatorOverrides.get(nonDefaultLocales[0]);
    expect(reference, "Expected at least one indicators bundle").toBeTruthy();

    const referenceKeys = new Set(Object.keys(reference as Dict));

    for (const id of nonDefaultLocales) {
      const keys = new Set(Object.keys(indicatorOverrides.get(id) as Dict));
      const missing = [...referenceKeys].filter((key) => !keys.has(key));
      const extra = [...keys].filter((key) => !referenceKeys.has(key));
      expect(missing, `${id} is missing indicator keys: ${missing.join(", ")}`).toEqual([]);
      expect(extra, `${id} has extra indicator keys: ${extra.join(", ")}`).toEqual([]);
    }
  });
});

// Non-failing visibility report: how much of en-US is still shown in English.
describe("translation coverage report", () => {
  it("prints per-locale untranslated counts", () => {
    const enStringKeys = Object.keys(enUS).filter((key) => typeof enUS[key] === "string");
    const rows: string[] = [];

    for (const id of nonDefaultLocales) {
      const override: Dict = {
        ...(baseOverrides.get(id) ?? {}),
        ...(indicatorOverrides.get(id) ?? {}),
      };

      let missing = 0; // key absent from override -> pure English fallback
      let identical = 0; // key present but value equals en-US (maybe intentional)
      const missingSamples: string[] = [];

      for (const key of enStringKeys) {
        if (!(key in override)) {
          missing += 1;
          if (missingSamples.length < 8) missingSamples.push(key);
        } else if (override[key] === enUS[key]) {
          identical += 1;
        }
      }

      const translated = enStringKeys.length - missing - identical;
      const pct = ((translated / enStringKeys.length) * 100).toFixed(1);
      rows.push(
        `${id}: ${pct}% translated | missing ${missing}, identical-to-EN ${identical} ` +
          `(missing e.g. ${missingSamples.join(", ")})`,
      );
    }

    // eslint-disable-next-line no-console
    console.log(
      `\nTranslation coverage vs en-US (${enStringKeys.length} string keys):\n` +
        rows.join("\n") +
        "\n",
    );
    expect(rows.length).toBe(nonDefaultLocales.length);
  });
});
