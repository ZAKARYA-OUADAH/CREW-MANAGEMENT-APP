-- =====================================================
-- CREWTECH COMPLETE DATABASE SCHEMA FOR SUPABASE
-- =====================================================
-- Script SQL complet pour créer toutes les tables et dépendances
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- Version: 2.0 - Architecture relationnelle complète
-- Date: January 2025

-- =====================================================
-- 1. EXTENSIONS ET SETUP INITIAL
-- =====================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 2. TYPES ÉNUMÉRÉS
-- =====================================================

-- Statuts des utilisateurs
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'internal', 'freelancer');
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
    CREATE TYPE validation_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Statuts des missions
DO $$ BEGIN
    CREATE TYPE mission_status AS ENUM (
        'draft', 'pending_approval', 'pending_finance_review', 'waiting_owner_approval', 
        'pending_client_approval', 'approved', 'rejected', 'pending_validation', 
        'validated', 'pending_execution', 'in_progress', 'completed', 'cancelled', 
        'owner_rejected', 'client_rejected'
    );
    CREATE TYPE mission_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    CREATE TYPE flight_type AS ENUM ('charter', 'positioning', 'maintenance', 'training');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types d'avions et équipages
DO $$ BEGIN
    CREATE TYPE aircraft_status AS ENUM ('available', 'maintenance', 'unavailable', 'retired');
    CREATE TYPE crew_position AS ENUM ('Captain', 'First Officer', 'Flight Attendant', 'Senior Flight Attendant');
    CREATE TYPE crew_availability AS ENUM ('available', 'busy', 'unavailable', 'leave');
    CREATE TYPE qualification_type AS ENUM ('license', 'medical', 'type_rating', 'cabin_crew', 'safety', 'language');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types de notifications
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'mission_request', 'mission_assignment', 'mission_update', 'crew_validation', 
        'document_expiry', 'payment_processed', 'validation_status', 'system_alert'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 3. TABLE PRINCIPALE: USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'active',
    phone VARCHAR(50),
    position crew_position,
    
    -- Champs spécifiques au personnel interne
    employee_id VARCHAR(50) UNIQUE,
    hire_date DATE,
    salary_grade VARCHAR(10),
    department VARCHAR(100),
    
    -- Champs spécifiques aux freelancers
    nationality VARCHAR(100),
    birth_date DATE,
    contract_type VARCHAR(50),
    hourly_rate DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    validation_status validation_status DEFAULT 'pending',
    validation_date TIMESTAMP WITH TIME ZONE,
    preferred_bases TEXT[],
    experience_years INTEGER,
    
    -- Métadonnées
    profile_complete BOOLEAN DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT check_internal_fields CHECK (
        (role = 'internal' AND employee_id IS NOT NULL) OR 
        (role != 'internal')
    ),
    CONSTRAINT check_freelancer_fields CHECK (
        (role = 'freelancer' AND hourly_rate IS NOT NULL) OR 
        (role != 'freelancer')
    )
);

-- =====================================================
-- 4. TABLE: AIRCRAFT
-- =====================================================

CREATE TABLE IF NOT EXISTS aircraft (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    
    -- Capacités
    max_passengers INTEGER NOT NULL,
    pilots_required INTEGER DEFAULT 2,
    cabin_crew_required INTEGER DEFAULT 0,
    
    -- Performances
    range_nm INTEGER,
    cruise_speed INTEGER,
    service_ceiling INTEGER,
    
    -- Opérations
    base_airport VARCHAR(4),
    status aircraft_status DEFAULT 'available',
    hourly_cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Maintenance
    maintenance_until DATE,
    last_inspection DATE,
    next_inspection DATE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABLE: AIRPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS airports (
    icao VARCHAR(4) PRIMARY KEY,
    iata VARCHAR(3),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    
    -- Coordonnées
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    elevation_ft INTEGER,
    
    -- Opérations
    slots_required BOOLEAN DEFAULT false,
    handling_companies TEXT[],
    operating_hours JSONB,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. TABLE: QUALIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type qualification_type NOT NULL,
    
    -- Détails de la qualification
    code VARCHAR(50),
    aircraft_type VARCHAR(100),
    class VARCHAR(10),
    level VARCHAR(50),
    
    -- Validité
    issued_date DATE,
    expiry_date DATE,
    valid BOOLEAN DEFAULT true,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index
    UNIQUE(user_id, type, code, aircraft_type)
);

-- =====================================================
-- 7. TABLE: AIRCRAFT_QUALIFICATIONS (Relation Many-to-Many)
-- =====================================================

CREATE TABLE IF NOT EXISTS aircraft_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
    
    -- Validité
    qualified_since DATE NOT NULL,
    expires_on DATE,
    status validation_status DEFAULT 'approved',
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    UNIQUE(user_id, aircraft_id)
);

