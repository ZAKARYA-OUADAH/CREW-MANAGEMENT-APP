-- =====================================================
-- CREWTECH DATABASE POPULATION SCRIPT (CORRECTED)
-- =====================================================
-- Ce script peuple la base de données avec des données réalistes
-- pour toutes les fonctionnalités de CrewTech
-- Exécutez ce script APRÈS avoir créé la structure de base

-- =====================================================
-- 1. NETTOYAGE DES DONNÉES EXISTANTES (OPTIONNEL)
-- =====================================================

-- Décommentez les lignes suivantes si vous voulez nettoyer les données existantes
-- DELETE FROM kv_store_9fd39b98 WHERE key LIKE 'user:%';
-- DELETE FROM kv_store_9fd39b98 WHERE key LIKE 'mission:%';
-- DELETE FROM kv_store_9fd39b98 WHERE key LIKE 'notification:%';
-- DELETE FROM kv_store_9fd39b98 WHERE key LIKE 'aircraft:%';
-- DELETE FROM kv_store_9fd39b98 WHERE key LIKE 'airport:%';

-- =====================================================
-- 2. CRÉATION DES UTILISATEURS
-- =====================================================

-- Administrateur principal
INSERT INTO kv_store_9fd39b98 (key, value) VALUES (
  'user:admin-001',
  jsonb_build_object(
    'id', 'admin-001',
    'email', 'admin@crewtech.fr',
    'name', 'Sophie Laurent',
    'role', 'admin',
    'type', 'admin',
    'phone', '+33 1 45 67 89 12',
    'position', 'Operations Manager',
    'department', 'Operations',
    'created_at', NOW()::text,
    'profile_complete', true,
    'last_active', NOW()::text,
    'permissions', jsonb_build_array(
      'manage_users', 'manage_missions', 'manage_crew', 
      'view_finance', 'export_data', 'system_admin'
    )
  )
);

-- Personnel interne - Capitaines
INSERT INTO kv_store_9fd39b98 (key, value) VALUES 
(
  'user:internal-001',
  jsonb_build_object(
    'id', 'internal-001',
    'email', 'internal@crewtech.fr',
    'name', 'Pierre Dubois',
    'role', 'internal',
    'type', 'internal',
    'phone', '+33 1 45 67 89 13',
    'position', 'Captain',
    'employee_id', 'EMP-001',
    'hire_date', '2020-03-15',
    'salary_grade', 'A3',
    'created_at', NOW()::text,
    'profile_complete', true,
    'qualifications', jsonb_build_array(
      jsonb_build_object('type', 'license', 'code', 'ATPL', 'expiry', '2025-12-31'),
      jsonb_build_object('type', 'medical', 'class', '1', 'expiry', '2024-06-30'),
      jsonb_build_object('type', 'type_rating', 'aircraft', 'Citation_CJ3', 'expiry', '2024-12-15'),
      jsonb_build_object('type', 'type_rating', 'aircraft', 'King_Air_350', 'expiry', '2025-01-20')
    ),
    'aircraft_qualifications', jsonb_build_array('F-HCTA', 'F-HCTB'),
    'availability', 'available',
    'last_medical', '2023-12-15',
    'flight_hours', jsonb_build_object(
      'total', 8500,
      'pic', 6200,
      'last_90_days', 120,
      'last_year', 850
    )
  )
),
(
  'user:internal-002',
  jsonb_build_object(
    'id', 'internal-002',
    'email', 'marie.martin@crewtech.fr',
    'name', 'Marie Martin',
    'role', 'internal',
    'type', 'internal',
    'phone', '+33 1 45 67 89 14',
    'position', 'First Officer',
    'employee_id', 'EMP-002',
    'hire_date', '2021-09-01',
    'salary_grade', 'B2',
    'created_at', NOW()::text,
    'profile_complete', true,
    'qualifications', jsonb_build_array(
      jsonb_build_object('type', 'license', 'code', 'CPL', 'expiry', '2025-08-31'),
      jsonb_build_object('type', 'medical', 'class', '1', 'expiry', '2024-05-15'),
      jsonb_build_object('type', 'type_rating', 'aircraft', 'Citation_CJ3', 'expiry', '2024-09-30'),
      jsonb_build_object('type', 'type_rating', 'aircraft', 'Phenom_300', 'expiry', '2024-10-31')
    ),
    'aircraft_qualifications', jsonb_build_array('F-HCTA', 'F-HCTC'),
    'availability', 'available',
    'last_medical', '2023-11-15',
    'flight_hours', jsonb_build_object(
      'total', 3200,
      'pic', 800,
      'last_90_days', 95,
      'last_year', 650
    )
  )
);

