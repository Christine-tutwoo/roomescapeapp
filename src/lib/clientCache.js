const SAFE_WINDOW = typeof window !== 'undefined' ? window : null;

export function readCache(key, ttlMs) {
  if (!SAFE_WINDOW) return null;
  try {
    const raw = SAFE_WINDOW.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== 'number') {
      SAFE_WINDOW.localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - parsed.timestamp > ttlMs) {
      SAFE_WINDOW.localStorage.removeItem(key);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export function writeCache(key, data) {
  if (!SAFE_WINDOW) return;
  try {
    SAFE_WINDOW.localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      }),
    );
  } catch {
    // ignore quota errors
  }
}

