import { useEffect } from 'react';
import { useAllMissionOrders } from './MissionOrderService';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthProvider';

export interface EmailPendingNotification {
  missionId: string;
  clientEmail: string;
  missionDetails: {
    crewName: string;
    aircraftImmat: string;
    totalAmount: number;
    currency: string;
  };
  timeSinceGenerated: number; // in hours
  urgencyLevel: 'normal' | 'urgent' | 'critical';
}

// Service to monitor missions that need email sending
export const useEmailNotificationService = () => {
  const { user } = useAuth();
  const { missionOrders } = useAllMissionOrders();
  const { addNotification, notifications } = useNotifications();

  useEffect(() => {
    // Only run for admin users
    if (!user || user.role !== 'admin') return;

    // Check for missions in pending_client_approval status that need email alerts
    const checkEmailPendingMissions = () => {
      const pendingClientApprovalMissions = missionOrders.filter(
        mission => mission.status === 'pending_client_approval'
      );

      pendingClientApprovalMissions.forEach(mission => {
        if (!mission.emailData?.ownerEmail) return;

        // Calculate time since mission moved to pending_client_approval status
        const statusChangedAt = mission.ownerApprovedAt || mission.financeApprovedAt || mission.createdAt;
        const hoursAgo = statusChangedAt 
          ? Math.floor((Date.now() - new Date(statusChangedAt).getTime()) / (1000 * 60 * 60))
          : 0;

        // Determine urgency based on how long the email has been pending
        let urgencyLevel: 'normal' | 'urgent' | 'critical' = 'normal';
        if (hoursAgo >= 24) urgencyLevel = 'critical';
        else if (hoursAgo >= 8) urgencyLevel = 'urgent';

        // Check if we already have a notification for this mission
        const existingEmailNotification = notifications.find(
          n => n.category === 'email_pending' && 
               n.metadata?.missionId === mission.id &&
               !n.read
        );

        // Don't create duplicate notifications unless urgency has increased
        if (existingEmailNotification) {
          const existingUrgency = existingEmailNotification.metadata?.urgencyLevel || 'normal';
          if (urgencyLevel <= existingUrgency) return;
        }

        // Create notification based on urgency
        const notificationData = {
          type: urgencyLevel === 'critical' ? 'error' as const : 
                urgencyLevel === 'urgent' ? 'warning' as const : 'info' as const,
          title: urgencyLevel === 'critical' ? '🚨 Email Client Urgent' :
                 urgencyLevel === 'urgent' ? '⚠️ Email Client en Attente' : 
                 '📧 Email Client à Envoyer',
          message: `Mission ${mission.id} - Email d'approbation client en attente pour ${mission.emailData.ownerEmail}. ${
            hoursAgo > 0 ? `En attente depuis ${hoursAgo}h.` : 'Vient d\'être généré.'
          }`,
          category: 'email_pending' as const,
          metadata: {
            missionId: mission.id,
            clientEmail: mission.emailData.ownerEmail,
            urgencyLevel,
            hoursAgo,
            totalAmount: mission.emailData.fees?.totalWithMargin || 0,
            currency: mission.emailData.fees?.currency || 'EUR',
            crewName: mission.crew?.name || 'Unknown',
            aircraftImmat: mission.aircraft?.immat || 'Unknown',
            action: 'send_client_email',
            actionUrl: `/manage-missions?filter=pending_client_approval&highlight=${mission.id}`
          }
        };

        addNotification(notificationData);
      });
    };

    // Run initial check
    checkEmailPendingMissions();

    // Set up periodic checking (every 30 minutes)
    const intervalId = setInterval(checkEmailPendingMissions, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [missionOrders, user, addNotification, notifications]);

  // Return email pending statistics
  const getEmailPendingStats = () => {
    if (!user || user.role !== 'admin') return null;

    const pendingEmails = missionOrders.filter(
      mission => mission.status === 'pending_client_approval'
    );

    const stats = {
      total: pendingEmails.length,
      urgent: 0,
      critical: 0,
      missions: pendingEmails.map(mission => {
        const statusChangedAt = mission.ownerApprovedAt || mission.financeApprovedAt || mission.createdAt;
        const hoursAgo = statusChangedAt 
          ? Math.floor((Date.now() - new Date(statusChangedAt).getTime()) / (1000 * 60 * 60))
          : 0;

        let urgencyLevel: 'normal' | 'urgent' | 'critical' = 'normal';
        if (hoursAgo >= 24) urgencyLevel = 'critical';
        else if (hoursAgo >= 8) urgencyLevel = 'urgent';

        if (urgencyLevel === 'urgent') stats.urgent++;
        if (urgencyLevel === 'critical') stats.critical++;

        return {
          missionId: mission.id,
          clientEmail: mission.emailData?.ownerEmail,
          hoursAgo,
          urgencyLevel,
          crewName: mission.crew?.name,
          totalAmount: mission.emailData?.fees?.totalWithMargin || 0
        };
      })
    };

    return stats;
  };

  return {
    getEmailPendingStats
  };
};

// Component to wrap the service
export const EmailNotificationService: React.FC = () => {
  useEmailNotificationService();
  return null;
};

export default EmailNotificationService;