-- Personnel de cabine interne
INSERT INTO kv_store_9fd39b98 (key, value) VALUES (
  'user:internal-003',
  jsonb_build_object(
    'id', 'internal-003',
    'email', 'claire.bernard@crewtech.fr',
    'name', 'Claire Bernard',
    'role', 'internal',
    'type', 'internal',
    'phone', '+33 1 45 67 89 15',
    'position', 'Senior Flight Attendant',
    'employee_id', 'EMP-003',
    'hire_date', '2019-01-15',
    'salary_grade', 'C2',
    'created_at', NOW()::text,
    'profile_complete', true,
    'qualifications', jsonb_build_array(
      jsonb_build_object('type', 'cabin_crew', 'code', 'CCA', 'expiry', '2024-12-31'),
      jsonb_build_object('type', 'safety', 'code', 'SEP', 'expiry', '2024-08-15'),
      jsonb_build_object('type', 'medical', 'class', '2', 'expiry', '2024-07-30'),
      jsonb_build_object('type', 'language', 'code', 'EN-FR', 'level', 'fluent')
    ),
    'aircraft_qualifications', jsonb_build_array('F-HCTA', 'F-HCTB', 'F-HCTC'),
    'availability', 'available',
    'languages', jsonb_build_array('French', 'English', 'Spanish'),
    'specializations', jsonb_build_array('VIP Service', 'Safety Training', 'First Aid')
  )
);

