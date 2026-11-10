import test from "node:test";
import assert from "node:assert/strict";
import {
  contactEmail,
  countryLanguage,
  detectVisitorLanguage,
  resolveLanguage,
  resolveTheme,
} from "../src/preferences.mjs";

test("Chinese uses QQ and other supported languages use Gmail", () => {
  assert.equal(contactEmail("zh-CN"), "tiatf@qq.com");
  assert.equal(contactEmail("zh-TW"), "tiatf@qq.com");
  assert.equal(contactEmail("en"), "linxtia@gmail.com");
  assert.equal(contactEmail("ja"), "linxtia@gmail.com");
});

test("browser language priorities and fallback", () => {
  assert.equal(resolveLanguage(["zh-TW", "en"]), "zh-CN");
  assert.equal(resolveLanguage(["fr", "ja-JP"]), "ja");
  assert.equal(resolveLanguage(["en-US", "zh"]), "en");
  assert.equal(resolveLanguage(["fr-FR"]), "en");
  assert.equal(resolveLanguage([]), "en");
});

test("automatic theme follows the system and explicit choices override it", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("IP countries map to supported languages", () => {
  for (const country of ["CN", "HK", "MO", "TW", "cn"]) {
    assert.equal(countryLanguage(country), "zh-CN");
  }
  assert.equal(countryLanguage("JP"), "ja");
  assert.equal(countryLanguage("US"), "en");
  assert.equal(countryLanguage("SG"), "en");
  for (const country of [
    null,
    undefined,
    "",
    "XX",
    "ZZ",
    "T1",
    42,
    "<script>",
  ]) {
    assert.equal(countryLanguage(country), null);
  }
});

test("a valid IP recommendation takes priority over browser language", async () => {
  const result = await detectVisitorLanguage(
    ["en-US"],
    undefined,
    async (url, options) => {
      assert.equal(url, "https://api.country.is/");
      assert.equal(options.credentials, "omit");
      assert.equal(options.referrerPolicy, "no-referrer");
      return { ok: true, json: async () => ({ country: "JP" }) };
    },
  );
  assert.deepEqual(result, { language: "ja", source: "ip" });
});

test("failed, invalid, and aborted IP lookups fall back to browser language", async () => {
  const requests = [
    async () => {
      throw new TypeError("Network unavailable");
    },
    async () => ({ ok: false }),
    async () => ({ ok: true, json: async () => ({ country: null }) }),
    async () => ({ ok: true, json: async () => null }),
    async () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError("Invalid JSON");
      },
    }),
    async () => {
      throw new DOMException("Timed out", "AbortError");
    },
  ];
  for (const request of requests) {
    assert.deepEqual(
      await detectVisitorLanguage(["zh-CN"], undefined, request),
      { language: "zh-CN", source: "browser" },
    );
  }
});
