# 🌐 Guide Test HTTP Edge Functions

## 🎯 Objectif

Tester et consommer votre Supabase Edge Function depuis l'interface Figma/Make via HTTP pur, sans import Deno.

---

## ⚙️ Configuration

### Base URL
```javascript
const BASE = "https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98";
```

### Clés après rotation
```javascript
const NEW_ANON_KEY = "<NOUVELLE_ANON_KEY>";
// ⚠️ Ne jamais mettre la SERVICE_ROLE_KEY ici - Sécurité !
```

---

## 🧪 Code de Test (Copy-Paste Ready)

### Fonction HTTP générique
```javascript
async function httpJson(url, options = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    return { ok: res.ok, status: res.status, json, error: !res.ok ? text : null };
  } catch (e) {
    return { ok: false, status: 0, json: null, error: e?.message || String(e) };
  } finally {
    clearTimeout(id);
  }
}
```

### 🏥 Health Check (Public)
```javascript
export async function testHealth() {
  return await httpJson(`${BASE}/health`, { method: "GET" });
}
```

**Usage dans Figma/Make :**
```javascript
// Bouton Health Check
const healthResult = await testHealth();
console.log('Health:', healthResult.json);
// Afficher: {"status": "healthy", "service": "CrewTech Platform", ...}
```

### 🔐 Secrets Status (Protégé)
```javascript
export async function testSecrets() {
  return await httpJson(`${BASE}/secrets/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${NEW_ANON_KEY}`,
      apikey: NEW_ANON_KEY,
      "Content-Type": "application/json",
    },
  });
}
```

**Usage dans Figma/Make :**
```javascript
// Bouton Secrets Check
const secretsResult = await testSecrets();
if (secretsResult.ok) {
  console.log('Secrets OK:', secretsResult.json);
} else {
  console.log('Erreur 401:', secretsResult.error);
}
```

### 🗄️ KV Store Test (Protégé)
```javascript
export async function testKv() {
  return await httpJson(`${BASE}/debug/kv-test`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NEW_ANON_KEY}`,
      apikey: NEW_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}
```

**Usage dans Figma/Make :**
```javascript
// Bouton KV Test
const kvResult = await testKv();
if (kvResult.ok) {
  console.log('Database accessible:', kvResult.json);
} else {
  console.log('Erreur database:', kvResult.error);
}
```

---

## 🖼️ Interface Figma/Make

### Structure recommandée
```
┌─────────────────────────────────┐
│ 🏥 Health Check                 │  → testHealth()
├─────────────────────────────────┤
│ 🔐 Secrets Status               │  → testSecrets()  
├─────────────────────────────────┤
│ 🗄️ KV Store Test                │  → testKv()
├─────────────────────────────────┤
│ 📊 Résultats JSON               │  → Affichage réponses
└─────────────────────────────────┘
```

### Code d'interface type
```javascript
// Variables d'état
let lastHealthResult = null;
let lastSecretsResult = null;
let lastKvResult = null;

// Handlers de boutons
async function onHealthClick() {
  const result = await testHealth();
  lastHealthResult = result;
  updateDisplay('health', result);
}

async function onSecretsClick() {
  const result = await testSecrets();
  lastSecretsResult = result;
  updateDisplay('secrets', result);
}

async function onKvClick() {
  const result = await testKv();
  lastKvResult = result;
  updateDisplay('kv', result);
}

// Affichage des résultats
function updateDisplay(type, result) {
  const display = document.getElementById(`${type}-result`);
  if (result.ok) {
    display.style.color = 'green';
    display.textContent = `✅ ${result.status} - ${JSON.stringify(result.json)}`;
  } else {
    display.style.color = 'red';
    display.textContent = `❌ ${result.status || 'Timeout'} - ${result.error}`;
  }
}
```

---

## 🚨 Gestion d'Erreurs

### Erreur 404 - Function inexistante
```javascript
if (result.status === 404) {
  console.log('❌ Edge Function non déployée');
  // Afficher les routes disponibles
  if (result.json?.available_routes) {
    console.log('Routes disponibles:', result.json.available_routes);
  }
}
```

### Erreur 401 - Authentification
```javascript
if (result.status === 401) {
  console.log('❌ Problème d\'authentification');
  console.log('Vérifiez:');
  console.log('1. ANON_KEY correcte');
  console.log('2. Verify JWT désactivé dans Supabase');
}
```

### Timeout/Network
```javascript
if (result.status === 0) {
  console.log('❌ Timeout ou problème réseau');
  console.log('Edge Function peut être en cours de déploiement');
}
```

---

## 📋 Checklist de Débogage

### ✅ Pré-requis
- [ ] Edge Function déployée avec nom exact : `make-server-9fd39b98`
- [ ] ANON_KEY mise à jour après rotation
- [ ] Pas de SERVICE_ROLE_KEY côté frontend

### ✅ Test Health (doit toujours fonctionner)
- [ ] GET /health retourne 200
- [ ] JSON contient `{"status": "healthy"}`
- [ ] Pas d'authentification requise

### ✅ Test Secrets (avec auth)
- [ ] GET /secrets/status avec headers auth
- [ ] Retourne `{"valid": true}`
- [ ] Si 401 → vérifier ANON_KEY

### ✅ Test KV Store (avec auth + DB)
- [ ] POST /debug/kv-test avec headers auth
- [ ] Retourne `{"success": true}`
- [ ] Si erreur → vérifier table kv_store_9fd39b98

---

## 🎯 Résultats Attendus

### Health Check (✅ Toujours OK)
```json
{
  "status": "healthy",
  "service": "CrewTech Platform", 
  "version": "1.0.0",
  "timestamp": "2025-01-29T09:45:30.123Z",
  "message": "Edge Function is working! 🎉"
}
```

### Secrets Status (✅ Si auth OK)
```json
{
  "valid": true,
  "missing": [],
  "configured": {
    "SUPABASE_URL": true,
    "SUPABASE_ANON_KEY": true, 
    "SUPABASE_SERVICE_ROLE_KEY": true
  },
  "timestamp": "2025-01-29T09:45:30.123Z"
}
```

### KV Store Test (✅ Si DB accessible)
```json
{
  "success": true,
  "database_accessible": true,
  "table_exists": true,
  "message": "Database accessible ✅",
  "timestamp": "2025-01-29T09:45:30.123Z"
}
```

---

## 🔄 Intégration Continue

### Auto-test périodique
```javascript
// Test toutes les 30 secondes
setInterval(async () => {
  const health = await testHealth();
  if (!health.ok) {
    console.warn('⚠️ Edge Function indisponible');
    // Notifier l'utilisateur
  }
}, 30000);
```

### Fallback local
```javascript
// Si Edge Function KO, utiliser données locales
async function getData() {
  const result = await testHealth();
  if (result.ok) {
    // Utiliser l'API serveur
    return await fetchFromServer();
  } else {
    // Fallback vers localStorage
    return getLocalData();
  }
}
```

---

## 🎉 Succès !

Quand tous les tests passent :
- ✅ **Health** : Edge Function déployée et accessible
- ✅ **Secrets** : Authentification fonctionnelle 
- ✅ **KV Store** : Base de données connectée

➡️ **Votre Edge Function est prête pour la production !**

---

**Temps de mise en place estimé : 5-10 minutes**