-- =====================================================
-- 8. TABLE: MISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    
    -- Client
    client_name VARCHAR(255) NOT NULL,
    client_contact_name VARCHAR(255),
    client_contact_email VARCHAR(255),
    client_contact_phone VARCHAR(50),
    
    -- Statut et priorité
    status mission_status DEFAULT 'draft',
    priority mission_priority DEFAULT 'medium',
    flight_type flight_type DEFAULT 'charter',
    
    -- Vol aller
    departure_airport VARCHAR(4) NOT NULL REFERENCES airports(icao),
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    departure_timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    
    arrival_airport VARCHAR(4) NOT NULL REFERENCES airports(icao),
    arrival_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    arrival_timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    
    -- Vol retour (optionnel)
    return_departure_airport VARCHAR(4) REFERENCES airports(icao),
    return_departure_date DATE,
    return_departure_time TIME,
    return_departure_timezone VARCHAR(50),
    
    return_arrival_airport VARCHAR(4) REFERENCES airports(icao),
    return_arrival_date DATE,
    return_arrival_time TIME,
    return_arrival_timezone VARCHAR(50),
    
    -- Avion et équipage
    aircraft_id UUID REFERENCES aircraft(id),
    captain_id UUID REFERENCES users(id),
    first_officer_id UUID REFERENCES users(id),
    senior_cabin_crew_id UUID REFERENCES users(id),
    
    -- Passagers et exigences
    passengers_count INTEGER DEFAULT 0,
    special_requirements TEXT[],
    catering_requirements TEXT,
    notes TEXT,
    
    -- Coûts
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Facturation
    invoice_generated BOOLEAN DEFAULT false,
    invoice_number VARCHAR(50),
    payment_status VARCHAR(20),
    
    -- Traçabilité
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    validated_by UUID REFERENCES users(id),
    completed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    validated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT check_departure_before_arrival CHECK (
        (departure_date < arrival_date) OR 
        (departure_date = arrival_date AND departure_time < arrival_time)
    ),
    CONSTRAINT check_return_flight_dates CHECK (
        return_departure_date IS NULL OR 
        return_departure_date >= arrival_date
    )
);

-- =====================================================
-- 9. TABLE: MISSION_CREW (Équipages supplémentaires)
-- =====================================================

CREATE TABLE IF NOT EXISTS mission_crew (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position crew_position NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    
    -- Validation
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status validation_status DEFAULT 'pending',
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    UNIQUE(mission_id, user_id, position)
);

-- =====================================================
-- 10. TABLE: MISSION_HISTORY (Audit trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS mission_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    
    -- Changements
    previous_status mission_status,
    new_status mission_status NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Acteur
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Données supplémentaires
    metadata JSONB
);

-- =====================================================
-- 11. TABLE: NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contenu
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- État
    read_at TIMESTAMP WITH TIME ZONE,
    action_required BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    
    -- Données liées
    related_mission_id UUID REFERENCES missions(id),
    related_user_id UUID REFERENCES users(id),
    metadata JSONB,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 12. TABLE: DOCUMENTS (Gestion des documents)
-- =====================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Type et détails
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Validation
    status validation_status DEFAULT 'pending',
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 13. TABLE: COMPANY_SETTINGS (Configuration)
-- =====================================================

CREATE TABLE IF NOT EXISTS company_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 14. TABLE: KV_STORE (Compatibilité avec système existant)
-- =====================================================

