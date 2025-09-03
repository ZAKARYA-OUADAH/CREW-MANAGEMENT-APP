import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
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
  RefreshCw,
  Trash2
} from 'lucide-react';

// Données d'exemple pour le seeding
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

export default function DataSeeder() {
  const { 
    missions, 
    crewMembers, 
    notifications, 
    activities,
    loading,
    actions 
  } = useSupabaseData();
  
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [seedingStep, setSeedingStep] = useState('');

  // Auto-seed si aucune donnée n'existe
  useEffect(() => {
    const autoSeed = async () => {
      // Attendre que le chargement soit terminé
      if (loading.missions || loading.crew || loading.notifications || loading.activities) {
        return;
      }

      // Si aucune donnée n'existe, proposer le seeding automatique
      if (missions.length === 0 && crewMembers.length === 0) {
        console.log('🌱 Aucune donnée détectée - Proposition de seeding automatique');
        toast.info('Base de données vide - Données d\'exemple disponibles', {
          description: 'Vous pouvez charger des données d\'exemple pour commencer',
          duration: 5000
        });
      }
    };

    autoSeed();
  }, [missions.length, crewMembers.length, loading]);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      setSeedingStep('Préparation du seeding...');

      // 1. Créer les membres d'équipage
      setSeedingStep('Création des membres d\'équipage...');
      for (const crewData of sampleCrewMembers) {
        await actions.createCrewMember(crewData);
      }

      // 2. Créer les missions
      setSeedingStep('Création des missions...');
      for (const missionData of sampleMissions) {
        await actions.createMission(missionData);
      }

      // 3. Créer les notifications
      setSeedingStep('Création des notifications...');
      for (const notificationData of sampleNotifications) {
        await actions.createNotification(notificationData);
      }

      // 4. Créer les activités
      setSeedingStep('Création des activités...');
      for (const activityData of sampleActivities) {
        await actions.logActivity(activityData);
      }

      setSeedingStep('Finalisation...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Données d\'exemple chargées avec succès !', {
        description: `${sampleCrewMembers.length} membres d'équipage, ${sampleMissions.length} missions, ${sampleNotifications.length} notifications et ${sampleActivities.length} activités créés.`
      });

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

  const handleClearData = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.')) {
      return;
    }

    try {
      setClearing(true);

      // Supprimer toutes les missions
      for (const mission of missions) {
        await actions.deleteMission(mission.id);
      }

      // Supprimer tous les membres d'équipage
      for (const crew of crewMembers) {
        await actions.deleteCrewMember(crew.id);
      }

      // Supprimer toutes les notifications
      for (const notification of notifications) {
        await actions.deleteNotification(notification.id);
      }

      toast.success('Toutes les données ont été supprimées');

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression des données');
    } finally {
      setClearing(false);
    }
  };

  const totalDataItems = missions.length + crewMembers.length + notifications.length + activities.length;
  const hasData = totalDataItems > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-600" />
          <span>Gestion des Données</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Statut actuel */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Statut des Données</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Équipage</p>
                <p className="text-lg font-bold text-blue-700">{crewMembers.length}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
              <Plane className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Missions</p>
                <p className="text-lg font-bold text-green-700">{missions.length}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">Notifications</p>
                <p className="text-lg font-bold text-purple-700">{notifications.length}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
              <RefreshCw className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">Activités</p>
                <p className="text-lg font-bold text-orange-700">{activities.length}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={hasData ? 'default' : 'secondary'}>
              {hasData ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {totalDataItems} éléments
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Base de données vide
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Messages conditionnels */}
        {!hasData && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Base de données vide</strong><br />
              Votre application ne contient aucune donnée. Vous pouvez charger des données d'exemple pour commencer à explorer les fonctionnalités.
            </AlertDescription>
          </Alert>
        )}

        {hasData && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Données chargées</strong><br />
              Votre application contient {totalDataItems} éléments de données et est prête à être utilisée.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Actions</h3>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSeedData}
              disabled={seeding || clearing}
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
                  {hasData ? 'Ajouter plus de données' : 'Charger données d\'exemple'}
                </>
              )}
            </Button>
            
            <Button
              onClick={() => actions.forceSync()}
              variant="outline"
              disabled={seeding || clearing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchroniser
            </Button>
            
            {hasData && (
              <Button
                onClick={handleClearData}
                variant="outline"
                disabled={seeding || clearing}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                {clearing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Vider la base
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Informations sur les données d'exemple */}
        {!hasData && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Données d'exemple incluses :</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {sampleCrewMembers.length} membres d'équipage (capitaines, copilotes, PNC)</li>
              <li>• {sampleMissions.length} missions avec différents statuts</li>
              <li>• {sampleNotifications.length} notifications de test</li>
              <li>• {sampleActivities.length} activités d'exemple</li>
              <li>• Données réalistes pour l'aviation d'affaires</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}