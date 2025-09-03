# Instructions d'Importation de la Base de Données

## Fichiers d'Importation

1. **`database-import.csv`** - Données principales de l'application (KV Store)
2. **`auth-users-import.csv`** - Données d'authentification des utilisateurs
3. **`IMPORT_INSTRUCTIONS.md`** - Ce fichier d'instructions

## Méthode 1: Importation Supabase Dashboard (Recommandée)

### Étape 1: Importer la table KV Store

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **Database** > **Tables**
3. Sélectionnez la table `kv_store_9fd39b98`
4. Cliquez sur **Import data via spreadsheet**
5. Téléchargez le fichier `database-import.csv`
6. Assurez-vous que :
   - **Column 1** = `key` (TEXT)
   - **Column 2** = `value` (JSONB)
7. Cliquez sur **Import**

### Étape 2: Créer les utilisateurs d'authentification

**Option A: Via Dashboard Supabase**
1. Allez dans **Authentication** > **Users**
2. Pour chaque utilisateur dans `auth-users-import.csv`, cliquez sur **Add user**
3. Saisissez manuellement :
   - Email
   - Password
   - Metadata : `{"name": "Nom Utilisateur", "role": "role_utilisateur"}`
   - **Cochez "Auto Confirm User"** (important!)

**Option B: Via SQL Editor**
```sql
-- Exécutez ces commandes une par une dans l'éditeur SQL
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@crewtech.fr',
  crypt('admin123!', gen_salt('bf')),
  NOW(),
  '{"name": "Sophie Laurent", "role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Répétez pour chaque utilisateur...
```

## Méthode 2: Importation via API (Alternative)

Si vous préférez automatiser l'importation via script:

```bash
# Utilisez l'endpoint de seeding direct que nous avons créé
curl -X POST "https://[VOTRE_PROJECT_ID].supabase.co/functions/v1/make-server-9fd39b98/auto-seed-direct" \
  -H "Authorization: Bearer [VOTRE_ANON_KEY]" \
  -H "Content-Type: application/json"
```

## Vérification Post-Importation

### Vérifier les données KV Store
```sql
SELECT COUNT(*) FROM kv_store_9fd39b98;
-- Devrait retourner 13 enregistrements
```

### Vérifier les utilisateurs
```sql
SELECT email, raw_user_meta_data FROM auth.users;
-- Devrait afficher les 5 utilisateurs
```

### Tester la connexion
1. Allez sur votre application
2. Utilisez les identifiants de test :
   - **Admin**: admin@crewtech.fr / admin123!
   - **Internal**: internal@crewtech.fr / internal123!
   - **Freelancer**: freelancer@aviation.com / freelancer123!

## Structure des Données Importées

### Utilisateurs (5)
- 1 Administrateur (Sophie Laurent)
- 1 Pilote interne (Pierre Dubois)  
- 3 Freelancers (Lisa Anderson, Marco Rossi, Sarah Mitchell)

### Missions (3)
- 1 Mission approuvée (freelance)
- 1 Mission en attente (jour supplémentaire)
- 1 Mission rejetée (freelance)

### Notifications (4)
- Notifications liées aux missions
- Notifications de mise à jour de profil

## Dépannage

### Erreur d'authentification
- Vérifiez que les utilisateurs ont bien **email_confirmed_at** défini
- Assurez-vous que les mots de passe sont bien hashés

### Données manquantes
- Vérifiez que le CSV a été importé complètement
- Utilisez l'endpoint `/status-direct` pour diagnostiquer

### Problèmes de format JSON
- Assurez-vous que les valeurs JSON dans le CSV sont bien échappées
- Vérifiez qu'il n'y a pas de caractères spéciaux non échappés

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs Supabase
2. Utilisez l'endpoint de diagnostic : `/status-direct`
3. Consultez la console développeur de votre navigateur

## Nettoyage (Si Nécessaire)

Pour vider les données et recommencer :
```sql
-- Supprimer toutes les données KV
DELETE FROM kv_store_9fd39b98;

-- Supprimer tous les utilisateurs de test (ATTENTION!)
DELETE FROM auth.users WHERE email LIKE '%@crewtech.fr' OR email LIKE '%@aviation.com' OR email LIKE '%@freelance.eu' OR email LIKE '%@crewaviation.com';
```