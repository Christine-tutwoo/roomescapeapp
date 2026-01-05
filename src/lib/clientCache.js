const SAFE_WINDOW = typeof window !== 'undefined' ? window : null;

const memoryAdapter = () => {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
};

let storageAdapter = null;

function getStorage() {
  if (!SAFE_WINDOW) return null;
  if (storageAdapter) return storageAdapter;

  try {
    const testKey = '__sheet_cache_test__';
    SAFE_WINDOW.localStorage.setItem(testKey, '1');
    SAFE_WINDOW.localStorage.removeItem(testKey);
    storageAdapter = SAFE_WINDOW.localStorage;
  } catch {
    storageAdapter = memoryAdapter();
  }

  return storageAdapter;
}

export function readCache(key, ttlMs) {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== 'number') {
      storage.removeItem(key);
      return null;
    }
    if (Date.now() - parsed.timestamp > ttlMs) {
      storage.removeItem(key);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export function writeCache(key, data) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(
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

// 獲取快取的版本時間戳
export function getCacheVersion(key) {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.timestamp || null;
  } catch {
    return null;
  }
}

// 檢查是否需要更新（比對版本時間）
export async function shouldUpdateCache(key) {
  if (!SAFE_WINDOW) return true;
  
  try {
    // 獲取本地快取的版本時間
    const localVersion = getCacheVersion(key);
    
    // 獲取伺服器的最新版本時間
    const response = await fetch('/api/admin/publish');
    if (!response.ok) {
      // 如果無法獲取版本，使用快取（如果有）
      return !localVersion;
    }
    
    const { timestamp: serverVersion } = await response.json();
    
    // 如果沒有本地快取，需要更新
    if (!localVersion) return true;
    
    // 如果伺服器版本更新，需要更新
    return serverVersion > localVersion;
  } catch (error) {
    // 發生錯誤時，如果有快取就使用快取，沒有就更新
    return !getCacheVersion(key);
  }
}