-- Freelancers - Pilotes
INSERT INTO kv_store_9fd39b98 (key, value) VALUES 
(
  'user:freelancer-001',
  jsonb_build_object(
    'id', 'freelancer-001',
    'email', 'freelancer@aviation.com',
    'name', 'Lisa Anderson',
    'role', 'freelancer',
    'type', 'freelancer',
    'phone', '+33 6 12 34 56 78',
    'position', 'Flight Attendant',
    'nationality', 'French',
    'birth_date', '1985-04-12',
    'created_at', NOW()::text,
    'profile_complete', true,
    'validation_status', 'approved',
    'validation_date', '2023-12-01',
    'contract_type', 'freelance',
    'hourly_rate', 45,
    'currency', 'EUR',
    'qualifications', jsonb_build_array(
      jsonb_build_object('type', 'cabin_crew', 'code', 'CCA', 'expiry', '2025-03-31'),
      jsonb_build_object('type', 'safety', 'code', 'SEP', 'expiry', '2024-09-15'),
      jsonb_build_object('type', 'medical', 'class', '2', 'expiry', '2024-08-30')
    ),
    'aircraft_qualifications', jsonb_build_array('F-HCTA', 'F-HCTB'),
    'availability', 'available',
    'preferred_bases', jsonb_build_array('CDG', 'ORY', 'LBG'),
    'languages', jsonb_build_array('French', 'English'),
    'experience_years', 8,
    'specializations', jsonb_build_array('Corporate Aviation', 'VIP Service')
  )
),
(
  'user:freelancer-002',
  jsonb_build_object(
    'id', 'freelancer-002',
    'email', 'captain@freelance.eu',
    'name', 'Marco Rossi',
    'role', 'freelancer',
    'type', 'freelancer',
    'phone', '+33 6 23 45 67 89',
    'position', 'Captain',
    'nationality', 'Italian',
    'birth_date', '1978-11-25',
    'created_at', NOW()::text,
    'profile_complete', true,
    'validation_status', 'approved',
    'validation_date', '2023-10-15',
    'contract_type', 'freelance',
    'hourly_rate', 120,
    'currency', 'EUR',
    'qualifications', jsonb_build_array(
      jsonb_build_object('type', 'license', 'code', 'ATPL', 'expiry', '2026-05-31'),
      jsonb_build_object('type', 'medical', 'class', '1', 'expiry', '2024-11-30'),
      jsonb_build_object('type', 'type_rating', 'aircraft', 'Citation_CJ3', 'expiry', '2024-12-15'),
      jsonb_build_object('type', 'type_rating', 'aircraft', 'King_Air_350', 'expiry', '2025-01-20')
    ),
    'aircraft_qualifications', jsonb_build_array('F-HCTA', 'F-HCTB'),
    'availability', 'available',
    'preferred_bases', jsonb_build_array('CDG', 'NCE', 'LYS'),
    'languages', jsonb_build_array('Italian', 'English', 'French'),
    'flight_hours', jsonb_build_object(
      'total', 12500,
      'pic', 9800,
      'last_90_days', 85,
      'last_year', 720
    ),
    'experience_years', 15
  )
),
(
  'user:freelancer-003',
  jsonb_build_object(
    'id', 'freelancer-003',
    'email', 'sarah@crewaviation.com',
    'name', 'Sarah Mitchell',
    'role', 'freelancer',
    'type', 'freelancer',
    'phone', '+33 6 34 56 78 90',
    'position', 'First Officer',
    'nationality', 'British',
    'birth_date', '1992-07-08',
    'created_at', NOW()::text,
    'profile_complete', true,
    'validation_status', 'approved',
    'validation_date', '2023-11-20',
    'contract_type', 'freelance',
    'hourly_rate', 80,
    'currency', 'EUR',
    'qualifications', jsonb_build_array(
      jsonb_build_object('type', 'license', 'code', 'CPL', 'expiry', '2025-09-30'),
      jsonb_build_object('type', 'medical', 'class', '1', 'expiry', '2024-06-15'),
      jsonb_build_object('type', 'type_rating', 'aircraft', 'Phenom_300', 'expiry', '2024-10-31')
    ),
    'aircraft_qualifications', jsonb_build_array('F-HCTC'),
    'availability', 'available',
    'preferred_bases', jsonb_build_array('LBG', 'CDG'),
    'languages', jsonb_build_array('English', 'French'),
    'flight_hours', jsonb_build_object(
      'total', 2800,
      'pic', 450,
      'last_90_days', 72,
      'last_year', 580
    ),
    'experience_years', 6
  )
);

-- Freelancers en attente de validation
INSERT INTO kv_store_9fd39b98 (key, value) VALUES 
(
  'user:freelancer-004',
  jsonb_build_object(
    'id', 'freelancer-004',
    'email', 'thomas.dupont@aviation.fr',
    'name', 'Thomas Dupont',
    'role', 'freelancer',
    'type', 'freelancer',
    'phone', '+33 6 45 67 89 01',
    'position', 'Flight Attendant',
    'nationality', 'French',
    'birth_date', '1990-02-14',
    'created_at', NOW()::text,
    'profile_complete', true,
    'validation_status', 'pending',
    'submitted_date', '2024-01-15',
    'contract_type', 'freelance',
    'hourly_rate', 42,
    'currency', 'EUR',
    'qualifications', jsonb_build_array(
      jsonb_build_object('type', 'cabin_crew', 'code', 'CCA', 'expiry', '2025-06-30'),
      jsonb_build_object('type', 'safety', 'code', 'SEP', 'expiry', '2024-12-15'),
      jsonb_build_object('type', 'medical', 'class', '2', 'expiry', '2024-10-30')
    ),
    'aircraft_qualifications', jsonb_build_array('F-HCTA'),
    'availability', 'available',
    'preferred_bases', jsonb_build_array('CDG', 'ORY'),
    'languages', jsonb_build_array('French', 'English'),
    'experience_years', 4,
    'documents_uploaded', jsonb_build_array(
      jsonb_build_object('type', 'license', 'status', 'uploaded', 'date', '2024-01-15'),
      jsonb_build_object('type', 'medical', 'status', 'uploaded', 'date', '2024-01-15'),
      jsonb_build_object('type', 'cv', 'status', 'uploaded', 'date', '2024-01-15')
    )
  )
);

