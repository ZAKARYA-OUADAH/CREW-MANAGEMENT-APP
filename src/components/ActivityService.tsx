import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'freelancer' | 'internal';
  action: string;
  actionType: 'mission_created' | 'mission_validated' | 'document_uploaded' | 'profile_updated' | 'login' | 'crew_added' | 'mission_approved' | 'mission_rejected' | 'export_generated' | 'mission_assigned' | 'payment_processed';
  timestamp: string;
  details?: string;
  missionId?: string;
  crewId?: string;
  metadata?: Record<string, any>;
}

interface ActivityContextType {
  activities: ActivityItem[];
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  getRecentActivities: (limit?: number) => ActivityItem[];
  getActivitiesByUser: (userId: string) => ActivityItem[];
  getActivitiesByType: (actionType: string) => ActivityItem[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

interface ActivityProviderProps {
  children: ReactNode;
}

export const ActivityProvider: React.FC<ActivityProviderProps> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Load initial activities from localStorage
  useEffect(() => {
    const savedActivities = localStorage.getItem('user_activities');
    if (savedActivities) {
      try {
        const parsedActivities = JSON.parse(savedActivities);
        setActivities(parsedActivities);
      } catch (error) {
        console.error('Error loading activities from localStorage:', error);
      }
    } else {
      // Initialize with some mock data if no activities exist
      initializeMockActivities();
    }
  }, []);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('user_activities', JSON.stringify(activities));
  }, [activities]);

  const initializeMockActivities = () => {
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        userId: 'admin1',
        userName: 'Jean Dupont',
        userRole: 'admin',
        action: 'a créé une nouvelle mission',
        actionType: 'mission_created',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        details: 'Mission F-GZXY Captain',
        missionId: 'MS-2024-001',
      },
      {
        id: '2',
        userId: 'crew1',
        userName: 'Marie Martin',
        userRole: 'freelancer',
        action: 'a validé sa mission',
        actionType: 'mission_validated',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        details: 'Mission #MS-2024-003',
        missionId: 'MS-2024-003',
      },
      {
        id: '3',
        userId: 'admin2',
        userName: 'Pierre Leroy',
        userRole: 'admin',
        action: 'a ajouté un nouveau crew',
        actionType: 'crew_added',
        timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        details: 'Sophie Dubois - Flight Attendant',
        crewId: 'crew_004',
      },
      {
        id: '4',
        userId: 'crew2',
        userName: 'Thomas Bernard',
        userRole: 'internal',
        action: 'a mis à jour son profil',
        actionType: 'profile_updated',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        details: 'Qualifications avion',
      },
      {
        id: '5',
        userId: 'admin1',
        userName: 'Jean Dupont',
        userRole: 'admin',
        action: 'a approuvé une mission',
        actionType: 'mission_approved',
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        details: 'Mission F-HABC First Officer',
        missionId: 'MS-2024-002',
      },
      {
        id: '6',
        userId: 'crew3',
        userName: 'Laura Petit',
        userRole: 'freelancer',
        action: 'a téléchargé un document',
        actionType: 'document_uploaded',
        timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        details: 'Certificat médical',
      },
      {
        id: '7',
        userId: 'admin3',
        userName: 'Vincent Moreau',
        userRole: 'admin',
        action: 'a généré un export finance',
        actionType: 'export_generated',
        timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
        details: 'Export mensuel November 2024',
      },
    ];
    setActivities(mockActivities);
  };

  const addActivity = (activityData: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityItem = {
      ...activityData,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 100)); // Keep only last 100 activities
  };

  const getRecentActivities = (limit: number = 10) => {
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  const getActivitiesByUser = (userId: string) => {
    return activities
      .filter(activity => activity.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getActivitiesByType = (actionType: string) => {
    return activities
      .filter(activity => activity.actionType === actionType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const value: ActivityContextType = {
    activities,
    addActivity,
    getRecentActivities,
    getActivitiesByUser,
    getActivitiesByType,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};

// Helper hook to track common activities
export const useActivityTracker = () => {
  const { addActivity } = useActivity();

  const trackMissionCreated = (userId: string, userName: string, userRole: 'admin' | 'freelancer' | 'internal', missionDetails: string, missionId?: string) => {
    addActivity({
      userId,
      userName,
      userRole,
      action: 'a créé une nouvelle mission',
      actionType: 'mission_created',
      details: missionDetails,
      missionId,
    });
  };

  const trackMissionValidated = (userId: string, userName: string, userRole: 'admin' | 'freelancer' | 'internal', missionDetails: string, missionId?: string) => {
    addActivity({
      userId,
      userName,
      userRole,
      action: 'a validé sa mission',
      actionType: 'mission_validated',
      details: missionDetails,
      missionId,
    });
  };

  const trackMissionApproved = (userId: string, userName: string, userRole: 'admin' | 'freelancer' | 'internal', missionDetails: string, missionId?: string) => {
    addActivity({
      userId,
      userName,
      userRole,
      action: 'a approuvé une mission',
      actionType: 'mission_approved',
      details: missionDetails,
      missionId,
    });
  };

  const trackMissionRejected = (userId: string, userName: string, userRole: 'admin' | 'freelancer' | 'internal', missionDetails: string, missionId?: string) => {
    addActivity({
      userId,
      userName,
      userRole,
      action: 'a rejeté une mission',
      actionType: 'mission_rejected',
      details: missionDetails,
      missionId,
    });
  };

  const trackCrewAdded = (userId: string, userName: string, userRole: 'admin' | 'freelancer' | 'internal', crewDetails: string, crewId?: string) => {
    addActivity({
      userId,
      userName,
      userRole,
      action: 'a ajouté un nouveau crew',
      actionType: 'crew_added',
      details: crewDetails,
      crewId,
    });
  };

  const trackDocumentUploaded = (userId: string, userName: string, userRole: 'admin' | 'freelancer' | 'internal', documentDetails: string) => {
    addActivity({
      userId,
      userName,
      userRole,
      action: 'a téléchargé un document',
      actionType: 'document_uploaded',
      details: documentDetails,
    });
  };

  const trackProfileUpdated = (userId: string, userName: string, userRole: 'admin' | 'freelancer' | 'internal', updateDetails: string) => {
    addActivity({
      userId,
      userName,
      userRole,
      action: 'a mis à jour son profil',
      actionType: 'profile_updated',
      details: updateDetails,
    });
  };

  const trackExportGenerated = (userId: string, userName: string, userRole: 'admin' | 'freelancer' | 'internal', exportDetails: string) => {
    addActivity({
      userId,
      userName,
      userRole,
      action: 'a généré un export',
      actionType: 'export_generated',
      details: exportDetails,
    });
  };

  return {
    trackMissionCreated,
    trackMissionValidated,
    trackMissionApproved,
    trackMissionRejected,
    trackCrewAdded,
    trackDocumentUploaded,
    trackProfileUpdated,
    trackExportGenerated,
  };
};