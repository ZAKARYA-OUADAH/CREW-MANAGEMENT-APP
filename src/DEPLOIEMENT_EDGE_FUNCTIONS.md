# 🚀 Guide de Déploiement Edge Functions CrewTech

## ⚡ Déploiement Rapide (3 minutes)

### Méthode 1: Via Dashboard Supabase (RECOMMANDÉ)

1. **Ouvrir le Dashboard**
   - Allez sur : https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/functions

2. **Créer la Fonction**
   - Cliquez sur "Create a new function"
   - Nom : `crew-tech-server`
   - Copiez le code complet du fichier `supabase-edge-function-ready.ts`

3. **Déployer**
   - Collez le code dans l'éditeur
   - Cliquez sur "Deploy function"
   - Attendez la confirmation ✅

4. **Tester**
   - URL : https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/crew-tech-server/make-server-9fd39b98/health
   - Réponse attendue : `{"status": "healthy", ...}`

---

### Méthode 2: Via CLI Supabase

```bash
# 1. Installer la CLI
npm install -g supabase

# 2. Se connecter
supabase login

# 3. Lier au projet
supabase link --project-ref nrvzifxdmllgcidfhlzh

# 4. Créer le fichier
mkdir -p supabase/functions/crew-tech-server
cp supabase-edge-function-ready.ts supabase/functions/crew-tech-server/index.ts

# 5. Déployer
supabase functions deploy crew-tech-server
```

---

## 🔧 Configuration des Variables

### Variables d'Environnement Requises

Dans Supabase Dashboard → Project Settings → Edge Functions → Environment Variables :

```
SUPABASE_URL=https://nrvzifxdmllgcidfhlzh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY2OTAsImV4cCI6MjA3MTk3MjY5MH0.LQkxhokeAsrpQDKmBQ4f6mpP0XJlwRjXNEGKjOM1xVs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5NjY5MCwiZXhwIjoyMDcxOTcyNjkwfQ.dCx1BUVy4K7YecsyNN5pAIJ_CKLgO-s5KM5WKIZQyWs
```

**Note**: Ces variables sont déjà intégrées dans le code avec des fallbacks, donc même si non configurées, la fonction devrait fonctionner.

---

## ✅ Tests de Vérification

### 1. Health Check
```bash
curl https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/crew-tech-server/make-server-9fd39b98/health
```

Réponse attendue:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "version": "1.0.0",
  "service": "CrewTech Platform"
}
```

### 2. Test des Secrets
```bash
curl https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/crew-tech-server/make-server-9fd39b98/secrets/status
```

### 3. Test KV Store
```bash
curl -X POST https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/crew-tech-server/make-server-9fd39b98/debug/kv-test \
  -H "Content-Type: application/json" \
  -d '{"test_key": "test", "test_value": "hello"}'
```

### 4. Initialiser les Données de Test
```bash
curl -X POST https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/crew-tech-server/make-server-9fd39b98/seed/init
```

---

## 🏗️ Structure de l'API

### Endpoints Disponibles

#### **Authentification**
- `POST /make-server-9fd39b98/auth/signup` - Créer un utilisateur
- `POST /make-server-9fd39b98/auth/login` - Se connecter

#### **Missions** (Authentification requise)
- `GET /make-server-9fd39b98/missions` - Liste des missions
- `POST /make-server-9fd39b98/missions` - Créer une mission

#### **Équipage** (Authentification requise)
- `GET /make-server-9fd39b98/crew` - Liste des membres d'équipage

#### **Notifications** (Authentification requise)
- `GET /make-server-9fd39b98/notifications` - Notifications utilisateur
- `POST /make-server-9fd39b98/notifications` - Créer une notification

#### **Diagnostic**
- `GET /make-server-9fd39b98/health` - Status de santé
- `GET /make-server-9fd39b98/secrets/status` - Status des variables
- `POST /make-server-9fd39b98/debug/kv-test` - Test base de données
- `GET /make-server-9fd39b98/debug/auth-test` - Test authentification

#### **Données**
- `POST /make-server-9fd39b98/seed/init` - Initialiser données de test

---

## 🔍 Dépannage

### Erreur 404 - Function Not Found
**Cause**: La fonction n'est pas déployée ou le nom est incorrect
**Solution**: 
1. Vérifiez que la fonction existe dans le Dashboard
2. Redéployez avec le bon nom : `crew-tech-server`

### Erreur 500 - Internal Server Error
**Cause**: Erreur dans le code ou variables manquantes
**Solution**:
1. Vérifiez les logs dans le Dashboard Supabase
2. Vérifiez les variables d'environnement
3. Redéployez avec le code fourni

### Erreur CORS
**Cause**: Configuration CORS incorrecte
**Solution**: Le code fourni inclut déjà la configuration CORS complète

### Erreur de Connexion
**Cause**: Problème réseau ou URL incorrecte
**Solution**: 
1. Vérifiez l'URL : `https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/crew-tech-server/`
2. Testez avec curl ou Postman

---

## 📊 Monitoring

### Logs
- Dashboard Supabase → Edge Functions → crew-tech-server → Logs
- Les erreurs et informations sont automatiquement loggées

### Métriques
- Dashboard Supabase → Edge Functions → crew-tech-server → Metrics
- Statistiques d'usage et performance

---

## 🔄 Mise à Jour

Pour mettre à jour la fonction :
1. Modifiez le code dans `supabase-edge-function-ready.ts`
2. Redéployez via Dashboard ou CLI
3. Testez les endpoints pour vérifier le fonctionnement

---

## ⚡ Checklist de Déploiement Rapide

- [ ] Copier le code de `supabase-edge-function-ready.ts`
- [ ] Créer la fonction `crew-tech-server` dans Dashboard Supabase
- [ ] Déployer la fonction
- [ ] Tester `/health` endpoint
- [ ] Tester `/secrets/status` endpoint  
- [ ] Initialiser les données avec `/seed/init`
- [ ] Vérifier que l'application CrewTech se reconnecte automatiquement

**Temps estimé**: 2-3 minutes ⚡

---

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans le Dashboard Supabase
2. Testez chaque endpoint individuellement
3. Utilisez l'outil de diagnostic intégré dans l'application CrewTech (Settings → Development)

**L'application CrewTech détectera automatiquement quand les Edge Functions sont à nouveau disponibles !** 🎉