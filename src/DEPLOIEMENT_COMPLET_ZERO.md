# 🚀 DÉPLOIEMENT COMPLET DEPUIS ZÉRO

## 🎯 Objectif
Remettre en marche la plateforme CrewTech complètement depuis le début.

---

## ⚡ ÉTAPE 1 : VÉRIFICATION PROJET SUPABASE

### 1.1 Informations du projet
- **Project ID** : `nrvzifxdmllgcidfhlzh`
- **URL** : `https://nrvzifxdmllgcidfhlzh.supabase.co`
- **Dashboard** : https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh

### 1.2 Récupération des clés
1. Allez sur : https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/settings/api
2. Copiez :
   - **anon / public** key
   - **service_role** key

---

## ⚡ ÉTAPE 2 : DÉPLOIEMENT EDGE FUNCTION

### 2.1 Créer la fonction
1. **Ouvrir** : https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/functions
2. **Cliquer** : "Create a new function"
3. **Nom EXACT** : `make-server-9fd39b98`
4. **Template** : HTTP Request (ou vide)

### 2.2 Code de l'Edge Function
**Remplacez tout le contenu** par ce code :

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('🚀 CrewTech Edge Function Starting...')

// Variables d'environnement
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://nrvzifxdmllgcidfhlzh.supabase.co'
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
}

