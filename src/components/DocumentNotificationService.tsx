import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NotificationRecord {
  crewId: string;
  crewName: string;
  sentBy: string;
  sentByName: string;
  sentAt: string;
  missingDocs: string[];
  notificationCount: number; // Nombre de notifications envoyées au total
}

interface DocumentNotificationContextType {
  canSendNotification: (crewId: string) => boolean;
  getLastNotification: (crewId: string) => NotificationRecord | null;
  recordNotification: (crewId: string, crewName: string, sentBy: string, sentByName: string, missingDocs: string[]) => void;
  getTimeUntilNextNotification: (crewId: string) => number; // en minutes
  getAllNotificationRecords: () => NotificationRecord[];
  getNotificationStats: (crewId: string) => {
    totalSent: number;
    lastSentBy: string | null;
    lastSentAt: string | null;
    canSendNow: boolean;
    nextAvailableIn: number; // minutes
  };
}

const DocumentNotificationContext = createContext<DocumentNotificationContextType | undefined>(undefined);

export const useDocumentNotifications = () => {
  const context = useContext(DocumentNotificationContext);
  if (!context) {
    throw new Error('useDocumentNotifications must be used within a DocumentNotificationProvider');
  }
  return context;
};

interface DocumentNotificationProviderProps {
  children: ReactNode;
}

export const DocumentNotificationProvider: React.FC<DocumentNotificationProviderProps> = ({ children }) => {
  const [notificationRecords, setNotificationRecords] = useState<NotificationRecord[]>([]);

  // Load records from localStorage on mount
  useEffect(() => {
    const savedRecords = localStorage.getItem('document_notification_records');
    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords);
        setNotificationRecords(parsed);
      } catch (error) {
        console.error('Error loading notification records:', error);
      }
    }
  }, []);

  // Save records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('document_notification_records', JSON.stringify(notificationRecords));
  }, [notificationRecords]);

  const canSendNotification = (crewId: string): boolean => {
    const lastRecord = getLastNotification(crewId);
    if (!lastRecord) return true;

    const lastSentTime = new Date(lastRecord.sentAt);
    const now = new Date();
    const hoursSince = (now.getTime() - lastSentTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSince >= 24;
  };

  const getLastNotification = (crewId: string): NotificationRecord | null => {
    const records = notificationRecords
      .filter(record => record.crewId === crewId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    
    return records[0] || null;
  };

  const recordNotification = (
    crewId: string, 
    crewName: string, 
    sentBy: string, 
    sentByName: string, 
    missingDocs: string[]
  ) => {
    const existingRecord = getLastNotification(crewId);
    const notificationCount = existingRecord ? existingRecord.notificationCount + 1 : 1;

    const newRecord: NotificationRecord = {
      crewId,
      crewName,
      sentBy,
      sentByName,
      sentAt: new Date().toISOString(),
      missingDocs: [...missingDocs],
      notificationCount,
    };

    setNotificationRecords(prev => [newRecord, ...prev]);
  };

  const getTimeUntilNextNotification = (crewId: string): number => {
    const lastRecord = getLastNotification(crewId);
    if (!lastRecord) return 0;

    const lastSentTime = new Date(lastRecord.sentAt);
    const now = new Date();
    const minutesSince = (now.getTime() - lastSentTime.getTime()) / (1000 * 60);
    const minutesUntilNext = (24 * 60) - minutesSince;
    
    return Math.max(0, Math.ceil(minutesUntilNext));
  };

  const getAllNotificationRecords = (): NotificationRecord[] => {
    return notificationRecords.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  };

  const getNotificationStats = (crewId: string) => {
    const records = notificationRecords.filter(record => record.crewId === crewId);
    const lastRecord = getLastNotification(crewId);
    
    return {
      totalSent: records.length,
      lastSentBy: lastRecord?.sentByName || null,
      lastSentAt: lastRecord?.sentAt || null,
      canSendNow: canSendNotification(crewId),
      nextAvailableIn: getTimeUntilNextNotification(crewId),
    };
  };

  const value: DocumentNotificationContextType = {
    canSendNotification,
    getLastNotification,
    recordNotification,
    getTimeUntilNextNotification,
    getAllNotificationRecords,
    getNotificationStats,
  };

  return (
    <DocumentNotificationContext.Provider value={value}>
      {children}
    </DocumentNotificationContext.Provider>
  );
};

// Helper function to format time remaining
export const formatTimeRemaining = (minutes: number): string => {
  if (minutes === 0) return 'Maintenant';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}min`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}min`;
  }
};

// Helper function to format last sent time
export const formatLastSentTime = (timestamp: string): string => {
  const sentTime = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - sentTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes}min`;
  } else if (diffInMinutes < 24 * 60) {
    const hours = Math.floor(diffInMinutes / 60);
    return `Il y a ${hours}h`;
  } else {
    const days = Math.floor(diffInMinutes / (24 * 60));
    return `Il y a ${days}j`;
  }
};