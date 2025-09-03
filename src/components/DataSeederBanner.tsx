import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useSupabaseData } from './SupabaseDataProvider';
import { toast } from 'sonner@2.0.3';
import { 
  Database, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Users,
  Plane,
  X,
  Zap
} from 'lucide-react';

// Données d'exemple pour le seeding (identiques à DataSeeder)
const sampleCrewMembers = [
  {
    name: 'Jean Dupont',
    email: 'jean.dupont@crewtech.fr',
    phone: '+33 6 12 34 56 78',
    role: 'captain',
    status: 'active',
    qualifications: ['B737', 'A320', 'Citation CJ3'],
    availability: [
      {
        start_date: '2024-08-01',
        end_date: '2024-12-31',
        status: 'available'
      }
    ],
    hourly_rate: 200
  },
  {
    name: 'Marie Martin',
    email: 'marie.martin@crewtech.fr',
    phone: '+33 6 23 45 67 89',
    role: 'first_officer',
    status: 'active',
    qualifications: ['B737', 'A320'],
    availability: [
      {
        start_date: '2024-08-01',
        end_date: '2024-12-31',
        status: 'available'
      }
    ],
    hourly_rate: 150
  },
  {
    name: 'Pierre Durand',
    email: 'pierre.durand@crewtech.fr',
    phone: '+33 6 34 56 78 90',
    role: 'cabin_crew',
    status: 'active',
    qualifications: ['Safety Training', 'First Aid'],
    availability: [
      {
        start_date: '2024-08-01',
        end_date: '2024-12-31',
        status: 'available'
      }
    ],
    hourly_rate: 100
  },
  {
    name: 'Sophie Laurent',
    email: 'sophie.laurent@freelance.fr',
    phone: '+33 6 45 67 89 01',
    role: 'captain',
    status: 'active',
    qualifications: ['Falcon 7X', 'Citation CJ3', 'King Air 350'],
    availability: [
      {
        start_date: '2024-08-01',
        end_date: '2024-12-31',
        status: 'available'
      }
    ],
    hourly_rate: 250
  }
];

const sampleMissions = [
  {
    mission_number: 'CRW001',
    client: 'AirLux Executive',
    aircraft_type: 'Citation CJ3',
    departure: {
      airport: 'LFPB',
      date: '2024-08-30',
      time: '09:00'
    },
    arrival: {
      airport: 'EGGW',
      date: '2024-08-30',
      time: '11:30'
    },
    crew_requirements: {
      captain: 1,
      first_officer: 1,
      cabin_crew: 0
    },
    assigned_crew: {},
    status: 'pending',
    billing_type: 'direct',
    budget: 8500,
    estimated_cost: 7200,
    validation_status: 'pending',
    owner_approval: 'pending',
    documents: {},
    notes: 'Mission VIP - Confidentialité requise'
  },
  {
    mission_number: 'CRW002',
    client: 'Business Charter Pro',
    aircraft_type: 'King Air 350',
    departure: {
      airport: 'LFMD',
      date: '2024-09-02',
      time: '14:00'
    },
    arrival: {
      airport: 'EGLL',
      date: '2024-09-02',
      time: '16:45'
    },
    crew_requirements: {
      captain: 1,
      first_officer: 1,
      cabin_crew: 1
    },
    assigned_crew: {},
    status: 'pending',
    billing_type: 'finance_validation',
    budget: 12000,
    estimated_cost: 10500,
    validation_status: 'pending',
    owner_approval: 'pending',
    documents: {},
    notes: 'Transport médical - Équipement spécialisé requis'
  },
  {
    mission_number: 'CRW003',
    client: 'Corporate Flight Solutions',
    aircraft_type: 'Falcon 7X',
    departure: {
      airport: 'LFPB',
      date: '2024-09-05',
      time: '08:30'
    },
    arrival: {
      airport: 'KJFK',
      date: '2024-09-05',
      time: '18:15'
    },
    crew_requirements: {
      captain: 1,
      first_officer: 1,
      cabin_crew: 2
    },
    assigned_crew: {},
    status: 'crew_assigned',
    billing_type: 'direct',
    budget: 35000,
    estimated_cost: 32000,
    validation_status: 'validated',
    owner_approval: 'approved',
    documents: {},
    notes: 'Vol transatlantique - Préparation longue distance'
  }
];

