import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  category: 'system' | 'mission' | 'profile' | 'validation' | 'admin' | 'date_modification' | 'email_pending' | 'mission_assignment';
  createdAt: string;
  read: boolean;
  userId?: string; // Added to target specific users
  metadata?: {
    missionId?: string;
    crewId?: string;
    missingFields?: string[];
    requestType?: string;
    action?: string;
    actionUrl?: string;
    originalDates?: {
      startDate: string;
      endDate: string;
    };
    newDates?: {
      startDate: string;
      endDate: string;
    };
    // Email notification specific metadata
    clientEmail?: string;
    urgencyLevel?: 'normal' | 'urgent' | 'critical';
    hoursAgo?: number;
    totalAmount?: number;
    currency?: string;
    crewName?: string;
    aircraftImmat?: string;
    // Mission assignment specific metadata
    assignmentData?: any;
    startDate?: string;
    endDate?: string;
    aircraft?: string;
    missionType?: string;
    [key: string]: any;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  showToast: (type: 'info' | 'success' | 'warning' | 'error', title: string, message?: string) => void;
  clearNotifications: () => void;
  handleNotificationAction?: (notificationId: string, action: string, data?: any) => Promise<void>;
  getNotificationsByCategory: (category: string) => Notification[];
  getUnreadEmailPendingCount: () => number;
  getUnreadMissionAssignmentCount: () => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Generate mock notifications based on user role and data
const generateMockNotifications = (userId: string, userRole: string): Notification[] => {
  const now = new Date().toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // Base notifications for all users
  let notifications: Notification[] = [
    {
      id: 'notif-system-001',
      type: 'info',
      title: 'System Update',
      message: 'The CrewOps platform has been updated with new features for mission validation.',
      category: 'system',
      createdAt: yesterday,
      read: true
    }
  ];

  // Role-specific notifications
  if (userRole === 'admin') {
    notifications.push(
      {
        id: 'notif-admin-001',
        type: 'warning',
        title: 'Pending Validations',
        message: 'There are 3 missions pending crew validation. Review required.',
        category: 'admin',
        createdAt: twoHoursAgo,
        read: false,
        metadata: {
          action: 'view_pending_validations'
        }
      },
      {
        id: 'notif-admin-002',
        type: 'info',
        title: 'New Mission Request',
        message: 'A new freelance mission has been auto-approved for Lisa Anderson.',
        category: 'mission',
        createdAt: oneHourAgo,
        read: false,
        metadata: {
          missionId: 'MO-2024-TEST-001'
        }
      },
      // Email pending notifications examples
      {
        id: 'notif-email-001',
        type: 'warning',
        title: '⚠️ Email Client en Attente',
        message: 'Mission mission-1234567890 - Email d\'approbation client en attente pour client@example.com. En attente depuis 6h.',
        category: 'email_pending',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        read: false,
        metadata: {
          missionId: 'mission-1234567890',
          clientEmail: 'client@example.com',
          urgencyLevel: 'urgent',
          hoursAgo: 6,
          totalAmount: 3500,
          currency: 'EUR',
          crewName: 'Pierre Dubois',
          aircraftImmat: 'F-HCTA',
          action: 'send_client_email',
          actionUrl: '/manage-missions?filter=pending_client_approval&highlight=mission-1234567890'
        }
      },
      {
        id: 'notif-email-002',
        type: 'error',
        title: '🚨 Email Client Urgent',
        message: 'Mission mission-0987654321 - Email d\'approbation client en attente pour urgent@client.com. En attente depuis 26h.',
        category: 'email_pending',
        createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        read: false,
        metadata: {
          missionId: 'mission-0987654321',
          clientEmail: 'urgent@client.com',
          urgencyLevel: 'critical',
          hoursAgo: 26,
          totalAmount: 4200,
          currency: 'EUR',
          crewName: 'Marie Martin',
          aircraftImmat: 'F-HCTB',
          action: 'send_client_email',
          actionUrl: '/manage-missions?filter=pending_client_approval&highlight=mission-0987654321'
        }
      },
      {
        id: 'notif-admin-date-001',
        type: 'warning',
        title: 'Demande de modification de dates',
        message: 'Lisa Anderson demande une modification des dates pour la mission MO-2024-TEST-001. Dates originales: 15-16 Jan 2025, nouvelles dates demandées: 20-21 Jan 2025.',
        category: 'date_modification',
        createdAt: oneHourAgo,
        read: false,
        metadata: {
          missionId: 'MO-2024-TEST-001',
          crewId: '4',
          originalDates: {
            startDate: '2025-01-15',
            endDate: '2025-01-16'
          },
          newDates: {
            startDate: '2025-01-20',
            endDate: '2025-01-21'
          },
          action: 'date_modification_request'
        }
      }
    );
  } else {
    // Freelancer notifications
    if (userId === '3') { // Mike Wilson
      notifications.push(
        {
          id: 'notif-crew-mike-001',
          type: 'success',
          title: 'Mission Approved',
          message: 'Your mission MO-2024-001 has been approved and is ready for execution.',
          category: 'mission',
          createdAt: yesterday,
          read: true,
          metadata: {
            missionId: 'MO-2024-001'
          }
        },
        {
          id: 'notif-crew-mike-002',
          type: 'info',
          title: 'Mission Validation Required',
          message: 'Mission MO-2024-002 requires your validation. Please review mission details and confirm your payment information.',
          category: 'validation',
          createdAt: twoHoursAgo,
          read: false,
          metadata: {
            missionId: 'MO-2024-002',
            action: 'validate_mission',
            actionUrl: '/missions/MO-2024-002/validate'
          }
        }
      );
    } else if (userId === '4') { // Lisa Anderson - TEST USER
      notifications.push(
        {
          id: 'notif-crew-lisa-001',
          type: 'success',
          title: '🎯 Nouvelle Mission Assignée',
          message: 'Mission MO-2024-TEST-001 vous a été assignée. Dates: 15/01/2025 - 16/01/2025. Veuillez consulter les détails complets.',
          category: 'mission_assignment',
          createdAt: oneHourAgo,
          read: false,
          metadata: {
            missionId: 'MO-2024-TEST-001',
            crewId: '4',
            crewName: 'Lisa Anderson',
            action: 'view_assigned_mission',
            actionUrl: '/missions/MO-2024-TEST-001',
            startDate: '2025-01-15',
            endDate: '2025-01-16',
            aircraft: 'F-HCTA',
            missionType: 'freelance',
            totalAmount: 2800,
            currency: 'EUR'
          }
        },
        {
          id: 'notif-crew-lisa-002',
          type: 'warning',
          title: 'Mission Validation Required',
          message: 'Mission MO-2024-TEST-001 is completed and requires your validation. Please review mission details and confirm your payment information.',
          category: 'validation',
          createdAt: twoHoursAgo,
          read: false,
          metadata: {
            missionId: 'MO-2024-TEST-001',
            action: 'validate_mission',
            actionUrl: '/missions/MO-2024-TEST-001/validate'
          }
        },
        {
          id: 'notif-crew-lisa-003',
          type: 'info',
          title: 'RIB Verification',
          message: 'Please verify your banking information is up to date for payment processing.',
          category: 'profile',
          createdAt: oneHourAgo,
          read: false,
          metadata: {
            action: 'update_profile'
          }
        }
      );
    } else if (userId === '2') { // Sarah Johnson
      notifications.push(
        {
          id: 'notif-crew-sarah-001',
          type: 'success',
          title: '🎯 Nouvelle Mission Assignée',
          message: 'Mission MO-2024-004 vous a été assignée. Dates: 25/01/2025 - 27/01/2025. Veuillez consulter les détails complets.',
          category: 'mission_assignment',
          createdAt: oneHourAgo,
          read: false,
          metadata: {
            missionId: 'MO-2024-004',
            crewId: '2',
            crewName: 'Sarah Johnson',
            action: 'view_assigned_mission',
            actionUrl: '/missions/MO-2024-004',
            startDate: '2025-01-25',
            endDate: '2025-01-27',
            aircraft: 'F-HCTB',
            missionType: 'service',
            totalAmount: 3200,
            currency: 'EUR'
          }
        },
        {
          id: 'notif-crew-sarah-002',
          type: 'warning',
          title: 'Mission Validation Required',
          message: 'Mission MO-2024-004 requires your validation. Please review mission details.',
          category: 'validation',
          createdAt: oneHourAgo,
          read: false,
          metadata: {
            missionId: 'MO-2024-004',
            action: 'validate_mission',
            actionUrl: '/missions/MO-2024-004/validate'
          }
        }
      );
    } else if (userId === '5') { // Paul Martin
      notifications.push(
        {
          id: 'notif-crew-paul-001',
          type: 'success',
          title: 'Mission Approved',
          message: 'Your upcoming mission MO-2024-003 has been approved.',
          category: 'mission',
          createdAt: yesterday,
          read: false,
          metadata: {
            missionId: 'MO-2024-003'
          }
        }
      );
    }
  }

  return notifications;
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize notifications based on user - use mock data only for now
  useEffect(() => {
    if (user) {
      try {
        console.log('Loading notifications for user:', user.name, 'Role:', user.role);
        const mockNotifications = generateMockNotifications(user.id, user.role);
        setNotifications(mockNotifications);
        console.log(`Loaded ${mockNotifications.length} notifications for ${user.role} user ${user.name}`);
      } catch (error) {
        console.warn('Error loading notifications, using empty state:', error);
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Listen for mission assignment events
  useEffect(() => {
    const handleMissionAssignedToCrew = (event: any) => {
      if (user && event.detail) {
        const { missionId, crewId, assignedAt, newStatus } = event.detail;
        
        // Only create notification for the specific crew member
        if (user.id === crewId) {
          const assignmentNotification: Notification = {
            id: `notif-assignment-${Date.now()}`,
            type: 'success',
            title: '🎯 Nouvelle Mission Assignée',
            message: `Mission ${missionId} vous a été assignée et est maintenant en attente d'exécution. Veuillez consulter les détails complets.`,
            category: 'mission_assignment',
            createdAt: assignedAt,
            read: false,
            metadata: {
              missionId,
              crewId,
              action: 'view_assigned_mission',
              actionUrl: `/missions/${missionId}`
            }
          };
          
          setNotifications(prev => [assignmentNotification, ...prev]);
          showToast('success', 'Nouvelle Mission', `Mission ${missionId} vous a été assignée`);
        }
      }
    };

    const handleMissionUpdate = () => {
      // Refresh notifications when missions are updated
      if (user) {
        try {
          const updatedNotifications = generateMockNotifications(user.id, user.role);
          setNotifications(updatedNotifications);
          console.log('Refreshed notifications after mission update');
        } catch (error) {
          console.warn('Error refreshing notifications:', error);
        }
      }
    };

    const handleDateModificationRequest = (event: any) => {
      // Handle new date modification requests
      if (user?.role === 'admin' && event.detail) {
        const { missionId, crewName, originalDates, newDates } = event.detail;
        const newNotification: Notification = {
          id: `notif-date-mod-${Date.now()}`,
          type: 'warning',
          title: 'Demande de modification de dates',
          message: `${crewName} demande une modification des dates pour la mission ${missionId}. Dates originales: ${originalDates.startDate} - ${originalDates.endDate}, nouvelles dates demandées: ${newDates.startDate} - ${newDates.endDate}.`,
          category: 'date_modification',
          createdAt: new Date().toISOString(),
          read: false,
          metadata: {
            missionId,
            originalDates,
            newDates,
            action: 'date_modification_request'
          }
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        showToast('warning', 'Nouvelle demande de modification', `${crewName} demande une modification de dates`);
      }
    };

    window.addEventListener('missionAssignedToCrew', handleMissionAssignedToCrew);
    window.addEventListener('missionOrderUpdated', handleMissionUpdate);
    window.addEventListener('dateModificationRequest', handleDateModificationRequest);

    return () => {
      window.removeEventListener('missionAssignedToCrew', handleMissionAssignedToCrew);
      window.removeEventListener('missionOrderUpdated', handleMissionUpdate);
      window.removeEventListener('dateModificationRequest', handleDateModificationRequest);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    // If userId is specified and doesn't match current user, don't add the notification
    if (notificationData.userId && user && notificationData.userId !== user.id) {
      console.log(`Notification targeted for user ${notificationData.userId}, current user is ${user.id} - skipping`);
      return;
    }

    const newNotification: Notification = {
      ...notificationData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast notification with special styling for different categories
    if (notificationData.category === 'email_pending') {
      const urgency = notificationData.metadata?.urgencyLevel;
      if (urgency === 'critical') {
        showToast('error', newNotification.title, newNotification.message);
      } else if (urgency === 'urgent') {
        showToast('warning', newNotification.title, newNotification.message);
      } else {
        showToast('info', newNotification.title, newNotification.message);
      }
    } else if (notificationData.category === 'mission_assignment') {
      showToast('success', newNotification.title, newNotification.message);
    } else {
      showToast(newNotification.type, newNotification.title, newNotification.message);
    }

    console.log('Added notification:', newNotification);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    console.log('Marked notification as read:', id);
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    console.log('Marked all notifications as read');
  };

  const showToast = (type: 'info' | 'success' | 'warning' | 'error', title: string, message?: string) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    
    switch (type) {
      case 'success':
        toast.success(fullMessage);
        break;
      case 'error':
        toast.error(fullMessage);
        break;
      case 'warning':
        toast.warning(fullMessage);
        break;
      case 'info':
      default:
        toast.info(fullMessage);
        break;
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    console.log('Cleared all notifications');
  };

  const getNotificationsByCategory = (category: string) => {
    return notifications.filter(n => n.category === category);
  };

  const getUnreadEmailPendingCount = () => {
    return notifications.filter(n => n.category === 'email_pending' && !n.read).length;
  };

  const getUnreadMissionAssignmentCount = () => {
    return notifications.filter(n => n.category === 'mission_assignment' && !n.read).length;
  };

  const handleNotificationAction = async (notificationId: string, action: string, data?: any) => {
    try {
      console.log('Handling notification action:', action, 'for notification:', notificationId, 'with data:', data);
      
      // Import apiClient here to avoid circular dependency
      const { apiClient } = await import('../utils/supabase/client');
      
      // Call the backend API to handle the notification action
      const result = await apiClient.handleNotificationAction(notificationId, action, data);
      
      if (result.success) {
        if (action === 'approve') {
          showToast('success', 'Modification approuvée', 'Les nouvelles dates ont été validées');
        } else if (action === 'reject') {
          showToast('info', 'Modification contestée', 'La demande a été renvoyée à l\'équipage');
        }
        
        // Remove the notification from the local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Dispatch event to update mission lists
        window.dispatchEvent(new CustomEvent('missionOrderUpdated'));
      } else {
        showToast('error', 'Erreur', 'Impossible de traiter la demande');
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
      showToast('error', 'Erreur', 'Une erreur est survenue lors du traitement de la demande');
    }
  };

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    showToast,
    clearNotifications,
    handleNotificationAction,
    getNotificationsByCategory,
    getUnreadEmailPendingCount,
    getUnreadMissionAssignmentCount
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};