-- =====================================================
-- 3. DONNÉES DES AÉRONEFS
-- =====================================================

INSERT INTO kv_store_9fd39b98 (key, value) VALUES 
(
  'aircraft:001',
  jsonb_build_object(
    'id', 'aircraft-001',
    'registration', 'F-HCTA',
    'type', 'Citation CJ3+',
    'manufacturer', 'Cessna',
    'model', 'Citation CJ3+',
    'category', 'Business Jet',
    'max_passengers', 8,
    'crew_required', jsonb_build_object(
      'pilots', 2,
      'cabin_crew', 1
    ),
    'range_nm', 2040,
    'cruise_speed', 416,
    'service_ceiling', 45000,
    'base_airport', 'LFPB',
    'status', 'available',
    'hourly_cost', 2800,
    'currency', 'EUR',
    'created_at', NOW()::text
  )
),
(
  'aircraft:002',
  jsonb_build_object(
    'id', 'aircraft-002',
    'registration', 'F-HCTB',
    'type', 'King Air 350',
    'manufacturer', 'Beechcraft',
    'model', 'King Air 350',
    'category', 'Turboprop',
    'max_passengers', 9,
    'crew_required', jsonb_build_object(
      'pilots', 2,
      'cabin_crew', 1
    ),
    'range_nm', 1806,
    'cruise_speed', 312,
    'service_ceiling', 35000,
    'base_airport', 'LFPG',
    'status', 'available',
    'hourly_cost', 2200,
    'currency', 'EUR',
    'created_at', NOW()::text
  )
),
(
  'aircraft:003',
  jsonb_build_object(
    'id', 'aircraft-003',
    'registration', 'F-HCTC',
    'type', 'Phenom 300',
    'manufacturer', 'Embraer',
    'model', 'Phenom 300',
    'category', 'Light Jet',
    'max_passengers', 7,
    'crew_required', jsonb_build_object(
      'pilots', 2,
      'cabin_crew', 0
    ),
    'range_nm', 1971,
    'cruise_speed', 453,
    'service_ceiling', 45000,
    'base_airport', 'LFPB',
    'status', 'maintenance',
    'hourly_cost', 2500,
    'currency', 'EUR',
    'created_at', NOW()::text,
    'maintenance_until', '2024-02-15'
  )
);

-- =====================================================
-- 4. DONNÉES DES AÉROPORTS
-- =====================================================

INSERT INTO kv_store_9fd39b98 (key, value) VALUES 
(
  'airport:LFPG',
  jsonb_build_object(
    'icao', 'LFPG',
    'iata', 'CDG',
    'name', 'Paris Charles de Gaulle',
    'city', 'Paris',
    'country', 'France',
    'timezone', 'Europe/Paris',
    'coordinates', jsonb_build_object(
      'latitude', 49.0097,
      'longitude', 2.5479
    ),
    'elevation_ft', 392,
    'slots_required', true,
    'handling_companies', jsonb_build_array('Swissport', 'ACSA', 'Signature Flight Support')
  )
),
(
  'airport:LFPB',
  jsonb_build_object(
    'icao', 'LFPB',
    'iata', 'LBG',
    'name', 'Paris Le Bourget',
    'city', 'Paris',
    'country', 'France',
    'timezone', 'Europe/Paris',
    'coordinates', jsonb_build_object(
      'latitude', 48.9694,
      'longitude', 2.4414
    ),
    'elevation_ft', 218,
    'slots_required', false,
    'handling_companies', jsonb_build_array('Signature Flight Support', 'Universal Aviation')
  )
),
(
  'airport:EGKB',
  jsonb_build_object(
    'icao', 'EGKB',
    'iata', 'BQH',
    'name', 'London Biggin Hill',
    'city', 'London',
    'country', 'United Kingdom',
    'timezone', 'Europe/London',
    'coordinates', jsonb_build_object(
      'latitude', 51.3307,
      'longitude', 0.0325
    ),
    'elevation_ft', 598,
    'slots_required', false,
    'handling_companies', jsonb_build_array('Signature Flight Support', 'Rizon Jet')
  )
),
(
  'airport:LFMN',
  jsonb_build_object(
    'icao', 'LFMN',
    'iata', 'NCE',
    'name', 'Nice Côte d\'Azur',
    'city', 'Nice',
    'country', 'France',
    'timezone', 'Europe/Paris',
    'coordinates', jsonb_build_object(
      'latitude', 43.6584,
      'longitude', 7.2158
    ),
    'elevation_ft', 12,
    'slots_required', true,
    'handling_companies', jsonb_build_array('Swissport', 'Universal Aviation')
  )
);