const sampleNotifications = [
  {
    type: 'mission_assignment',
    title: 'Nouvelle mission disponible',
    message: 'Mission CRW001 vers Londres - Recherche capitaine qualifié Citation CJ3',
    priority: 'medium',
    read: false
  },
  {
    type: 'crew_availability',
    title: 'Mise à jour disponibilité',
    message: 'Jean Dupont a mis à jour sa disponibilité pour septembre',
    priority: 'low',
    read: false
  },
  {
    type: 'document_ready',
    title: 'Document généré',
    message: 'Ordre de mission CRW003 généré et prêt pour validation',
    priority: 'high',
    read: false
  }
];

const sampleActivities = [
  {
    type: 'mission_created',
    description: 'Mission CRW001 créée pour AirLux Executive',
    user_id: 'admin_user',
    metadata: { mission_number: 'CRW001' }
  },
  {
    type: 'crew_assigned',
    description: 'Jean Dupont assigné à la mission CRW003',
    user_id: 'admin_user',
    metadata: { mission_number: 'CRW003', crew_name: 'Jean Dupont' }
  },
  {
    type: 'document_generated',
    description: 'Ordre de mission généré pour CRW002',
    user_id: 'admin_user',
    metadata: { mission_number: 'CRW002', document_type: 'mission_order' }
  }
];

interface DataSeederBannerProps {
  onDismiss?: () => void;
}

export default function DataSeederBanner({ onDismiss }: DataSeederBannerProps) {
  const { 
    missions, 
    crewMembers, 
    loading,
    actions 
  } = useSupabaseData();
  
  const [seeding, setSeeding] = useState(false);
  const [seedingStep, setSeedingStep] = useState('');
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('data_seeder_banner_dismissed') === 'true';
  });

  // Vérifier s'il faut afficher la bannière
  const shouldShow = !dismissed && 
                     !loading.missions && 
                     !loading.crew && 
                     missions.length === 0 && 
                     crewMembers.length === 0;

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      setSeedingStep('Préparation...');

      // 1. Créer les membres d'équipage
      setSeedingStep('Création des équipages...');
      for (const crewData of sampleCrewMembers) {
        await actions.createCrewMember(crewData);
      }

      // 2. Créer les missions
      setSeedingStep('Création des missions...');
      for (const missionData of sampleMissions) {
        await actions.createMission(missionData);
      }

      // 3. Créer les notifications
      setSeedingStep('Ajout des notifications...');
      for (const notificationData of sampleNotifications) {
        await actions.createNotification(notificationData);
      }

      // 4. Créer les activités
      setSeedingStep('Logging des activités...');
      for (const activityData of sampleActivities) {
        await actions.logActivity(activityData);
      }

      setSeedingStep('Finalisation...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('🎉 Données d\'exemple chargées !', {
        description: `${sampleCrewMembers.length} équipages, ${sampleMissions.length} missions et plus créés avec succès.`,
        duration: 5000
      });

      // Auto-dismiss after successful seeding
      handleDismiss();

    } catch (error) {
      console.error('Erreur lors du seeding:', error);
      toast.error('Erreur lors du chargement des données', {
        description: error.message
      });
    } finally {
      setSeeding(false);
      setSeedingStep('');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('data_seeder_banner_dismissed', 'true');
    onDismiss?.();
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg shrink-0">
          <Database className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-medium text-blue-900 flex items-center space-x-2">
              <span>🚀 Bienvenue dans CrewTech !</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Zap className="h-3 w-3 mr-1" />
                Démarrage rapide
              </Badge>
            </h3>
            <AlertDescription className="text-blue-800 mt-2">
              Votre base de données est vide. Chargez des données d'exemple pour découvrir toutes les fonctionnalités de la plateforme.
            </AlertDescription>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center space-x-2 p-2 bg-white/60 rounded-lg border border-blue-100">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{sampleCrewMembers.length} Équipages</p>
                <p className="text-xs text-blue-600">Pilotes, PNC...</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-white/60 rounded-lg border border-blue-100">
              <Plane className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{sampleMissions.length} Missions</p>
                <p className="text-xs text-blue-600">Différents statuts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-white/60 rounded-lg border border-blue-100">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{sampleNotifications.length} Notifications</p>
                <p className="text-xs text-blue-600">Système d'alertes</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-white/60 rounded-lg border border-blue-100">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Données réalistes</p>
                <p className="text-xs text-blue-600">Aviation d'affaires</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSeedData}
              disabled={seeding}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {seedingStep || 'Chargement...'}
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Charger les données d'exemple
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              disabled={seeding}
            >
              Ignorer
            </Button>
          </div>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        disabled={seeding}
        className="absolute top-2 right-2 h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}