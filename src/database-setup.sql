-- =====================================================
-- CREWTECH DATABASE SETUP - SUPABASE SQL SCRIPT
-- =====================================================
-- Ce script configure toute la base de données pour CrewTech
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- =====================================================
-- 1. CRÉATION DE LA TABLE PRINCIPALE KV STORE
-- =====================================================

-- Supprimer la table si elle existe déjà (attention: perte de données)
-- DROP TABLE IF EXISTS kv_store_9fd39b98;

-- Créer la table principal de stockage key-value
CREATE TABLE IF NOT EXISTS kv_store_9fd39b98 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CRÉATION DES INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour les recherches par préfixe (utilisé par getByPrefix)
CREATE INDEX IF NOT EXISTS idx_kv_store_9fd39b98_key_prefix 
ON kv_store_9fd39b98 USING btree (key text_pattern_ops);

-- Index GIN pour les recherches dans les valeurs JSONB
CREATE INDEX IF NOT EXISTS idx_kv_store_9fd39b98_value_gin 
ON kv_store_9fd39b98 USING gin (value);

-- Index pour les timestamps
CREATE INDEX IF NOT EXISTS idx_kv_store_9fd39b98_created_at 
ON kv_store_9fd39b98 (created_at);

CREATE INDEX IF NOT EXISTS idx_kv_store_9fd39b98_updated_at 
ON kv_store_9fd39b98 (updated_at);

-- =====================================================
-- 3. FONCTION POUR MISE À JOUR AUTOMATIQUE DU TIMESTAMP
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger pour appeler la fonction lors des UPDATE
DROP TRIGGER IF EXISTS update_kv_store_9fd39b98_updated_at ON kv_store_9fd39b98;
CREATE TRIGGER update_kv_store_9fd39b98_updated_at
    BEFORE UPDATE ON kv_store_9fd39b98
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. CONFIGURATION RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Activer RLS sur la table
ALTER TABLE kv_store_9fd39b98 ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations (développement)
-- ATTENTION: En production, créez des politiques plus restrictives
DROP POLICY IF EXISTS "Allow all operations" ON kv_store_9fd39b98;
CREATE POLICY "Allow all operations" ON kv_store_9fd39b98
FOR ALL 
USING (true) 
WITH CHECK (true);

-- =====================================================
-- 5. POLITIQUE ALTERNATIVE (PLUS SÉCURISÉE)
-- =====================================================

-- Si vous voulez des politiques plus strictes, commentez la politique ci-dessus
-- et décommentez les politiques suivantes:

/*
-- Politique pour la lecture (tous les utilisateurs authentifiés)
CREATE POLICY "Allow read for authenticated users" ON kv_store_9fd39b98
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Politique pour l'insertion (tous les utilisateurs authentifiés)
CREATE POLICY "Allow insert for authenticated users" ON kv_store_9fd39b98
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Politique pour la mise à jour (tous les utilisateurs authentifiés)
CREATE POLICY "Allow update for authenticated users" ON kv_store_9fd39b98
FOR UPDATE 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- Politique pour la suppression (tous les utilisateurs authentifiés)
CREATE POLICY "Allow delete for authenticated users" ON kv_store_9fd39b98
FOR DELETE 
USING (auth.role() = 'authenticated');
*/

-- =====================================================
-- 6. PERMISSIONS POUR LE SERVICE ROLE
-- =====================================================

-- S'assurer que le service role peut tout faire sur cette table
GRANT ALL ON kv_store_9fd39b98 TO service_role;
GRANT ALL ON kv_store_9fd39b98 TO postgres;

-- =====================================================
-- 7. VUES UTILES POUR L'ADMINISTRATION
-- =====================================================

-- Vue pour compter les différents types d'enregistrements
CREATE OR REPLACE VIEW kv_store_stats AS
SELECT 
  SPLIT_PART(key, ':', 1) AS entity_type,
  COUNT(*) AS count,
  MIN(created_at) AS first_created,
  MAX(updated_at) AS last_updated
FROM kv_store_9fd39b98
GROUP BY SPLIT_PART(key, ':', 1)
ORDER BY count DESC;

-- Vue pour les utilisateurs
CREATE OR REPLACE VIEW users_view AS
SELECT 
  key,
  value->>'id' AS user_id,
  value->>'email' AS email,
  value->>'name' AS name,
  value->>'role' AS role,
  value->>'type' AS type,
  (value->>'created_at')::timestamp AS created_at,
  updated_at
FROM kv_store_9fd39b98
WHERE key LIKE 'user:%'
ORDER BY updated_at DESC;

-- Vue pour les missions
CREATE OR REPLACE VIEW missions_view AS
SELECT 
  key,
  value->>'id' AS mission_id,
  value->>'title' AS title,
  value->>'status' AS status,
  value->>'departure' AS departure,
  value->>'arrival' AS arrival,
  (value->>'departureDate')::date AS departure_date,
  updated_at
FROM kv_store_9fd39b98
WHERE key LIKE 'mission:%'
ORDER BY updated_at DESC;

