export function getApiKey(): string {
  try {
    const fromLocal = localStorage.getItem('groq_api_key');
    if (fromLocal && fromLocal.trim()) {
      return fromLocal.trim();
    }
  } catch {
    // ignore
  }

  try {
    const fromEnv = import.meta.env.VITE_GROQ_API_KEY;
    if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
      return fromEnv.trim();
    }
  } catch {
    // ignore
  }

  return '';
}

export function setApiKey(key: string): void {
  try {
    if (!key) return;
    localStorage.setItem('groq_api_key', key.trim());
  } catch {
    // ignore
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem('groq_api_key');
  } catch {
    // ignore
  }
}
