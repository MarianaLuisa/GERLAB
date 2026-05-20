const STORAGE_KEY = "ufcspa_email";

export const ALLOWED_EMAILS = [
  "msbrasil@ufcspa.edu.br",
  "yorrana.marins@ufcspa.edu.br",
] as const;

export type AllowedEmail = (typeof ALLOWED_EMAILS)[number];

export function getSessionEmail(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function isLoggedIn(): boolean {
  return !!getSessionEmail();
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function loginWithEmail(emailRaw: string) {
  const email = (emailRaw || "").trim().toLowerCase();
  const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!simpleEmailRegex.test(email)) {
    throw new Error("Informe um e-mail válido.");
  }

  localStorage.setItem(STORAGE_KEY, email);
}

