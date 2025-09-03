import { projectId, publicAnonKey } from './info';
import * as localKvStore from './local-kv-store';

// Configuration du client KV
const KV_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98`;

// État de la connectivité
let isServerAvailable: boolean | null = null;
let lastConnectivityCheck = 0;
const CONNECTIVITY_CHECK_INTERVAL = 30000; // 30 secondes

// Headers par défaut
const getHeaders = () => ({
  'Authorization': `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
});

// Gestion des erreurs
class KVStoreError extends Error {
  public status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'KVStoreError';
    this.status = status;
  }
}

// Interface pour les réponses
interface KVResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Test de connectivité rapide
const checkServerConnectivity = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Ne pas tester trop souvent
  if (isServerAvailable !== null && (now - lastConnectivityCheck) < CONNECTIVITY_CHECK_INTERVAL) {
    return isServerAvailable;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3 secondes
    
    const response = await fetch(`${KV_BASE_URL}/data/kv/ping`, {
      headers: getHeaders(),
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    isServerAvailable = response.ok;
    lastConnectivityCheck = now;
    
    if (isServerAvailable) {
      // Seulement loguer si on revient d'un état hors ligne
      if (hasNotifiedServerUnavailable) {
        console.log('✅ Edge Functions Supabase restaurées');
        hasNotifiedServerUnavailable = false;
      }
    } else {
      if (!hasNotifiedServerUnavailable) {
        console.info('🔄 Mode local activé - Edge Functions indisponibles');
        hasNotifiedServerUnavailable = true;
      }
    }
    
    return isServerAvailable;
  } catch (error: any) {
    // Logging silencieux pour éviter le bruit
    if (!hasNotifiedServerUnavailable) {
      console.info('🔄 Basculement en mode local - Edge Functions non accessibles');
      hasNotifiedServerUnavailable = true;
    }
    isServerAvailable = false;
    lastConnectivityCheck = now;
    return false;
  }
};

// Fonction utilitaire pour faire les requêtes avec fallback
const makeRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const serverAvailable = await checkServerConnectivity();
  
  if (!serverAvailable) {
    throw new KVStoreError('Server not available, use local fallback');
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout de 10 secondes
    
    const response = await fetch(`${KV_BASE_URL}${endpoint}`, {
      headers: getHeaders(),
      signal: controller.signal,
      ...options,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new KVStoreError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    const result: KVResponse = await response.json();
    
    if (!result.success) {
      throw new KVStoreError(result.error || 'Unknown error');
    }

    return result.data;
  } catch (error: any) {
    if (error instanceof KVStoreError) {
      throw error;
    }
    throw new KVStoreError(`Network error: ${error.message}`);
  }
};

// État de notification des erreurs pour éviter le spam
let hasNotifiedServerUnavailable = false;
let lastErrorNotification = 0;
const ERROR_NOTIFICATION_COOLDOWN = 60000; // 1 minute

// Fonction de fallback générale - syntaxe simplifiée avec logging intelligent
const withFallback = async (
  serverOperation: () => Promise<any>,
  localOperation: () => Promise<any>,
  operationName: string
): Promise<any> => {
  try {
    const result = await serverOperation();
    
    // Si le serveur répond après une panne, notifier la reconnexion
    if (hasNotifiedServerUnavailable) {
      console.log('🔄 Edge Functions Supabase reconnectées - retour au mode serveur');
      hasNotifiedServerUnavailable = false;
    }
    
    return result;
  } catch (error: any) {
    const now = Date.now();
    
    // Notification d'erreur intelligente pour éviter le spam
    if (!hasNotifiedServerUnavailable || (now - lastErrorNotification) > ERROR_NOTIFICATION_COOLDOWN) {
      console.info(`🔄 Mode local actif pour ${operationName} (Edge Functions indisponibles)`);
      hasNotifiedServerUnavailable = true;
      lastErrorNotification = now;
    }
    
    try {
      return await localOperation();
    } catch (localError: any) {
      console.error(`❌ ${operationName} échoué en mode local et serveur:`, localError.message);
      throw new KVStoreError(`Both server and local ${operationName} failed: ${localError.message}`);
    }
  }
};

// Implémentation des fonctions avec fallback

export const set = async (key: string, value: any): Promise<void> => {
  return withFallback(
    () => makeRequest('/data/kv/set', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    }),
    () => localKvStore.set(key, value),
    'set'
  );
};

export const get = async (key: string): Promise<any> => {
  return withFallback(
    async () => {
      try {
        return await makeRequest(`/data/kv/get?key=${encodeURIComponent(key)}`);
      } catch (error: any) {
        if (error instanceof KVStoreError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    () => localKvStore.get(key),
    'get'
  );
};

export const del = async (key: string): Promise<void> => {
  return withFallback(
    () => makeRequest('/data/kv/delete', {
      method: 'DELETE',
      body: JSON.stringify({ key }),
    }),
    () => localKvStore.del(key),
    'delete'
  );
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  if (keys.length !== values.length) {
    throw new KVStoreError('Keys and values arrays must have the same length');
  }
  
  return withFallback(
    () => makeRequest('/data/kv/mset', {
      method: 'POST',
      body: JSON.stringify({ 
        items: keys.map((key, index) => ({ key, value: values[index] }))
      }),
    }),
    () => localKvStore.mset(keys, values),
    'mset'
  );
};

export const mget = async (keys: string[]): Promise<any[]> => {
  return withFallback(
    () => makeRequest('/data/kv/mget', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    }),
    () => localKvStore.mget(keys),
    'mget'
  );
};

export const mdel = async (keys: string[]): Promise<void> => {
  return withFallback(
    () => makeRequest('/data/kv/mdel', {
      method: 'DELETE',
      body: JSON.stringify({ keys }),
    }),
    () => localKvStore.mdel(keys),
    'mdel'
  );
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  return withFallback(
    () => makeRequest(`/data/kv/search?prefix=${encodeURIComponent(prefix)}`),
    () => localKvStore.getByPrefix(prefix),
    'getByPrefix'
  );
};

export const getStats = async (): Promise<{
  total_keys: number;
  total_size: number;
  prefixes: { [prefix: string]: number };
}> => {
  return withFallback(
    () => makeRequest('/data/kv/stats'),
    () => localKvStore.getStats(),
    'getStats'
  );
};

export const clear = async (prefix?: string): Promise<void> => {
  return withFallback(
    () => {
      const endpoint = prefix 
        ? `/data/kv/clear?prefix=${encodeURIComponent(prefix)}`
        : '/data/kv/clear';
        
      return makeRequest(endpoint, {
        method: 'DELETE',
      });
    },
    () => localKvStore.clear(prefix),
    'clear'
  );
};

export const testConnection = async (): Promise<boolean> => {
  try {
    // Test serveur d'abord
    const serverAvailable = await checkServerConnectivity();
    if (serverAvailable) {
      return true;
    }
    
    // Fallback sur le test local
    return await localKvStore.testConnection();
  } catch {
    return false;
  }
};

// Fonction pour obtenir le statut de connectivité
export const getConnectivityStatus = () => {
  return {
    serverAvailable: isServerAvailable,
    lastCheck: lastConnectivityCheck,
    mode: isServerAvailable === true ? 'server' : 
          isServerAvailable === false ? 'local' : 'unknown'
  };
};

// Export d'une interface simplifiée pour les composants
export const kvStore = {
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
  getConnectivityStatus,
};

export default kvStore;