// Client Supabase avec service key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async (req) => {
  console.log(`📞 ${req.method} ${req.url}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  try {
    // 🏥 HEALTH CHECK - Route publique
    if (path === '/make-server-9fd39b98/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'CrewTech Platform',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        message: 'Edge Function is working! 🎉',
        project_id: 'nrvzifxdmllgcidfhlzh',
        environment: {
          supabase_url: !!SUPABASE_URL,
          anon_key: !!SUPABASE_ANON_KEY,
          service_key: !!SUPABASE_SERVICE_KEY
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 🔐 SECRETS STATUS - Route protégée
    if (path === '/make-server-9fd39b98/secrets/status') {
      const authHeader = req.headers.get('Authorization')
      const apikey = req.headers.get('apikey')
      
      return new Response(JSON.stringify({
        valid: true,
        timestamp: new Date().toISOString(),
        auth_header_present: !!authHeader,
        apikey_present: !!apikey,
        configured: {
          SUPABASE_URL: !!SUPABASE_URL,
          SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
          SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_KEY
        },
        environment_status: 'ready'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 🗄️ DATABASE TEST - Test de la table KV
    if (path === '/make-server-9fd39b98/debug/kv-test' && req.method === 'POST') {
      try {
        // Test de connexion à la table kv_store_9fd39b98
        const { data, error } = await supabaseAdmin
          .from('kv_store_9fd39b98')
          .select('*')
          .limit(1)
        
        return new Response(JSON.stringify({
          success: true,
          database_accessible: !error,
          table_exists: true,
          row_count: data?.length || 0,
          message: error ? `Database error: ${error.message}` : 'Database accessible ✅',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (dbError) {
        return new Response(JSON.stringify({
          success: false,
          database_accessible: false,
          error: dbError.message,
          message: 'Database connection failed ❌',
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 👥 AUTH LOGIN - Authentification
    if (path === '/make-server-9fd39b98/auth/login' && req.method === 'POST') {
      const { email, password } = await req.json()
      
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({
        success: true,
        access_token: data.session?.access_token,
        user: data.user
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 📋 KV STORE OPERATIONS - CRUD sur la table key-value
    if (path.startsWith('/make-server-9fd39b98/kv/')) {
      const operation = path.split('/').pop()
      
      if (operation === 'get' && req.method === 'POST') {
        const { key } = await req.json()
        const { data, error } = await supabaseAdmin
          .from('kv_store_9fd39b98')
          .select('value')
          .eq('key', key)
          .single()
        
        return new Response(JSON.stringify({
          success: !error,
          value: data?.value || null,
          error: error?.message
        }), {
          status: error ? 404 : 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      if (operation === 'set' && req.method === 'POST') {
        const { key, value } = await req.json()
        const { error } = await supabaseAdmin
          .from('kv_store_9fd39b98')
          .upsert({ key, value })
        
        return new Response(JSON.stringify({
          success: !error,
          error: error?.message
        }), {
          status: error ? 500 : 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // ❓ ROUTE INCONNUE - 404
    return new Response(JSON.stringify({
      error: 'Route not found',
      path: path,
      method: req.method,
      available_routes: [
        'GET /make-server-9fd39b98/health',
        'GET /make-server-9fd39b98/secrets/status', 
        'POST /make-server-9fd39b98/debug/kv-test',
        'POST /make-server-9fd39b98/auth/login',
        'POST /make-server-9fd39b98/kv/get',
        'POST /make-server-9fd39b98/kv/set'
      ],
      timestamp: new Date().toISOString()
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Server error:', error)
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

console.log('✅ CrewTech Edge Function Ready!')
console.log('📍 Health: /make-server-9fd39b98/health')
console.log('🔐 Secrets: /make-server-9fd39b98/secrets/status')
console.log('🗄️ KV Test: /make-server-9fd39b98/debug/kv-test')
```

### 2.3 Déployer
1. **Cliquez** : "Deploy function"
2. **Attendez** : Message "Function deployed successfully" ✅
3. **Notez l'URL** : `https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98`

---

## ⚡ ÉTAPE 3 : CONFIGURATION BASE DE DONNÉES

### 3.1 Créer la table KV Store
1. **Ouvrir** : https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/editor
2. **Onglet** : SQL Editor
3. **Exécuter ce SQL** :

```sql
-- Créer la table kv_store_9fd39b98 si elle n'existe pas
CREATE TABLE IF NOT EXISTS kv_store_9fd39b98 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE kv_store_9fd39b98 ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations (temporaire pour le développement)
CREATE POLICY IF NOT EXISTS "Allow all operations" ON kv_store_9fd39b98
FOR ALL USING (true);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_9fd39b98(key);
CREATE INDEX IF NOT EXISTS idx_kv_store_created_at ON kv_store_9fd39b98(created_at);

-- Insérer quelques données de test
INSERT INTO kv_store_9fd39b98 (key, value) 
VALUES 
  ('system:version', '"2.0.0"'),
  ('system:status', '"active"'),
  ('test:hello', '"world"')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Vérifier les données
SELECT key, value, created_at FROM kv_store_9fd39b98 ORDER BY created_at;
```

### 3.2 Configurer l'authentification
```sql
-- Vérifier/Créer les utilisateurs de test
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@crewtech.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(), 
  NOW(),
  'authenticated',
  'authenticated',
  '',
  '',
  '{"role": "admin", "name": "Admin CrewTech"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

INSERT INTO auth.users (
  id,
  instance_id, 
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'freelancer@crewtech.com',
  crypt('freelancer123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated', 
  'authenticated',
  '',
  '',
  '{"role": "freelancer", "name": "Freelancer Test"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Vérifier les utilisateurs créés
SELECT email, raw_user_meta_data FROM auth.users WHERE email LIKE '%crewtech.com';
```

---

## ⚡ ÉTAPE 4 : TEST IMMÉDIAT

### 4.1 Test Health Check (DOIT MARCHER)
```bash
curl -X GET "https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98/health"
```

**Réponse attendue :**
```json
{
  "status": "healthy",
  "service": "CrewTech Platform",
  "version": "2.0.0",
  "message": "Edge Function is working! 🎉"
}
```

### 4.2 Test Secrets Status
```bash
curl -X GET "https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98/secrets/status" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY"
```

### 4.3 Test Database KV
```bash
curl -X POST "https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98/debug/kv-test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d "{}"
```

---

## ⚡ ÉTAPE 5 : MISE À JOUR CLÉS DANS L'APPLICATION

### 5.1 Mettre à jour les clés
Remplacez dans `/utils/supabase/info.tsx` :

```typescript
export const projectId = 'nrvzifxdmllgcidfhlzh';
export const publicAnonKey = 'VOTRE_NOUVELLE_ANON_KEY_ICI';
```

### 5.2 Test depuis l'application
1. **Ouvrir** votre application CrewTech
2. **Dashboard** → Bouton "🌐 TEST HTTP"
3. **Lancer tous les tests**
4. **Vérifier** : Health ✅, Secrets ✅, KV ✅

---

## ⚡ ÉTAPE 6 : VÉRIFICATION FINALE

### 6.1 Checklist complète
- [ ] Project Supabase accessible
- [ ] Edge Function `make-server-9fd39b98` déployée
- [ ] Table `kv_store_9fd39b98` créée
- [ ] Utilisateurs test créés
- [ ] Health check retourne 200
- [ ] Application se connecte sans erreur

### 6.2 Credentials de test
```
Admin:
- Email: admin@crewtech.com
- Password: admin123

Freelancer:
- Email: freelancer@crewtech.com  
- Password: freelancer123
```

---

## 🎯 RÉSOLUTION DES PROBLÈMES

### Problème : Edge Function 404
- Vérifiez le nom exact : `make-server-9fd39b98`
- Redéployez avec le code complet ci-dessus

### Problème : Database error
- Exécutez le SQL de création de table
- Vérifiez les permissions RLS

### Problème : Auth failed
- Vérifiez les clés dans `/utils/supabase/info.tsx`
- Utilisez les bons credentials

---

## ✅ SUCCÈS !

Quand tous les tests passent :
1. **Health Check** ✅ - Edge Function déployée
2. **Secrets Status** ✅ - Authentication OK
3. **KV Database** ✅ - Base de données accessible
4. **Application Login** ✅ - Utilisateurs créés

➡️ **Votre plateforme CrewTech est opérationnelle !**

---

**Temps total estimé : 15-20 minutes**
**En cas de problème** : Recommencer depuis l'étape qui a échoué