export const languages = ["zh-CN", "en", "ja"];
export const themes = ["system", "light", "dark"];

export function resolveLanguage(preferredLanguages) {
  for (const language of preferredLanguages) {
    if (language.toLowerCase().startsWith("zh")) return "zh-CN";
    if (language.toLowerCase().startsWith("ja")) return "ja";
    if (language.toLowerCase().startsWith("en")) return "en";
  }
  return "en";
}

export function countryLanguage(country) {
  if (typeof country !== "string" || !/^[a-z]{2}$/i.test(country)) return null;
  const code = country.toUpperCase();
  if (code === "XX" || code === "ZZ") return null;
  if (["CN", "HK", "MO", "TW"].includes(code)) return "zh-CN";
  return code === "JP" ? "ja" : "en";
}

export async function detectVisitorLanguage(
  preferredLanguages,
  signal,
  request = fetch,
) {
  try {
    const response = await request("https://api.country.is/", {
      signal,
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) throw new Error("Country lookup unavailable");
    const result = await response.json();
    const language = countryLanguage(result?.country);
    if (language) return { language, source: "ip" };
  } catch {
    // A blocked, timed-out, or invalid lookup falls back to browser preferences.
  }
  return { language: resolveLanguage(preferredLanguages), source: "browser" };
}

export function contactEmail(language, person = "lin") {
  const emails =
    person === "yu"
      ? ["yumial@qq.com", "yuluo230519@gmail.com"]
      : ["tiatf@qq.com", "linxtia@gmail.com"];
  return emails[language.startsWith("zh") ? 0 : 1];
}

export function resolveTheme(preference, systemDark) {
  return preference === "dark" || (preference !== "light" && systemDark)
    ? "dark"
    : "light";
}

export function readPreference(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences still work for this visit if storage is unavailable.
  }
}