-- =====================================================
-- 5. MISSIONS (CORRIGÉ AVEC IDS COHÉRENTS)
-- =====================================================

-- Mission approuvée et complétée
INSERT INTO kv_store_9fd39b98 (key, value) VALUES (
  'mission:MO-1705845123456',
  jsonb_build_object(
    'id', 'MO-1705845123456',
    'title', 'Transport VIP Paris-Londres',
    'client_name', 'Entreprise Martin SA',
    'client_contact', jsonb_build_object(
      'name', 'Jean Martin',
      'email', 'j.martin@entreprisemartin.fr',
      'phone', '+33 1 42 86 75 32'
    ),
    'status', 'completed',
    'priority', 'high',
    'flight_type', 'charter',
    'departure', jsonb_build_object(
      'airport', 'LFPB',
      'date', '2024-01-20',
      'time', '14:00',
      'timezone', 'Europe/Paris'
    ),
    'arrival', jsonb_build_object(
      'airport', 'EGKB',
      'date', '2024-01-20',
      'time', '15:30',
      'timezone', 'Europe/London'
    ),
    'return_flight', jsonb_build_object(
      'departure', jsonb_build_object(
        'airport', 'EGKB',
        'date', '2024-01-22',
        'time', '16:00',
        'timezone', 'Europe/London'
      ),
      'arrival', jsonb_build_object(
        'airport', 'LFPB',
        'date', '2024-01-22',
        'time', '18:30',
        'timezone', 'Europe/Paris'
      )
    ),
    'aircraft', jsonb_build_object(
      'id', 'aircraft-001',
      'registration', 'F-HCTA',
      'type', 'Citation CJ3+'
    ),
    'passengers', 6,
    'crew', jsonb_build_object(
      'id', 'freelancer-002',
      'captain', jsonb_build_object(
        'id', 'freelancer-002',
        'name', 'Marco Rossi',
        'type', 'freelancer'
      ),
      'first_officer', jsonb_build_object(
        'id', 'freelancer-003',
        'name', 'Sarah Mitchell',
        'type', 'freelancer'
      ),
      'cabin_crew', jsonb_build_array(
        jsonb_build_object(
          'id', 'freelancer-001',
          'name', 'Lisa Anderson',
          'type', 'freelancer'
        )
      )
    ),
    'special_requirements', jsonb_build_array(
      'Catering VIP',
      'Douane privée',
      'Transport ground'
    ),
    'estimated_cost', 12500,
    'actual_cost', 12350,
    'currency', 'EUR',
    'createdAt', '2024-01-15T10:30:00Z',
    'createdBy', 'admin-001',
    'approvedAt', '2024-01-16T09:15:00Z',
    'approvedBy', 'admin-001',
    'completedAt', '2024-01-22T20:00:00Z',
    'invoice_generated', true,
    'invoice_number', 'INV-2024-001',
    'payment_status', 'paid'
  )
);

