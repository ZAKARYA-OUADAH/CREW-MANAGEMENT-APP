# Cahier des Charges Fonctionnels
## Plateforme CrewTech - Gestion d'Équipages d'Aviation d'Affaires

---

### Document Information
- **Projet** : CrewTech Aviation Crew Management Platform
- **Version** : 1.0
- **Date** : Décembre 2024
- **Statut** : Implémenté
- **Langues supportées** : Français, Anglais

---

## 1. PRÉSENTATION GÉNÉRALE DU PROJET

### 1.1 Contexte
CrewTech est une plateforme web centralisée de gestion des équipages d'aviation d'affaires qui gère à la fois le personnel interne et les freelancers sur tout le cycle de vie des missions, des demandes initiales à la validation finale.

### 1.2 Objectifs
- Centraliser la gestion des équipages (internes et freelancers)
- Automatiser la planification et l'assignation des missions
- Simplifier le processus de validation client
- Optimiser la gestion documentaire et des certifications
- Faciliter le suivi financier et la facturation
- Intégrer avec les systèmes existants (Mint, Leon)

### 1.3 Périmètre
La plateforme couvre l'ensemble du processus de gestion d'équipage depuis la planification jusqu'à la facturation, incluant :
- Gestion des profils d'équipage
- Planification de vol basée sur calendrier
- Workflow de validation des missions
- Génération automatique de documents
- Export des données financières

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Stack Technologique
- **Frontend** : React 18 + TypeScript
- **Styling** : Tailwind CSS v4 + shadcn/ui
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **API** : Supabase Edge Functions (Hono.js)
- **PDF Generation** : Intégré
- **Routing** : React Router v6

### 2.2 Architecture Applicative
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer     │    │   Database      │
│   React/TS      │◄──►│   Supabase      │◄──►│   PostgreSQL    │
│                 │    │   Edge Functions│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.3 Sécurité
- Authentification basée sur les rôles (Admin/Freelancer)
- Gestion des sessions sécurisées
- Protection des routes selon les permissions
- Validation côté serveur pour toutes les opérations critiques

---

## 3. ACTEURS ET RÔLES

### 3.1 Administrateur / Opérateur de Vol
**Permissions** :
- Accès complet à toutes les fonctionnalités
- Gestion des équipages internes et freelancers
- Création et validation des missions
- Export des données financières
- Configuration des paramètres système

**Responsabilités** :
- Planification des vols et assignation des équipages
- Validation des demandes de mission
- Suivi de la conformité documentaire
- Gestion de la facturation client

### 3.2 Freelancer
**Permissions** :
- Accès à son profil personnel
- Consultation des missions assignées
- Validation/acceptation des missions
- Mise à jour de ses documents et certifications

**Responsabilités** :
- Maintien à jour de son profil
- Réponse aux demandes de mission
- Respect des délais de validation

---

## 4. FONCTIONNALITÉS PRINCIPALES

### 4.1 Dashboard Administrateur

#### 4.1.1 Vue d'ensemble des opérations
- **Statistiques temps réel** : Nombre de vols, missions actives, équipages disponibles
- **Calendrier des vols** : Vue mensuelle avec filtrage par aircraft/équipage
- **Alertes** : Documents expirés, missions en attente, équipages indisponibles
- **Accès rapide** : Création de missions, gestion d'urgence

#### 4.1.2 Planification des vols
- **Filtrage avancé** : Par date, aircraft, destination, statut
- **Sélection multiple** : Attribution de plusieurs vols à une mission
- **Visualisation** : Détails des vols avec informations aircraft et horaires
- **Actions rapides** : Création directe de demandes de mission

### 4.2 Gestion des Équipages

#### 4.2.1 Base de données centralisée
- **Profils complets** : Informations personnelles, qualifications, certifications
- **Statuts dynamiques** : Disponibilité, documents manquants, expiration
- **Filtrage intelligent** : Par qualification aircraft, position, disponibilité
- **Import/Export** : Synchronisation avec systèmes existants

#### 4.2.2 Suivi documentaire
- **Documents requis** : Licence, médical, passeport, contact d'urgence
- **Alertes d'expiration** : Notifications automatiques avant échéance
- **Workflow de validation** : Processus de vérification des documents
- **Notifications** : Rappels automatiques aux équipages

