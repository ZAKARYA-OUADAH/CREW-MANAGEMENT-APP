import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '../utils/supabase/client';
import * as kv from '../utils/supabase/kv_store';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

// Types pour les données de l'application
export interface CrewMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'captain' | 'first_officer' | 'cabin_crew' | 'engineer';
  status: 'active' | 'inactive' | 'pending';
  qualifications: string[];
  availability: {
    start_date: string;
    end_date: string;
    status: 'available' | 'busy' | 'partial';
  }[];
  hourly_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Mission {
  id: string;
  mission_number: string;
  client: string;
  aircraft_type: string;
  departure: {
    airport: string;
    date: string;
    time: string;
  };
  arrival: {
    airport: string;
    date: string;
    time: string;
  };
  crew_requirements: {
    captain: number;
    first_officer: number;
    cabin_crew: number;
    engineer?: number;
  };
  assigned_crew: {
    [key: string]: string[]; // role -> crew member IDs
  };
  status: 'pending' | 'crew_assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  billing_type: 'direct' | 'finance_validation';
  budget: number;
  estimated_cost: number;
  actual_cost?: number;
  validation_status: 'pending' | 'validated' | 'rejected';
  owner_approval: 'pending' | 'approved' | 'rejected';
  documents: {
    mission_order?: string;
    invoice?: string;
    contract?: string;
  };
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface Notification {
  id: string;
  type: 'mission_assignment' | 'mission_update' | 'crew_availability' | 'document_ready' | 'approval_request';
  title: string;
  message: string;
  mission_id?: string;
  crew_id?: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  expires_at?: string;
}

export interface Activity {
  id: string;
  type: 'mission_created' | 'crew_assigned' | 'mission_validated' | 'document_generated' | 'sync_completed';
  description: string;
  mission_id?: string;
  crew_id?: string;
  user_id: string;
  metadata?: any;
  created_at: string;
}

// Interface du contexte
interface SupabaseDataContextType {
  // État des données
  missions: Mission[];
  crewMembers: CrewMember[];
  notifications: Notification[];
  activities: Activity[];
  
  // États de chargement
  loading: {
    missions: boolean;
    crew: boolean;
    notifications: boolean;
    activities: boolean;
  };
  
  // États de synchronisation
  syncing: boolean;
  lastSync: Date | null;
  
  // Actions CRUD
  actions: {
    // Missions
    createMission: (mission: Omit<Mission, 'id' | 'created_at' | 'updated_at'>) => Promise<Mission>;
    updateMission: (id: string, updates: Partial<Mission>) => Promise<Mission>;
    deleteMission: (id: string) => Promise<void>;
    
    // Crew
    createCrewMember: (crew: Omit<CrewMember, 'id' | 'created_at' | 'updated_at'>) => Promise<CrewMember>;
    updateCrewMember: (id: string, updates: Partial<CrewMember>) => Promise<CrewMember>;
    deleteCrewMember: (id: string) => Promise<void>;
    
    // Notifications
    createNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<Notification>;
    markNotificationRead: (id: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    
    // Activities
    logActivity: (activity: Omit<Activity, 'id' | 'created_at'>) => Promise<Activity>;
    
    // Synchronisation
    forceSync: () => Promise<void>;
    syncFromServer: () => Promise<void>;
  };
  
  // Utilitaires
  utils: {
    getMissionsByStatus: (status: Mission['status']) => Mission[];
    getAvailableCrew: (startDate: string, endDate: string) => CrewMember[];
    getUnreadNotifications: () => Notification[];
    getRecentActivities: (limit?: number) => Activity[];
  };
}

const SupabaseDataContext = createContext<SupabaseDataContextType | undefined>(undefined);

export const useSupabaseData = () => {
  const context = useContext(SupabaseDataContext);
  if (!context) {
    throw new Error('useSupabaseData must be used within a SupabaseDataProvider');
  }
  return context;
};

export const SupabaseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // États des données
  const [missions, setMissions] = useState<Mission[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // États de chargement
  const [loading, setLoading] = useState({
    missions: true,
    crew: true,
    notifications: true,
    activities: true,
  });
  
  // États de synchronisation
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  // Client Supabase (mode local par défaut)
  const [supabaseClient, setSupabaseClient] = useState(null);
  
  // Fonctions utilitaires pour les clés KV
  const getKVKey = (type: string, id?: string) => {
    return id ? `crewtech:${type}:${id}` : `crewtech:${type}`;
  };
  
  // Chargement initial des données
  const loadInitialData = useCallback(async () => {
    try {
      setSyncing(true);
      
      console.log('🔄 Chargement des données...');
      
      // Test de connectivité
      const isConnected = await kv.testConnection();
      const connectivity = kv.getConnectivityStatus();
      
      if (isConnected) {
        console.log(`✅ Store KV connecté en mode ${connectivity.mode}`);
      } else {
        console.warn('⚠️ Store KV non disponible');
      }
      
      // Charger les missions
      setLoading(prev => ({ ...prev, missions: true }));
      try {
        const missionsData = await kv.getByPrefix('crewtech:missions:');
        setMissions(missionsData || []);
        console.log(`📋 ${(missionsData || []).length} missions chargées`);
      } catch (error) {
        console.warn('⚠️ Erreur chargement missions:', error.message);
        setMissions([]);
      }
      setLoading(prev => ({ ...prev, missions: false }));
      
      // Charger les membres d'équipage
      setLoading(prev => ({ ...prev, crew: true }));
      try {
        const crewData = await kv.getByPrefix('crewtech:crew:');
        setCrewMembers(crewData || []);
        console.log(`👥 ${(crewData || []).length} membres d'équipage chargés`);
      } catch (error) {
        console.warn('⚠️ Erreur chargement équipage:', error.message);
        setCrewMembers([]);
      }
      setLoading(prev => ({ ...prev, crew: false }));
      
      // Charger les notifications
      setLoading(prev => ({ ...prev, notifications: true }));
      try {
        const notificationsData = await kv.getByPrefix('crewtech:notifications:');
        setNotifications(notificationsData || []);
        console.log(`🔔 ${(notificationsData || []).length} notifications chargées`);
      } catch (error) {
        console.warn('⚠️ Erreur chargement notifications:', error.message);
        setNotifications([]);
      }
      setLoading(prev => ({ ...prev, notifications: false }));
      
      // Charger les activités
      setLoading(prev => ({ ...prev, activities: true }));
      try {
        const activitiesData = await kv.getByPrefix('crewtech:activities:');
        const sortedActivities = (activitiesData || []).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setActivities(sortedActivities.slice(0, 100)); // Garder seulement les 100 dernières
        console.log(`📈 ${sortedActivities.length} activités chargées`);
      } catch (error) {
        console.warn('⚠️ Erreur chargement activités:', error.message);
        setActivities([]);
      }
      setLoading(prev => ({ ...prev, activities: false }));
      
      setLastSync(new Date());
      
      const totalItems = missions.length + crewMembers.length + notifications.length + activities.length;
      console.log(`✅ Chargement terminé - ${totalItems} éléments au total en mode ${connectivity.mode}`);
      
    } catch (error) {
      console.error('❌ Erreur critique lors du chargement:', error);
      // Ne pas afficher de toast d'erreur pour les erreurs de connectivité
      if (!error.message.includes('Network error') && !error.message.includes('Failed to fetch')) {
        toast.error('Erreur lors du chargement des données');
      }
    } finally {
      setSyncing(false);
    }
  }, []);
  
  // Actions CRUD pour les missions
  const createMission = useCallback(async (missionData: Omit<Mission, 'id' | 'created_at' | 'updated_at'>): Promise<Mission> => {
    try {
      const mission: Mission = {
        ...missionData,
        id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await kv.set(getKVKey('missions', mission.id), mission);
      setMissions(prev => [...prev, mission]);
      
      // Log de l'activité
      try {
        await logActivity({
          type: 'mission_created',
          description: `Mission ${mission.mission_number} créée`,
          mission_id: mission.id,
          user_id: 'current_user', // À remplacer par l'utilisateur actuel
        });
      } catch (activityError) {
        console.warn('Impossible de logger l\'activité:', activityError);
      }
      
      toast.success(`Mission ${mission.mission_number} créée`);
      return mission;
    } catch (error) {
      console.error('Erreur lors de la création de mission:', error);
      toast.error('Erreur lors de la création de la mission');
      throw error;
    }
  }, []);
  
  const updateMission = useCallback(async (id: string, updates: Partial<Mission>): Promise<Mission> => {
    try {
      const existingMission = missions.find(m => m.id === id);
      if (!existingMission) {
        throw new Error('Mission non trouvée');
      }
      
      const updatedMission: Mission = {
        ...existingMission,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      await kv.set(getKVKey('missions', id), updatedMission);
      setMissions(prev => prev.map(m => m.id === id ? updatedMission : m));
      
      // Log de l'activité
      try {
        await logActivity({
          type: 'mission_validated',
          description: `Mission ${updatedMission.mission_number} mise à jour`,
          mission_id: id,
          user_id: 'current_user',
        });
      } catch (activityError) {
        console.warn('Impossible de logger l\'activité:', activityError);
      }
      
      toast.success(`Mission ${updatedMission.mission_number} mise à jour`);
      return updatedMission;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de mission:', error);
      toast.error('Erreur lors de la mise à jour de la mission');
      throw error;
    }
  }, [missions]);
  
  const deleteMission = useCallback(async (id: string): Promise<void> => {
    try {
      await kv.del(getKVKey('missions', id));
      setMissions(prev => prev.filter(m => m.id !== id));
      toast.success('Mission supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression de mission:', error);
      toast.error('Erreur lors de la suppression de la mission');
      throw error;
    }
  }, []);
  
  // Actions CRUD pour les membres d'équipage
  const createCrewMember = useCallback(async (crewData: Omit<CrewMember, 'id' | 'created_at' | 'updated_at'>): Promise<CrewMember> => {
    try {
      const crewMember: CrewMember = {
        ...crewData,
        id: `crew_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await kv.set(getKVKey('crew', crewMember.id), crewMember);
      setCrewMembers(prev => [...prev, crewMember]);
      
      toast.success(`Membre d'équipage ${crewMember.name} ajouté`);
      return crewMember;
    } catch (error) {
      console.error('Erreur lors de la création du membre d\'équipage:', error);
      toast.error('Erreur lors de la création du membre d\'équipage');
      throw error;
    }
  }, []);
  
  const updateCrewMember = useCallback(async (id: string, updates: Partial<CrewMember>): Promise<CrewMember> => {
    try {
      const existingCrew = crewMembers.find(c => c.id === id);
      if (!existingCrew) {
        throw new Error('Membre d\'équipage non trouvé');
      }
      
      const updatedCrew: CrewMember = {
        ...existingCrew,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      await kv.set(getKVKey('crew', id), updatedCrew);
      setCrewMembers(prev => prev.map(c => c.id === id ? updatedCrew : c));
      
      toast.success(`Profil de ${updatedCrew.name} mis à jour`);
      return updatedCrew;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du membre d\'équipage:', error);
      toast.error('Erreur lors de la mise à jour du profil');
      throw error;
    }
  }, [crewMembers]);
  
  const deleteCrewMember = useCallback(async (id: string): Promise<void> => {
    try {
      await kv.del(getKVKey('crew', id));
      setCrewMembers(prev => prev.filter(c => c.id !== id));
      toast.success('Membre d\'équipage supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du membre d\'équipage:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  }, []);
  
  // Actions pour les notifications
  const createNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> => {
    try {
      const notification: Notification = {
        ...notificationData,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };
      
      await kv.set(getKVKey('notifications', notification.id), notification);
      setNotifications(prev => [notification, ...prev]);
      
      return notification;
    } catch (error) {
      console.error('Erreur lors de la création de notification:', error);
      throw error;
    }
  }, []);
  
  const markNotificationRead = useCallback(async (id: string): Promise<void> => {
    try {
      const notification = notifications.find(n => n.id === id);
      if (notification) {
        const updatedNotification = { ...notification, read: true };
        await kv.set(getKVKey('notifications', id), updatedNotification);
        setNotifications(prev => prev.map(n => n.id === id ? updatedNotification : n));
      }
    } catch (error) {
      console.error('Erreur lors de la lecture de notification:', error);
    }
  }, [notifications]);
  
  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    try {
      await kv.del(getKVKey('notifications', id));
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression de notification:', error);
    }
  }, []);
  
  // Actions pour les activités
  const logActivity = useCallback(async (activityData: Omit<Activity, 'id' | 'created_at'>): Promise<Activity> => {
    try {
      const activity: Activity = {
        ...activityData,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };
      
      await kv.set(getKVKey('activities', activity.id), activity);
      setActivities(prev => [activity, ...prev.slice(0, 99)]); // Garder seulement les 100 dernières
      
      return activity;
    } catch (error) {
      console.error('Erreur lors du logging d\'activité:', error);
      throw error;
    }
  }, []);
  
  // Synchronisation forcée
  const forceSync = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Synchronisation forcée demandée...');
      await loadInitialData();
    } catch (error) {
      console.error('Erreur lors de la synchronisation forcée:', error);
      toast.error('Erreur lors de la synchronisation');
    }
  }, [loadInitialData]);
  
  // Synchronisation depuis le serveur
  const syncFromServer = useCallback(async (): Promise<void> => {
    try {
      setSyncing(true);
      
      // Vérifier d'abord la connectivité
      const connectivity = kv.getConnectivityStatus();
      console.log(`🔄 Synchronisation en mode ${connectivity.mode}...`);
      
      if (connectivity.mode === 'local') {
        console.log(`📦 Mode local actif - synchronisation avec localStorage`);
        // En mode local, juste recharger depuis le localStorage
        await loadInitialData();
        return;
      }
      
      // Tentative de synchronisation serveur
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/data/sync`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        const syncData = result.success ? result.data : result;
        
        if (syncData.missions) {
          setMissions(syncData.missions);
        }
        if (syncData.crew) {
          setCrewMembers(syncData.crew);
        }
        if (syncData.notifications) {
          setNotifications(syncData.notifications);
        }
        if (syncData.activities) {
          setActivities(syncData.activities.slice(0, 100));
        }
        
        setLastSync(new Date());
        console.log('✅ Synchronisation serveur réussie');
        toast.success('Synchronisation réussie');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Synchronisation serveur échouée, utilisation du mode local:', error.message);
      
      // Fallback sur le chargement local
      try {
        await loadInitialData();
        console.log('✅ Fallback local réussi');
      } catch (localError) {
        console.error('❌ Échec du fallback local:', localError);
      }
    } finally {
      setSyncing(false);
    }
  }, [loadInitialData]);
  
  // Fonctions utilitaires
  const getMissionsByStatus = useCallback((status: Mission['status']) => {
    return missions.filter(mission => mission.status === status);
  }, [missions]);
  
  const getAvailableCrew = useCallback((startDate: string, endDate: string) => {
    return crewMembers.filter(crew => {
      if (crew.status !== 'active') return false;
      
      // Vérifier la disponibilité
      return crew.availability.some(avail => 
        avail.status === 'available' &&
        new Date(avail.start_date) <= new Date(startDate) &&
        new Date(avail.end_date) >= new Date(endDate)
      );
    });
  }, [crewMembers]);
  
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notif => !notif.read);
  }, [notifications]);
  
  const getRecentActivities = useCallback((limit: number = 10) => {
    return activities.slice(0, limit);
  }, [activities]);
  
  // Chargement initial
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  // Notification unique pour informer du mode local
  useEffect(() => {
    const hasShownLocalModeNotification = localStorage.getItem('crewtech_local_mode_notification_shown');
    
    if (!hasShownLocalModeNotification) {
      setTimeout(() => {
        const connectivity = kv.getConnectivityStatus();
        if (connectivity.mode === 'local') {
          toast.info('Mode local activé', {
            description: 'Les Edge Functions Supabase ne sont pas disponibles. L\'application fonctionne en mode local avec localStorage.',
            duration: 8000
          });
          localStorage.setItem('crewtech_local_mode_notification_shown', 'true');
        }
      }, 2000);
    }
  }, []);
  
  // Synchronisation automatique toutes les 30 secondes (seulement si en mode serveur)
  useEffect(() => {
    const interval = setInterval(() => {
      const connectivity = kv.getConnectivityStatus();
      // Seulement synchroniser si le serveur était disponible la dernière fois
      if (connectivity.mode === 'server') {
        syncFromServer();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [syncFromServer]);
  
  // Valeur du contexte
  const contextValue: SupabaseDataContextType = {
    missions,
    crewMembers,
    notifications,
    activities,
    loading,
    syncing,
    lastSync,
    actions: {
      createMission,
      updateMission,
      deleteMission,
      createCrewMember,
      updateCrewMember,
      deleteCrewMember,
      createNotification,
      markNotificationRead,
      deleteNotification,
      logActivity,
      forceSync,
      syncFromServer,
    },
    utils: {
      getMissionsByStatus,
      getAvailableCrew,
      getUnreadNotifications,
      getRecentActivities,
    },
  };
  
  return (
    <SupabaseDataContext.Provider value={contextValue}>
      {children}
    </SupabaseDataContext.Provider>
  );
};