-- =====================================================
-- 8. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour nettoyer les anciens enregistrements de test
CREATE OR REPLACE FUNCTION clean_test_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM kv_store_9fd39b98 
  WHERE key LIKE 'test_%' 
  OR (value->>'email' LIKE '%test%' AND value->>'role' = 'test');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir des statistiques détaillées
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE(
  total_records BIGINT,
  users_count BIGINT,
  missions_count BIGINT,
  notifications_count BIGINT,
  other_count BIGINT,
  table_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM kv_store_9fd39b98) AS total_records,
    (SELECT COUNT(*) FROM kv_store_9fd39b98 WHERE key LIKE 'user:%') AS users_count,
    (SELECT COUNT(*) FROM kv_store_9fd39b98 WHERE key LIKE 'mission:%') AS missions_count,
    (SELECT COUNT(*) FROM kv_store_9fd39b98 WHERE key LIKE 'notification:%') AS notifications_count,
    (SELECT COUNT(*) FROM kv_store_9fd39b98 WHERE key NOT LIKE 'user:%' AND key NOT LIKE 'mission:%' AND key NOT LIKE 'notification:%') AS other_count,
    pg_size_pretty(pg_total_relation_size('kv_store_9fd39b98')) AS table_size;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. CONFIGURATION DES EXTENSIONS NÉCESSAIRES
-- =====================================================

-- Extension pour UUID (si nécessaire)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour fonctions de chiffrement (si nécessaire)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 10. TEST DE FONCTIONNEMENT (CORRIGÉ)
-- =====================================================

-- Insérer un enregistrement de test avec JSONB correctement formaté
INSERT INTO kv_store_9fd39b98 (key, value) 
VALUES (
  'test:setup', 
  jsonb_build_object(
    'message', 'Database setup completed successfully',
    'timestamp', NOW()::text,
    'version', '1.0.0',
    'setup_complete', true
  )
)
ON CONFLICT (key) DO UPDATE SET 
  value = jsonb_build_object(
    'message', 'Database setup completed successfully',
    'timestamp', NOW()::text,
    'version', '1.0.0',
    'setup_complete', true,
    'last_updated', NOW()::text
  ),
  updated_at = NOW();

-- =====================================================
-- 11. DONNÉES DE TEST SUPPLÉMENTAIRES
-- =====================================================

-- Insérer quelques enregistrements de test pour vérifier le bon fonctionnement
INSERT INTO kv_store_9fd39b98 (key, value) VALUES
(
  'test:user:sample', 
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'email', 'test@example.com',
    'name', 'Test User',
    'role', 'test',
    'type', 'test',
    'created_at', NOW()::text
  )
),
(
  'test:mission:sample',
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'title', 'Test Mission',
    'status', 'draft',
    'departure', 'CDG',
    'arrival', 'LHR',
    'created_at', NOW()::text
  )
),
(
  'test:notification:sample',
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'info',
    'message', 'Test notification',
    'read', false,
    'created_at', NOW()::text
  )
)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 12. REQUÊTES UTILES POUR LA MAINTENANCE
-- =====================================================

-- Voir tous les types d'entités
-- SELECT * FROM kv_store_stats;

-- Voir tous les utilisateurs
-- SELECT * FROM users_view;

-- Voir toutes les missions
-- SELECT * FROM missions_view;

-- Obtenir les statistiques complètes
-- SELECT * FROM get_database_stats();

-- Nettoyer les données de test
-- SELECT clean_test_data();

-- Voir les 10 derniers enregistrements créés
-- SELECT key, value->>'name' as name, created_at 
-- FROM kv_store_9fd39b98 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- Chercher un utilisateur par email
-- SELECT * FROM kv_store_9fd39b98 
-- WHERE key LIKE 'user:%' 
-- AND value->>'email' = 'admin@crewtech.fr';

-- Voir l'utilisation de l'espace
-- SELECT 
--   pg_size_pretty(pg_total_relation_size('kv_store_9fd39b98')) as table_size,
--   pg_size_pretty(pg_relation_size('kv_store_9fd39b98')) as data_size,
--   pg_size_pretty(pg_total_relation_size('kv_store_9fd39b98') - pg_relation_size('kv_store_9fd39b98')) as index_size;

-- Vérifier que les données de test ont été insérées
-- SELECT 
--   key, 
--   value->>'message' as message,
--   value->>'timestamp' as timestamp
-- FROM kv_store_9fd39b98 
-- WHERE key LIKE 'test:%';

-- =====================================================
-- 13. VERIFICATION DES PERMISSIONS
-- =====================================================

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'kv_store_9fd39b98';

-- Vérifier les permissions sur la table
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'kv_store_9fd39b98';

-- =====================================================
-- FIN DU SCRIPT DE CONFIGURATION
-- =====================================================

-- Afficher un message de succès
SELECT 'CrewTech database setup completed successfully!' AS message;

-- Afficher les statistiques finales
SELECT * FROM get_database_stats();

-- Afficher les enregistrements de test créés
SELECT 
  'Test records created:' AS info,
  COUNT(*) AS count
FROM kv_store_9fd39b98 
WHERE key LIKE 'test:%';