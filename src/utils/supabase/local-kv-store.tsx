// Local KV Store implementation using localStorage
// Fallback pour quand les Edge Functions Supabase ne sont pas disponibles

const LOCAL_STORAGE_PREFIX = 'crewtech_kv_';

// Interface pour les réponses
interface KVResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Gestion des erreurs locale
class LocalKVStoreError extends Error {
  public status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'LocalKVStoreError';
    this.status = status;
  }
}

// Utilitaires pour localStorage
const getStorageKey = (key: string): string => {
  return `${LOCAL_STORAGE_PREFIX}${key}`;
};

const safeGetItem = (key: string): any => {
  try {
    const item = localStorage.getItem(getStorageKey(key));
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

const safeSetItem = (key: string, value: any): void => {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    throw new LocalKVStoreError('Storage quota exceeded or unavailable');
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(getStorageKey(key));
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Fonction pour obtenir toutes les clés avec un préfixe
const getKeysWithPrefix = (prefix: string): string[] => {
  const fullPrefix = getStorageKey(prefix);
  const keys: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(fullPrefix)) {
      keys.push(key.replace(LOCAL_STORAGE_PREFIX, ''));
    }
  }
  
  return keys;
};

// Implémentation locale des fonctions KV

export const set = async (key: string, value: any): Promise<void> => {
  try {
    safeSetItem(key, value);
  } catch (error) {
    throw new LocalKVStoreError(`Failed to set key ${key}: ${error.message}`);
  }
};

export const get = async (key: string): Promise<any> => {
  try {
    return safeGetItem(key);
  } catch (error) {
    throw new LocalKVStoreError(`Failed to get key ${key}: ${error.message}`);
  }
};

export const del = async (key: string): Promise<void> => {
  try {
    safeRemoveItem(key);
  } catch (error) {
    throw new LocalKVStoreError(`Failed to delete key ${key}: ${error.message}`);
  }
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  if (keys.length !== values.length) {
    throw new LocalKVStoreError('Keys and values arrays must have the same length');
  }
  
  try {
    keys.forEach((key, index) => {
      safeSetItem(key, values[index]);
    });
  } catch (error) {
    throw new LocalKVStoreError(`Failed to set multiple keys: ${error.message}`);
  }
};

export const mget = async (keys: string[]): Promise<any[]> => {
  try {
    return keys.map(key => safeGetItem(key));
  } catch (error) {
    throw new LocalKVStoreError(`Failed to get multiple keys: ${error.message}`);
  }
};

export const mdel = async (keys: string[]): Promise<void> => {
  try {
    keys.forEach(key => {
      safeRemoveItem(key);
    });
  } catch (error) {
    throw new LocalKVStoreError(`Failed to delete multiple keys: ${error.message}`);
  }
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  try {
    const keys = getKeysWithPrefix(prefix);
    const values: any[] = [];
    
    keys.forEach(key => {
      const value = safeGetItem(key);
      if (value !== null) {
        values.push(value);
      }
    });
    
    return values;
  } catch (error) {
    throw new LocalKVStoreError(`Failed to get keys by prefix ${prefix}: ${error.message}`);
  }
};

export const getStats = async (): Promise<{
  total_keys: number;
  total_size: number;
  prefixes: { [prefix: string]: number };
}> => {
  try {
    const prefixes = ['crewtech:missions:', 'crewtech:crew:', 'crewtech:notifications:', 'crewtech:activities:'];
    const stats = {
      total_keys: 0,
      total_size: 0,
      prefixes: {} as { [prefix: string]: number }
    };
    
    prefixes.forEach(prefix => {
      const keys = getKeysWithPrefix(prefix);
      stats.prefixes[prefix] = keys.length;
      stats.total_keys += keys.length;
    });
    
    // Estimation de la taille (approximative)
    try {
      const storageEstimate = JSON.stringify(localStorage).length;
      stats.total_size = storageEstimate;
    } catch {
      stats.total_size = 0;
    }
    
    return stats;
  } catch (error) {
    throw new LocalKVStoreError(`Failed to get stats: ${error.message}`);
  }
};

export const clear = async (prefix?: string): Promise<void> => {
  try {
    if (prefix) {
      const keys = getKeysWithPrefix(prefix);
      keys.forEach(key => safeRemoveItem(key));
    } else {
      // Clear all CrewTech data
      const prefixes = ['crewtech:missions:', 'crewtech:crew:', 'crewtech:notifications:', 'crewtech:activities:'];
      prefixes.forEach(prefix => {
        const keys = getKeysWithPrefix(prefix);
        keys.forEach(key => safeRemoveItem(key));
      });
    }
  } catch (error) {
    throw new LocalKVStoreError(`Failed to clear data: ${error.message}`);
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const testKey = `test_${Date.now()}`;
    const testValue = { test: true };
    
    await set(testKey, testValue);
    const retrieved = await get(testKey);
    await del(testKey);
    
    return retrieved && retrieved.test === true;
  } catch {
    return false;
  }
};

// Export d'une interface simplifiée pour les composants
export const localKvStore = {
  set,
  get,
  del,
  mset,
  mget,
  mdel,
  getByPrefix,
  getStats,
  clear,
  testConnection,
};

export default localKvStore;