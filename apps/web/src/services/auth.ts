const STORAGE_KEY = "ufcspa_email";

// ✅ Coloque aqui os 2 e-mails autorizados
export const ALLOWED_EMAILS = [
  "gestor1@ufcspa.edu.br",
  "gestor2@ufcspa.edu.br",
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

  if (!email.endsWith("@ufcspa.edu.br")) {
    throw new Error("Acesso restrito a e-mail institucional @ufcspa.edu.br.");
  }

  const allowed = ALLOWED_EMAILS.map((e) => e.toLowerCase());
  if (!allowed.includes(email)) {
    throw new Error("Este e-mail não está autorizado para acessar o sistema.");
  }

  localStorage.setItem(STORAGE_KEY, email);
}