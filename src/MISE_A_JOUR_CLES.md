# 🔑 Mise à Jour des Clés Supabase

## 🎯 Après le déploiement de l'Edge Function

Une fois que vous avez déployé l'Edge Function avec succès, il faut mettre à jour les clés dans l'application.

---

## ⚡ ÉTAPE 1 : Récupérer les nouvelles clés

### 1.1 Aller sur le Dashboard Supabase
👉 [https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/settings/api](https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/settings/api)

### 1.2 Copier les clés
- **anon / public** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## ⚡ ÉTAPE 2 : Mettre à jour le fichier info.tsx

### 2.1 Ouvrir le fichier
```
/utils/supabase/info.tsx
```

### 2.2 Remplacer le contenu
```typescript
export const projectId = 'nrvzifxdmllgcidfhlzh';
export const publicAnonKey = 'VOTRE_NOUVELLE_ANON_KEY_ICI';
```

**⚠️ Important :** 
- Remplacez `VOTRE_NOUVELLE_ANON_KEY_ICI` par votre vraie clé anon/public
- **NE JAMAIS** mettre la clé service_role dans ce fichier
- Ce fichier est utilisé côté frontend

### 2.3 Exemple concret
```typescript
export const projectId = 'nrvzifxdmllgcidfhlzh';
export const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY2OTAsImV4cCI6MjA3MTk3MjY5MH0.LQkxhokeAsrpQDKmBQ4f6mpP0XJlwRjXNEGKjOM1xVs';
```

---

## ⚡ ÉTAPE 3 : Vérification

### 3.1 Recharger l'application
Après avoir modifié le fichier, rechargez votre application CrewTech.

### 3.2 Test automatique
Le composant `SystemHealthChecker` va automatiquement :
- ✅ Tester la connexion Edge Function
- ✅ Vérifier la base de données  
- ✅ Contrôler l'authentification

### 3.3 Si tout fonctionne
- Les alertes rouges disparaissent
- Le système affiche "✅ Système opérationnel"
- Vous pouvez utiliser l'application normalement

### 3.4 Si ça ne fonctionne pas
- Vérifiez que la clé anon est correcte
- Assurez-vous que l'Edge Function est bien déployée
- Utilisez le bouton "🚀 REDÉPLOYER" si nécessaire

---

## 🔄 Configuration Variables d'Environnement Supabase

Si vous voulez utiliser les variables d'environnement Supabase (recommandé) :

### Dans le Dashboard Supabase
1. Allez sur : [Edge Functions Settings](https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/functions)
2. Cliquez sur votre fonction `make-server-9fd39b98`
3. Onglet "Settings" ou "Environment Variables"
4. Ajoutez :
   - `SUPABASE_URL` = `https://nrvzifxdmllgcidfhlzh.supabase.co`
   - `SUPABASE_ANON_KEY` = `votre_clé_anon`
   - `SUPABASE_SERVICE_ROLE_KEY` = `votre_clé_service`

### Dans votre Edge Function
Le code utilise déjà ces variables :
```typescript
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://nrvzifxdmllgcidfhlzh.supabase.co'
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
```

---

## 🎯 Checklist Finale

### ✅ Avant de continuer
- [ ] Edge Function `make-server-9fd39b98` déployée
- [ ] Table `kv_store_9fd39b98` créée
- [ ] Utilisateurs test créés
- [ ] Clé anon mise à jour dans `/utils/supabase/info.tsx`
- [ ] Application rechargée
- [ ] SystemHealthChecker affiche "✅ Système opérationnel"

### ✅ Tests de fonctionnement
- [ ] Login avec admin@crewtech.com / admin123
- [ ] Login avec freelancer@crewtech.com / freelancer123
- [ ] Dashboard se charge sans erreur
- [ ] Pas d'alertes rouges

---

## 🚨 Dépannage

### Erreur "Invalid API key"
- Vérifiez que la clé anon est complète et correcte
- Assurez-vous qu'il n'y a pas d'espaces avant/après

### Erreur "Edge Function not found"
- Vérifiez le nom exact : `make-server-9fd39b98`
- Redéployez l'Edge Function si nécessaire

### Erreur "Database connection failed"
- Vérifiez que la table `kv_store_9fd39b98` existe
- Exécutez à nouveau le SQL de création de table

### L'application ne se charge pas
- Ouvrez la console développeur (F12)
- Vérifiez les erreurs JavaScript
- Assurez-vous que le fichier `info.tsx` est correct

---

**🎉 Une fois que tous les tests passent, votre plateforme CrewTech est entièrement fonctionnelle !**