-- Mission en cours
INSERT INTO kv_store_9fd39b98 (key, value) VALUES (
  'mission:MO-1705845234567',
  jsonb_build_object(
    'id', 'MO-1705845234567',
    'title', 'Vol d\'affaires Paris-Nice',
    'client_name', 'TechCorp International',
    'client_contact', jsonb_build_object(
      'name', 'Marie Dubois',
      'email', 'm.dubois@techcorp.com',
      'phone', '+33 1 56 78 90 12'
    ),
    'status', 'in_progress',
    'priority', 'medium',
    'flight_type', 'charter',
    'departure', jsonb_build_object(
      'airport', 'LFPG',
      'date', (NOW() + INTERVAL '2 days')::date::text,
      'time', '09:00',
      'timezone', 'Europe/Paris'
    ),
    'arrival', jsonb_build_object(
      'airport', 'LFMN',
      'date', (NOW() + INTERVAL '2 days')::date::text,
      'time', '10:30',
      'timezone', 'Europe/Paris'
    ),
    'aircraft', jsonb_build_object(
      'id', 'aircraft-002',
      'registration', 'F-HCTB',
      'type', 'King Air 350'
    ),
    'passengers', 4,
    'crew', jsonb_build_object(
      'id', 'internal-001',
      'captain', jsonb_build_object(
        'id', 'internal-001',
        'name', 'Pierre Dubois',
        'type', 'internal'
      ),
      'first_officer', jsonb_build_object(
        'id', 'internal-002',
        'name', 'Marie Martin',
        'type', 'internal'
      ),
      'cabin_crew', jsonb_build_array(
        jsonb_build_object(
          'id', 'internal-003',
          'name', 'Claire Bernard',
          'type', 'internal'
        )
      )
    ),
    'special_requirements', jsonb_build_array(
      'Catering business',
      'Wifi à bord'
    ),
    'estimated_cost', 8500,
    'currency', 'EUR',
    'createdAt', NOW()::text,
    'createdBy', 'admin-001',
    'approvedAt', NOW()::text,
    'approvedBy', 'admin-001'
  )
);

-- Mission en attente d'approbation (CELLE QUI CAUSAIT L'ERREUR 404)
INSERT INTO kv_store_9fd39b98 (key, value) VALUES (
  'mission:MO-1705845345678',
  jsonb_build_object(
    'id', 'MO-1705845345678',
    'title', 'Mission urgente Genève',
    'client_name', 'FinanceGroup Swiss',
    'client_contact', jsonb_build_object(
      'name', 'Klaus Weber',
      'email', 'k.weber@financegroup.ch',
      'phone', '+41 22 123 45 67'
    ),
    'status', 'pending_approval',
    'priority', 'urgent',
    'flight_type', 'charter',
    'departure', jsonb_build_object(
      'airport', 'LFPB',
      'date', (NOW() + INTERVAL '1 day')::date::text,
      'time', '07:00',
      'timezone', 'Europe/Paris'
    ),
    'arrival', jsonb_build_object(
      'airport', 'LSGG',
      'date', (NOW() + INTERVAL '1 day')::date::text,
      'time', '08:15',
      'timezone', 'Europe/Zurich'
    ),
    'passengers', 3,
    'special_requirements', jsonb_build_array(
      'Vol urgent',
      'Discrétion requise',
      'Catering premium'
    ),
    'estimated_cost', 9500,
    'currency', 'EUR',
    'createdAt', NOW()::text,
    'createdBy', 'admin-001',
    'notes', 'Client très important - traiter en priorité'
  )
);

-- Mission en attente de validation
INSERT INTO kv_store_9fd39b98 (key, value) VALUES (
  'mission:MO-1705845456789',
  jsonb_build_object(
    'id', 'MO-1705845456789',
    'title', 'Retour de maintenance Londres',
    'client_name', 'Internal Flight',
    'status', 'pending_validation',
    'priority', 'low',
    'flight_type', 'positioning',
    'departure', jsonb_build_object(
      'airport', 'EGKB',
      'date', (NOW() + INTERVAL '5 days')::date::text,
      'time', '11:00',
      'timezone', 'Europe/London'
    ),
    'arrival', jsonb_build_object(
      'airport', 'LFPB',
      'date', (NOW() + INTERVAL '5 days')::date::text,
      'time', '13:30',
      'timezone', 'Europe/Paris'
    ),
    'aircraft', jsonb_build_object(
      'id', 'aircraft-003',
      'registration', 'F-HCTC',
      'type', 'Phenom 300'
    ),
    'passengers', 0,
    'crew', jsonb_build_object(
      'id', 'freelancer-002',
      'captain', jsonb_build_object(
        'id', 'freelancer-002',
        'name', 'Marco Rossi',
        'type', 'freelancer'
      ),
      'first_officer', jsonb_build_object(
        'id', 'freelancer-003',
        'name', 'Sarah Mitchell',
        'type', 'freelancer'
      )
    ),
    'estimated_cost', 3200,
    'currency', 'EUR',
    'createdAt', (NOW() - INTERVAL '2 days')::text,
    'createdBy', 'admin-001',
    'approvedAt', (NOW() - INTERVAL '1 day')::text,
    'approvedBy', 'admin-001',
    'awaiting_validation_from', 'freelancer-002',
    'validation_deadline', (NOW() + INTERVAL '1 day')::text
  )
);