#### 4.2.3 Qualification des équipages
- **Matrice de qualifications** : Association équipage/aircraft
- **Positions supportées** : Captain, First Officer, Flight Attendant, Senior Flight Attendant
- **Validation automatique** : Vérification de compatibilité pour les missions

### 4.3 Système de Demandes de Mission

#### 4.3.1 Types de demandes
- **Extra Day Assignment** : Jour supplémentaire pour équipage interne
- **Freelance Mission Contract** : Contrat de mission freelance
- **Service Request** : Demande de service spécialisé

#### 4.3.2 Processus de création
1. **Sélection des critères** : Aircraft, position, période
2. **Filtrage automatique** : Équipages qualifiés et disponibles
3. **Sélection d'équipage** : Choix parmi les candidats éligibles
4. **Configuration de mission** : Détails contractuels et tarifaires
5. **Génération automatique** : Email client et ordre de mission

#### 4.3.3 Configuration contractuelle
- **Types de rémunération** : Journalier, mensuel, forfaitaire
- **Gestion des devises** : EUR, USD, GBP, CHF
- **Calcul automatique** : Salaires, per diem, marges
- **Validation tarifaire** : Conformité avec la matrice de prix

### 4.4 Workflow de Validation

#### 4.4.1 Validation client
- **Génération automatique** : Email de demande avec calcul de coûts
- **Statuts de suivi** : En attente, approuvé, rejeté
- **Interface dédiée** : Portail de validation pour clients
- **Notifications automatiques** : Alertes selon les réponses

#### 4.4.2 Validation équipage
- **Notification automatique** : Après validation client
- **Interface dédiée** : Portail freelancer pour acceptation
- **Délais de réponse** : Suivi des temps de réaction
- **Escalade automatique** : En cas de non-réponse

### 4.5 Gestion Financière

#### 4.5.1 Calcul des coûts
- **Matrice de prix** : Tarifs par position et type d'aircraft
- **Gestion des marges** : Pourcentage configurable par mission
- **Multi-devises** : Support de 4 devises principales
- **Calculs automatiques** : Coûts totaux avec marges

#### 4.5.2 Export et facturation
- **Export JSON** : Intégration avec systèmes comptables
- **Génération PDF** : Ordres de mission et factures
- **Suivi des paiements** : Statuts et échéances
- **Rapports financiers** : Analyses par période/client

### 4.6 Système de Notifications

#### 4.6.1 Types de notifications
- **Système** : Alertes techniques et mises à jour
- **Mission** : Nouvelles demandes, validations, modifications
- **Profile** : Documents manquants, mises à jour requises
- **Document** : Expirations et renouvellements

#### 4.6.2 Canaux de diffusion
- **Interface web** : Centre de notifications intégré
- **Email** : Notifications critiques et résumés
- **Temps réel** : Mise à jour instantanée des statuts

---

## 5. INTERFACES UTILISATEUR

### 5.1 Portail Administrateur

#### 5.1.1 Navigation principale
- **Dashboard** : Vue d'ensemble des opérations
- **Mission Request** : Création de nouvelles demandes
- **Manage Missions** : Suivi des missions actives
- **Manage Crew** : Gestion des équipages
- **Finance Export** : Exports comptables
- **Cost Simulation** : Simulation de coûts
- **Settings** : Configuration système

#### 5.1.2 Composants spécialisés
- **Calendrier intégré** : Planification visuelle
- **Filtres avancés** : Recherche multicritères
- **Tables dynamiques** : Tri et pagination
- **Modales de validation** : Workflow intégré

### 5.2 Portail Freelancer

#### 5.2.1 Interface simplifiée
- **Dashboard personnel** : Missions et statuts
- **Profile** : Gestion des informations personnelles
- **Missions** : Historique et missions actives
- **Documents** : Ordres de mission et factures

#### 5.2.2 Workflow optimisé
- **Validation rapide** : Acceptation/refus en un clic
- **Mise à jour profil** : Interface intuitive
- **Notifications prioritaires** : Alertes importantes

---

## 6. INTÉGRATIONS ET APIs

