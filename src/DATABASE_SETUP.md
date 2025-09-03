# Configuration de la Base de Données CrewTech

Ce guide vous explique comment peupler votre base de données Supabase avec des données de test pour la plateforme CrewTech.

## 🚀 Démarrage Rapide

### 1. Accès à l'Interface de Peuplement
1. Connectez-vous avec un compte administrateur
2. Naviguez vers **Settings** → **Development**
3. Utilisez l'outil **Database Seeder**

### 2. Test de Connexion
Avant de peupler la base, testez la connectivité :
- Cliquez sur **"Tester la Connexion"**
- Vérifiez que tous les services sont opérationnels
- Consultez le statut de la base de données

### 3. Peuplement de la Base
- Cliquez sur **"Peupler la Base"**
- Attendez la fin du processus (indicateur de progression)
- Récupérez les identifiants de test générés

## 📊 Données Créées

### Utilisateurs (5 comptes)

#### Administrateur
- **Email:** `admin@crewtech.fr`
- **Mot de passe:** `admin123!`
- **Nom:** Sophie Laurent
- **Rôle:** Operations Manager
- **Accès:** Complet (toutes fonctionnalités)

#### Personnel Interne
- **Email:** `internal@crewtech.fr`
- **Mot de passe:** `internal123!`
- **Nom:** Pierre Dubois
- **Rôle:** Captain
- **Accès:** Interface freelancer avec statut employé

#### Freelancers (3 comptes)
1. **Lisa Anderson** (`freelancer@aviation.com` / `freelancer123!`)
   - Flight Attendant
   - Qualifications: F-HBCD, F-GXYZ

2. **Marco Rossi** (`captain@freelance.eu` / `captain123!`)
   - Captain
   - Qualifications: F-HABC, F-HDEF

3. **Sarah Mitchell** (`sarah@crewaviation.com` / `sarah123!`)
   - First Officer
   - Qualifications: F-GXYZ, F-HGHJ

### Missions (3 ordres d'exemple)

#### MO-20241212001 - ✅ Approuvée
- **Type:** Freelance
- **Équipage:** Lisa Anderson
- **Route:** LFPB → EGGW
- **Date:** 15 décembre 2024
- **Statut:** Approuvée par Sophie Laurent

#### MO-20241212002 - ⏳ En Attente
- **Type:** Jour supplémentaire
- **Équipage:** Pierre Dubois (interne)
- **Route:** LFMD → EGLL
- **Date:** 18 décembre 2024
- **Statut:** En attente d'approbation

#### MO-20241212003 - ❌ Rejetée
- **Type:** Freelance
- **Équipage:** Marco Rossi
- **Route:** EGLL → LFMD → EGLL
- **Dates:** 20-22 décembre 2024
- **Statut:** Rejetée (indisponibilité)

### Notifications
- Notifications de mission (approbation, rejet, assignation)
- Rappels de mise à jour de profil
- Notifications système

## 🔄 Workflow de Test Recommandé

### 1. Test Interface Admin
1. Connectez-vous comme `admin@crewtech.fr`
2. Explorez le tableau de bord
3. Consultez les missions existantes
4. Testez la création d'une nouvelle mission
5. Approuvez/rejetez des missions en attente

### 2. Test Interface Interne
1. Connectez-vous comme `internal@crewtech.fr`
2. Consultez les missions assignées
3. Mettez à jour le profil
4. Testez les notifications

### 3. Test Interface Freelancer
1. Connectez-vous comme `freelancer@aviation.com`
2. Consultez l'historique des missions
3. Téléchargez un ordre de mission PDF
4. Mettez à jour la disponibilité

## 🛠️ Dépannage

### Base de Données Vide
Si la base apparaît vide après le seeding :
1. Vérifiez les logs de la console
2. Relancez le test de connexion
3. Répétez le processus de peuplement

### Erreurs de Connexion
- Vérifiez les variables d'environnement Supabase
- Contrôlez les permissions de la clé de service
- Consultez les logs du serveur Edge Function

### Nettoyage des Données
Pour effacer les données de test :
1. Utilisez l'interface Supabase
2. Supprimez les entrées dans la table `kv_store_9fd39b98`
3. Supprimez les utilisateurs dans Auth

## 📋 Structure des Données

### Table KV Store
Les données sont stockées avec les préfixes suivants :
- `user:{user_id}` - Profils utilisateur étendus
- `mission:{mission_id}` - Ordres de mission
- `notification:{user_id}:{notif_id}` - Notifications utilisateur

### Authentification Supabase
- Utilisateurs créés dans Supabase Auth
- Métadonnées : nom, rôle, type
- Email confirmé automatiquement

## 🔍 Données Réalistes

Toutes les données de test sont conçues pour être réalistes :
- Adresses européennes authentiques
- Numéros de téléphone valides
- Codes d'aéroport ICAO réels
- Immatriculations d'aéronefs françaises
- Qualifications aviation standard

## 📞 Support

En cas de problème avec le peuplement :
1. Consultez la console développeur
2. Vérifiez les logs du serveur
3. Utilisez les outils de diagnostic intégrés
4. Contactez l'équipe de développement

---

**Note:** Ces données sont uniquement destinées au développement et aux tests. Ne les utilisez jamais en production.