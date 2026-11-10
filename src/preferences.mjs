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

export function contactEmail(language) {
  return language.startsWith("zh") ? "tiatf@qq.com" : "linxtia@gmail.com";
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
