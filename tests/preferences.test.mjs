import test from "node:test";
import assert from "node:assert/strict";
import {
  contactEmail,
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