-- =====================================================
-- 6. NOTIFICATIONS (CORRIGÉES AVEC IDS COHÉRENTS)
-- =====================================================

-- Notifications pour l'admin
INSERT INTO kv_store_9fd39b98 (key, value) VALUES 
(
  'notification:admin-001:001',
  jsonb_build_object(
    'id', 'notification-001',
    'userId', 'admin-001',
    'type', 'mission_request',
    'title', 'Nouvelle demande de mission urgente',
    'message', 'Mission urgente Genève en attente d\'approbation',
    'data', jsonb_build_object(
      'missionId', 'MO-1705845345678',
      'priority', 'urgent'
    ),
    'read', false,
    'createdAt', NOW()::text,
    'action_required', true,
    'action_url', '/manage-missions'
  )
),
(
  'notification:admin-001:002',
  jsonb_build_object(
    'id', 'notification-002',
    'userId', 'admin-001',
    'type', 'crew_validation',
    'title', 'Validation équipage en attente',
    'message', 'Thomas Dupont attend la validation de son profil',
    'data', jsonb_build_object(
      'freelancer_id', 'freelancer-004',
      'submitted_date', '2024-01-15'
    ),
    'read', false,
    'createdAt', '2024-01-16T08:30:00Z',
    'action_required', true,
    'action_url', '/manage-crew'
  )
),
(
  'notification:admin-001:003',
  jsonb_build_object(
    'id', 'notification-003',
    'userId', 'admin-001',
    'type', 'mission_completed',
    'title', 'Mission terminée avec succès',
    'message', 'Mission Paris-Londres terminée, facture générée',
    'data', jsonb_build_object(
      'missionId', 'MO-1705845123456',
      'invoice_number', 'INV-2024-001'
    ),
    'read', true,
    'createdAt', '2024-01-22T20:30:00Z',
    'action_required', false
  )
);

-- Notifications pour les freelancers
INSERT INTO kv_store_9fd39b98 (key, value) VALUES 
(
  'notification:freelancer-002:004',
  jsonb_build_object(
    'id', 'notification-004',
    'userId', 'freelancer-002',
    'type', 'mission_assignment',
    'title', 'Nouvelle affectation de mission',
    'message', 'Vous êtes affecté comme capitaine sur la mission retour Londres',
    'data', jsonb_build_object(
      'missionId', 'MO-1705845456789',
      'role', 'captain'
    ),
    'read', false,
    'createdAt', (NOW() - INTERVAL '1 day')::text,
    'action_required', true,
    'action_url', '/missions/MO-1705845456789/validate'
  )
),
(
  'notification:freelancer-001:005',
  jsonb_build_object(
    'id', 'notification-005',
    'userId', 'freelancer-001',
    'type', 'payment_processed',
    'title', 'Paiement traité',
    'message', 'Votre paiement pour la mission Paris-Londres a été traité',
    'data', jsonb_build_object(
      'missionId', 'MO-1705845123456',
      'amount', 1350,
      'currency', 'EUR'
    ),
    'read', false,
    'createdAt', '2024-01-23T10:00:00Z',
    'action_required', false
  )
),
(
  'notification:freelancer-004:006',
  jsonb_build_object(
    'id', 'notification-006',
    'userId', 'freelancer-004',
    'type', 'validation_status',
    'title', 'Validation de profil en cours',
    'message', 'Votre profil est en cours de validation par l\'équipe',
    'data', jsonb_build_object(
      'status', 'pending',
      'submitted_date', '2024-01-15'
    ),
    'read', true,
    'createdAt', '2024-01-16T09:00:00Z',
    'action_required', false
  )
);