### 6.1 Systèmes externes
- **Mint** : Synchronisation des données d'équipage
- **Leon** : Import des données de vol
- **Systèmes comptables** : Export JSON automatisé

### 6.2 APIs internes
- **Auth Routes** : Gestion de l'authentification
- **Crew Routes** : CRUD équipages
- **Mission Routes** : Gestion des missions
- **Data Routes** : Synchronisation des données
- **Notification Routes** : Système de notifications

---

## 7. DONNÉES ET CONFIGURATION

### 7.1 Configuration des Aéronefs
```typescript
interface Aircraft {
  id: string;
  immat: string;
  type: string;
  manufacturer: string;
  category: string;
  maxPassengers: number;
  range: number;
  status: string;
}
```

### 7.2 Matrice de Prix
- **Structure hiérarchique** : Position > Aircraft > Tarif
- **Types de tarification** : Journalier, mensuel
- **Gestion multi-devises** : Configuration par position
- **Per diem intégré** : Calcul automatique par position

### 7.3 Paramètres Société
- **Informations générales** : Nom, devise par défaut, timezone
- **Email de contact** : operations@crewtech.fr
- **Marges commerciales** : Pourcentage configurable
- **Paramètres per diem** : Montants par défaut

---

## 8. SÉCURITÉ ET CONFORMITÉ

### 8.1 Protection des données
- **Chiffrement en transit** : HTTPS obligatoire
- **Authentification forte** : Supabase Auth
- **Isolation des données** : Séparation par rôle
- **Audit trail** : Traçabilité des actions

### 8.2 Conformité réglementaire
- **RGPD** : Gestion des données personnelles
- **Aviation civile** : Respect des exigences documentaires
- **Archivage** : Conservation des ordres de mission

---

## 9. PERFORMANCES ET SCALABILITÉ

### 9.1 Optimisations
- **Lazy loading** : Chargement progressif des composants
- **Cache intelligent** : Mise en cache des données fréquentes
- **Pagination** : Gestion des grandes listes
- **Filtrage côté serveur** : Réduction du trafic réseau

### 9.2 Monitoring
- **Métriques applicatives** : Temps de réponse, erreurs
- **Utilisation ressources** : Base de données, API
- **Satisfaction utilisateur** : Temps de chargement, disponibilité

---

## 10. ÉVOLUTIONS FUTURES

### 10.1 Fonctionnalités planifiées
- **Mobile App** : Application native iOS/Android
- **API publique** : Intégration tiers facilitée
- **BI avancée** : Tableaux de bord analytiques
- **Planification automatique** : IA pour l'assignation optimale

### 10.2 Intégrations étendues
- **Systèmes de réservation** : Amadeus, Sabre
- **Outils météo** : Alertes conditions de vol
- **Géolocalisation** : Suivi temps réel des équipages
- **Communication** : Intégration Teams/Slack

---

## 11. MAINTENANCE ET SUPPORT

### 11.1 Maintenance technique
- **Mises à jour sécurité** : Patches réguliers
- **Évolutions fonctionnelles** : Déploiements mensuels
- **Monitoring continu** : Surveillance 24/7
- **Sauvegardes** : Backup quotidien automatisé

### 11.2 Support utilisateur
- **Documentation** : Guides utilisateur intégrés
- **Formation** : Sessions pour nouveaux utilisateurs
- **Hotline** : Support technique réactif
- **Feedback** : Collecte continue d'améliorations

---

## ANNEXES

### A. Glossaire
- **Aircraft** : Aéronef, avion
- **GGID** : Global Ground ID, identifiant unique équipage
- **Per diem** : Indemnité journalière
- **Freelancer** : Équipage externe/contractuel
- **Mission Order** : Ordre de mission officiel

### B. Références techniques
- **React** : https://react.dev/
- **Supabase** : https://supabase.com/
- **Tailwind CSS** : https://tailwindcss.com/
- **shadcn/ui** : https://ui.shadcn.com/

### C. Contacts projet
- **Email opérations** : operations@crewtech.fr
- **Équipe technique** : Via plateforme de développement
- **Support utilisateur** : Via interface intégrée

---

*Document généré automatiquement à partir de l'analyse du code source - Décembre 2024*