CREATE TABLE IF NOT EXISTS kv_store_9fd39b98 (
    key TEXT NOT NULL PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 15. INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour les utilisateurs
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_position ON users(position);
CREATE INDEX IF NOT EXISTS idx_users_validation_status ON users(validation_status);

-- Index pour les missions
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_priority ON missions(priority);
CREATE INDEX IF NOT EXISTS idx_missions_departure_date ON missions(departure_date);
CREATE INDEX IF NOT EXISTS idx_missions_aircraft_id ON missions(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_missions_captain_id ON missions(captain_id);
CREATE INDEX IF NOT EXISTS idx_missions_created_by ON missions(created_by);

-- Index pour les qualifications
CREATE INDEX IF NOT EXISTS idx_qualifications_user_id ON qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_qualifications_type ON qualifications(type);
CREATE INDEX IF NOT EXISTS idx_qualifications_expiry ON qualifications(expiry_date);

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Index pour la recherche textuelle
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_missions_title_trgm ON missions USING gin (title gin_trgm_ops);

-- Index pour KV Store (compatibilité)
CREATE INDEX IF NOT EXISTS idx_kv_store_9fd39b98_key_prefix ON kv_store_9fd39b98 USING btree (key text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_kv_store_9fd39b98_value_gin ON kv_store_9fd39b98 USING gin (value);

-- =====================================================
-- 16. FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aircraft_updated_at ON aircraft;
CREATE TRIGGER update_aircraft_updated_at BEFORE UPDATE ON aircraft FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_missions_updated_at ON missions;
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_qualifications_updated_at ON qualifications;
CREATE TRIGGER update_qualifications_updated_at BEFORE UPDATE ON qualifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kv_store_9fd39b98_updated_at ON kv_store_9fd39b98;
CREATE TRIGGER update_kv_store_9fd39b98_updated_at BEFORE UPDATE ON kv_store_9fd39b98 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour audit trail des missions
CREATE OR REPLACE FUNCTION log_mission_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO mission_history (mission_id, previous_status, new_status, action, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, 'status_change', NEW.updated_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Ajout d'une colonne updated_by pour les missions
ALTER TABLE missions ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Trigger pour audit trail
DROP TRIGGER IF EXISTS log_mission_status_changes ON missions;
CREATE TRIGGER log_mission_status_changes 
    AFTER UPDATE ON missions 
    FOR EACH ROW 
    EXECUTE FUNCTION log_mission_changes();

-- =====================================================
-- 17. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour obtenir les statistiques de la base
CREATE OR REPLACE FUNCTION get_database_statistics()
RETURNS TABLE(
    total_users BIGINT,
    active_users BIGINT,
    total_missions BIGINT,
    pending_missions BIGINT,
    total_aircraft BIGINT,
    available_aircraft BIGINT,
    total_notifications BIGINT,
    unread_notifications BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE status = 'active') AS active_users,
        (SELECT COUNT(*) FROM missions) AS total_missions,
        (SELECT COUNT(*) FROM missions WHERE status IN ('pending_approval', 'pending_validation')) AS pending_missions,
        (SELECT COUNT(*) FROM aircraft) AS total_aircraft,
        (SELECT COUNT(*) FROM aircraft WHERE status = 'available') AS available_aircraft,
        (SELECT COUNT(*) FROM notifications) AS total_notifications,
        (SELECT COUNT(*) FROM notifications WHERE read_at IS NULL) AS unread_notifications;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les qualifications expirantes
CREATE OR REPLACE FUNCTION get_expiring_qualifications(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
    user_name TEXT,
    user_email TEXT,
    qualification_type qualification_type,
    qualification_code TEXT,
    expiry_date DATE,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.name,
        u.email,
        q.type,
        q.code,
        q.expiry_date,
        (q.expiry_date - CURRENT_DATE)::INTEGER
    FROM qualifications q
    JOIN users u ON q.user_id = u.id
    WHERE q.expiry_date IS NOT NULL 
    AND q.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    AND q.valid = true
    ORDER BY q.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    AND read_at IS NOT NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 18. CONFIGURATION RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_store_9fd39b98 ENABLE ROW LEVEL SECURITY;

-- Politiques pour développement (permissives)
-- En production, créez des politiques plus restrictives

-- Users: Admin peut tout voir, utilisateurs voient leur profil et collègues actifs
DROP POLICY IF EXISTS "users_policy" ON users;
CREATE POLICY "users_policy" ON users FOR ALL USING (true) WITH CHECK (true);

-- Missions: Tous les utilisateurs authentifiés peuvent voir les missions
DROP POLICY IF EXISTS "missions_policy" ON missions;
CREATE POLICY "missions_policy" ON missions FOR ALL USING (true) WITH CHECK (true);

-- Notifications: Utilisateurs voient seulement leurs notifications
DROP POLICY IF EXISTS "notifications_policy" ON notifications;
CREATE POLICY "notifications_policy" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Autres tables: Accès complet pour développement
DROP POLICY IF EXISTS "aircraft_policy" ON aircraft;
CREATE POLICY "aircraft_policy" ON aircraft FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "qualifications_policy" ON qualifications;
CREATE POLICY "qualifications_policy" ON qualifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "documents_policy" ON documents;
CREATE POLICY "documents_policy" ON documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kv_store_policy" ON kv_store_9fd39b98;
CREATE POLICY "kv_store_policy" ON kv_store_9fd39b98 FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 19. PERMISSIONS
-- =====================================================

-- Permissions pour service_role et anon
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- =====================================================
-- 20. DONNÉES DE BASE (CONFIGURATION)
-- =====================================================

-- Aéroports principaux
INSERT INTO airports (icao, iata, name, city, country, timezone, latitude, longitude, elevation_ft, slots_required) VALUES
('LFPG', 'CDG', 'Paris Charles de Gaulle', 'Paris', 'France', 'Europe/Paris', 49.0097, 2.5479, 392, true),
('LFPB', 'LBG', 'Paris Le Bourget', 'Paris', 'France', 'Europe/Paris', 48.9694, 2.4414, 218, false),
('LFPO', 'ORY', 'Paris Orly', 'Paris', 'France', 'Europe/Paris', 48.7233, 2.3794, 291, true),
('LFMN', 'NCE', 'Nice Côte d''Azur', 'Nice', 'France', 'Europe/Paris', 43.6584, 7.2158, 12, true),
('LFLL', 'LYS', 'Lyon Saint-Exupéry', 'Lyon', 'France', 'Europe/Paris', 45.7256, 5.0811, 821, false),
('EGKB', 'BQH', 'London Biggin Hill', 'London', 'United Kingdom', 'Europe/London', 51.3307, 0.0325, 598, false),
('EGGW', 'LTN', 'London Luton', 'London', 'United Kingdom', 'Europe/London', 51.8747, -0.3683, 526, true),
('LSGG', 'GVA', 'Geneva Cointrin', 'Geneva', 'Switzerland', 'Europe/Zurich', 46.2381, 6.1090, 1411, true)
ON CONFLICT (icao) DO NOTHING;

-- Configuration de base
INSERT INTO company_settings (key, value, description, category) VALUES
('aircraft_hourly_rates', '{"Citation_CJ3": 2800, "King_Air_350": 2200, "Phenom_300": 2500}', 'Tarifs horaires des avions', 'pricing'),
('crew_base_rates', '{"captain": 150, "first_officer": 120, "cabin_crew": 80}', 'Tarifs de base équipages', 'pricing'),
('operating_hours', '{"start": "06:00", "end": "22:00", "timezone": "Europe/Paris"}', 'Heures d''opération', 'operations'),
('company_info', '{"name": "CrewTech Aviation", "address": "Paris, France", "phone": "+33 1 23 45 67 89"}', 'Informations société', 'general')
ON CONFLICT (key) DO NOTHING;

-- Avions de base
INSERT INTO aircraft (registration, type, manufacturer, model, category, max_passengers, pilots_required, cabin_crew_required, range_nm, cruise_speed, service_ceiling, base_airport, hourly_cost) VALUES
('F-HCTA', 'Citation CJ3+', 'Cessna', 'Citation CJ3+', 'Business Jet', 8, 2, 1, 2040, 416, 45000, 'LFPB', 2800.00),
('F-HCTB', 'King Air 350', 'Beechcraft', 'King Air 350', 'Turboprop', 9, 2, 1, 1806, 312, 35000, 'LFPG', 2200.00),
('F-HCTC', 'Phenom 300', 'Embraer', 'Phenom 300', 'Light Jet', 7, 2, 0, 1971, 453, 45000, 'LFPB', 2500.00)
ON CONFLICT (registration) DO NOTHING;

-- =====================================================
-- 21. VUES UTILES
-- =====================================================

-- Vue des utilisateurs actifs avec leurs qualifications
CREATE OR REPLACE VIEW active_crew_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.position,
    u.status,
    u.phone,
    COALESCE(
        array_agg(
            DISTINCT aq.aircraft_id
        ) FILTER (WHERE aq.status = 'approved'),
        ARRAY[]::UUID[]
    ) as qualified_aircraft_ids,
    COALESCE(
        array_agg(
            DISTINCT a.registration
        ) FILTER (WHERE aq.status = 'approved'),
        ARRAY[]::TEXT[]
    ) as qualified_aircraft_registrations
FROM users u
LEFT JOIN aircraft_qualifications aq ON u.id = aq.user_id
LEFT JOIN aircraft a ON aq.aircraft_id = a.id
WHERE u.status = 'active' AND u.role IN ('internal', 'freelancer')
GROUP BY u.id, u.name, u.email, u.role, u.position, u.status, u.phone;

-- Vue des missions avec détails équipages
CREATE OR REPLACE VIEW missions_with_crew_view AS
SELECT 
    m.*,
    cap.name as captain_name,
    fo.name as first_officer_name,
    sfc.name as senior_cabin_crew_name,
    a.registration as aircraft_registration,
    a.type as aircraft_type,
    dep.name as departure_airport_name,
    arr.name as arrival_airport_name
FROM missions m
LEFT JOIN users cap ON m.captain_id = cap.id
LEFT JOIN users fo ON m.first_officer_id = fo.id
LEFT JOIN users sfc ON m.senior_cabin_crew_id = sfc.id
LEFT JOIN aircraft a ON m.aircraft_id = a.id
LEFT JOIN airports dep ON m.departure_airport = dep.icao
LEFT JOIN airports arr ON m.arrival_airport = arr.icao;

-- Vue des qualifications expirantes dans les 30 jours
CREATE OR REPLACE VIEW expiring_qualifications_view AS
SELECT 
    u.name as user_name,
    u.email as user_email,
    u.role as user_role,
    q.type as qualification_type,
    q.code as qualification_code,
    q.aircraft_type,
    q.expiry_date,
    (q.expiry_date - CURRENT_DATE) as days_until_expiry
FROM qualifications q
JOIN users u ON q.user_id = u.id
WHERE q.expiry_date IS NOT NULL 
AND q.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
AND q.valid = true
AND u.status = 'active'
ORDER BY q.expiry_date ASC;

-- =====================================================
-- 22. TEST ET VALIDATION
-- =====================================================

-- Insertion d'un enregistrement de test
INSERT INTO kv_store_9fd39b98 (key, value) VALUES (
    'test:database_setup_v2',
    jsonb_build_object(
        'version', '2.0',
        'setup_completed', true,
        'tables_created', array[
            'users', 'aircraft', 'airports', 'qualifications', 
            'aircraft_qualifications', 'missions', 'mission_crew',
            'mission_history', 'notifications', 'documents', 
            'company_settings', 'kv_store_9fd39b98'
        ],
        'timestamp', NOW()::text,
        'features', array[
            'relational_schema', 'rls_enabled', 'audit_trail',
            'notifications_system', 'qualifications_management',
            'mission_workflow', 'user_management'
        ]
    )
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- =====================================================
-- 23. FONCTIONS DE MIGRATION (KV vers Relationnel)
-- =====================================================

-- Fonction pour migrer les utilisateurs du KV vers la table users
CREATE OR REPLACE FUNCTION migrate_users_from_kv()
RETURNS INTEGER AS $$
DECLARE
    kv_record RECORD;
    user_data JSONB;
    inserted_count INTEGER := 0;
BEGIN
    FOR kv_record IN 
        SELECT key, value FROM kv_store_9fd39b98 WHERE key LIKE 'user:%'
    LOOP
        user_data := kv_record.value;
        
        INSERT INTO users (
            id, email, name, role, phone, position, employee_id, 
            hire_date, nationality, birth_date, hourly_rate, 
            validation_status, profile_complete, created_at
        ) VALUES (
            COALESCE((user_data->>'id')::UUID, uuid_generate_v4()),
            user_data->>'email',
            user_data->>'name',
            (user_data->>'role')::user_role,
            user_data->>'phone',
            CASE 
                WHEN user_data->>'position' IN ('Captain', 'First Officer', 'Flight Attendant', 'Senior Flight Attendant') 
                THEN (user_data->>'position')::crew_position 
                ELSE NULL 
            END,
            user_data->>'employee_id',
            CASE 
                WHEN user_data->>'hire_date' IS NOT NULL 
                THEN (user_data->>'hire_date')::DATE 
                ELSE NULL 
            END,
            user_data->>'nationality',
            CASE 
                WHEN user_data->>'birth_date' IS NOT NULL 
                THEN (user_data->>'birth_date')::DATE 
                ELSE NULL 
            END,
            CASE 
                WHEN user_data->>'hourly_rate' IS NOT NULL 
                THEN (user_data->>'hourly_rate')::DECIMAL 
                ELSE NULL 
            END,
            COALESCE((user_data->>'validation_status')::validation_status, 'approved'),
            COALESCE((user_data->>'profile_complete')::BOOLEAN, true),
            COALESCE((user_data->>'created_at')::TIMESTAMP WITH TIME ZONE, NOW())
        ) ON CONFLICT (email) DO NOTHING;
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 24. VERIFICATION FINALE
-- =====================================================

-- Vérifier que toutes les tables sont créées
SELECT 
    'Table created: ' || table_name as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'aircraft', 'airports', 'qualifications', 
    'aircraft_qualifications', 'missions', 'mission_crew',
    'mission_history', 'notifications', 'documents', 
    'company_settings', 'kv_store_9fd39b98'
)
ORDER BY table_name;

-- Afficher les statistiques
SELECT * FROM get_database_statistics();

-- Message de succès
SELECT 
    'CrewTech Database Schema v2.0 Setup Completed Successfully!' as message,
    NOW() as completed_at;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================