-- =====================================================
-- 7. DONNÉES DE CONFIGURATION
-- =====================================================

-- Configuration des tarifs
INSERT INTO kv_store_9fd39b98 (key, value) VALUES (
  'config:pricing',
  jsonb_build_object(
    'aircraft_hourly_rates', jsonb_build_object(
      'Citation_CJ3', 2800,
      'King_Air_350', 2200,
      'Phenom_300', 2500
    ),
    'crew_hourly_rates', jsonb_build_object(
      'captain_internal', 150,
      'first_officer_internal', 120,
      'cabin_crew_internal', 80,
      'captain_freelance', 120,
      'first_officer_freelance', 80,
      'cabin_crew_freelance', 45
    ),
    'base_fees', jsonb_build_object(
      'handling', 250,
      'landing', 150,
      'navigation', 100,
      'fuel_surcharge_percent', 5
    ),
    'currency', 'EUR',
    'last_updated', NOW()::text
  )
);

-- Configuration des aéroports de base
INSERT INTO kv_store_9fd39b98 (key, value) VALUES (
  'config:bases',
  jsonb_build_object(
    'primary_bases', jsonb_build_array(
      jsonb_build_object('icao', 'LFPB', 'name', 'Paris Le Bourget'),
      jsonb_build_object('icao', 'LFPG', 'name', 'Paris CDG')
    ),
    'secondary_bases', jsonb_build_array(
      jsonb_build_object('icao', 'LFMN', 'name', 'Nice Côte d\'Azur'),
      jsonb_build_object('icao', 'LFLL', 'name', 'Lyon Saint-Exupéry')
    ),
    'operating_hours', jsonb_build_object(
      'start', '06:00',
      'end', '22:00',
      'timezone', 'Europe/Paris'
    )
  )
);

-- Statistiques de la compagnie
INSERT INTO kv_store_9fd39b98 (key, value) VALUES (
  'stats:company',
  jsonb_build_object(
    'total_missions_2024', 45,
    'total_flight_hours_2024', 189,
    'active_aircraft', 3,
    'active_crew_internal', 3,
    'active_crew_freelance', 3,
    'pending_validations', 1,
    'revenue_2024', 567500,
    'currency', 'EUR',
    'last_updated', NOW()::text
  )
);

-- =====================================================
-- 8. VÉRIFICATION DES DONNÉES INSÉRÉES
-- =====================================================

-- Afficher un résumé des données créées
SELECT 
  'CrewTech database population completed successfully!' AS message,
  (SELECT COUNT(*) FROM kv_store_9fd39b98 WHERE key LIKE 'user:%') AS users_created,
  (SELECT COUNT(*) FROM kv_store_9fd39b98 WHERE key LIKE 'mission:%') AS missions_created,
  (SELECT COUNT(*) FROM kv_store_9fd39b98 WHERE key LIKE 'notification:%') AS notifications_created,
  (SELECT COUNT(*) FROM kv_store_9fd39b98 WHERE key LIKE 'aircraft:%') AS aircraft_created,
  (SELECT COUNT(*) FROM kv_store_9fd39b98 WHERE key LIKE 'airport:%') AS airports_created;

-- Afficher la répartition des utilisateurs par rôle
SELECT 
  value->>'role' AS role,
  value->>'type' AS type,
  COUNT(*) AS count
FROM kv_store_9fd39b98 
WHERE key LIKE 'user:%'
GROUP BY value->>'role', value->>'type'
ORDER BY role, type;

-- Afficher la répartition des missions par statut
SELECT 
  value->>'status' AS status,
  COUNT(*) AS count
FROM kv_store_9fd39b98 
WHERE key LIKE 'mission:%'
GROUP BY value->>'status'
ORDER BY count DESC;

-- Afficher les missions créées avec leurs IDs
SELECT 
  key,
  value->>'id' AS mission_id,
  value->>'title' AS title,
  value->>'status' AS status
FROM kv_store_9fd39b98 
WHERE key LIKE 'mission:%'
ORDER BY value->>'createdAt' DESC;