import type { SystemSettings } from "./contracts";

const THEME_KEY = "gerlab_theme";
const LOCALE_KEY = "gerlab_locale";

export function normalizeTheme(theme?: string | null) {
  return theme?.trim().toLowerCase() === "dark" ? "dark" : "light";
}

export function normalizeLocale(locale?: string | null) {
  const value = locale?.trim() || "pt-BR";
  try {
    Intl.DateTimeFormat(value);
    return value;
  } catch {
    return "pt-BR";
  }
}

export function applyPreferences(input: Pick<SystemSettings, "theme" | "locale">) {
  const theme = normalizeTheme(input.theme);
  const locale = normalizeLocale(input.locale);

  localStorage.setItem(THEME_KEY, theme);
  localStorage.setItem(LOCALE_KEY, locale);

  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = locale;
  window.dispatchEvent(new CustomEvent("gerlab:preferences", { detail: { theme, locale } }));
}

export function currentLocale() {
  return normalizeLocale(localStorage.getItem(LOCALE_KEY));
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(currentLocale(), {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
