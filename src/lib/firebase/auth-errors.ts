const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "API key do Firebase inválida. No .env, use o firebaseConfig do mesmo projeto da service account (mateus-40473) — Firebase Console → Configurações → Seus apps → Web.",
  "auth/email-already-in-use": "Este e-mail já está cadastrado.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
  "auth/operation-not-allowed": "Login por e-mail não está habilitado no Firebase.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
};

export function mapFirebaseAuthError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    const mapped = AUTH_ERROR_MESSAGES[code];
    if (mapped) return mapped;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível concluir a operação. Tente novamente.";
}
