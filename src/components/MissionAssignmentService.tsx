import { useEffect } from 'react';
import { useNotifications } from './NotificationContext';
import { useAllMissionOrders } from './MissionOrderService';
import { useAuth } from './AuthProvider';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import type { MissionOrder, MissionAssignmentNotification } from './MissionOrderTypes';

// Service to handle automatic mission assignment after client approval
export const useMissionAssignmentService = () => {
  const { user } = useAuth();
  const { missionOrders } = useAllMissionOrders();
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Only run for admin users to avoid duplicate processing
    if (!user || user.role !== 'admin') return;

    // Check for missions that have been approved by client and need assignment
    const checkForNewlyApprovedMissions = async () => {
      const newlyApprovedMissions = missionOrders.filter(mission => {
        // Find missions that are 'approved' but haven't been assigned to crew yet
        return (
          mission.status === 'approved' &&
          !mission.assignedToCrewAt &&
          mission.crew?.id  // Make sure there's a crew assigned
        );
      });

      console.log(`[MissionAssignmentService] Found ${newlyApprovedMissions.length} newly approved missions to assign`);

      for (const mission of newlyApprovedMissions) {
        await assignMissionToCrew(mission);
      }
    };

    // Run initial check
    checkForNewlyApprovedMissions();

    // Set up periodic checking (every 30 seconds for better real-time feel)
    const intervalId = setInterval(checkForNewlyApprovedMissions, 30 * 1000);

    return () => clearInterval(intervalId);
  }, [missionOrders, user, addNotification]);

  const assignMissionToCrew = async (mission: MissionOrder) => {
    try {
      console.log(`[MissionAssignmentService] Auto-assigning mission ${mission.id} to crew ${mission.crew.name}`);

      // Call Supabase API to update mission status and generate contract if needed
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${mission.id}/assign-to-crew`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          assignedAt: new Date().toISOString(),
          generateContract: !mission.contract?.contractGenerated // Generate contract if not already done
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.mission) {
        // Create assignment notification for the crew member
        const assignmentNotification: MissionAssignmentNotification = {
          missionId: mission.id,
          crewId: mission.crew.id,
          crewName: mission.crew.name,
          assignedAt: new Date().toISOString(),
          missionDetails: {
            type: mission.type,
            startDate: mission.contract.startDate,
            endDate: mission.contract.endDate,
            aircraft: mission.aircraft.immat,
            clientName: mission.emailData?.ownerEmail || 'Client',
            location: mission.flights.length > 0 ? 
              `${mission.flights[0].departure} → ${mission.flights[mission.flights.length - 1].arrival}` : 
              'TBD',
            totalAmount: mission.emailData?.fees?.totalWithMargin,
            currency: mission.emailData?.fees?.currency || 'EUR'
          }
        };

        // Add notification for the specific crew member
        addNotification({
          type: 'success',
          title: '🎯 Nouvelle Mission Assignée',
          message: `Mission ${mission.id} vous a été assignée suite à l'approbation client. Dates: ${formatDateRange(mission.contract.startDate, mission.contract.endDate)}. Vous pouvez maintenant consulter votre ordre de mission temporaire.`,
          category: 'mission_assignment',
          userId: mission.crew.id, // Target specific crew member
          metadata: {
            missionId: mission.id,
            crewId: mission.crew.id,
            crewName: mission.crew.name,
            action: 'view_assigned_mission',
            actionUrl: `/missions/${mission.id}`,
            assignmentData: assignmentNotification,
            // Mission details for quick reference
            startDate: mission.contract.startDate,
            endDate: mission.contract.endDate,
            aircraft: mission.aircraft.immat,
            missionType: mission.type,
            totalAmount: mission.emailData?.fees?.totalWithMargin,
            currency: mission.emailData?.fees?.currency || 'EUR'
          }
        });

        // Dispatch custom event to update mission status across all components
        const updateEvent = new CustomEvent('missionAssignedToCrew', {
          detail: {
            missionId: mission.id,
            crewId: mission.crew.id,
            assignedAt: new Date().toISOString(),
            newStatus: 'pending_execution',
            contractGenerated: result.contractGenerated
          }
        });
        window.dispatchEvent(updateEvent);

        console.log(`✅ [MissionAssignmentService] Mission ${mission.id} successfully assigned to ${mission.crew.name}`);

        if (result.contractGenerated) {
          console.log(`✅ [MissionAssignmentService] 0-Hour contract generated for mission ${mission.id}`);
        }
      }

    } catch (error) {
      console.error('[MissionAssignmentService] Error auto-assigning mission to crew:', error);
      
      // Show error notification to admin
      addNotification({
        type: 'error',
        title: 'Erreur d\'assignation',
        message: `Erreur lors de l'assignation de la mission ${mission.id} à ${mission.crew.name}. Veuillez réessayer manuellement.`,
        category: 'system',
        metadata: {
          missionId: mission.id,
          error: error.message
        }
      });
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    if (start.toDateString() === end.toDateString()) {
      return formatDate(start);
    }
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return {
    assignMissionToCrew
  };
};

// Component wrapper for the service
export const MissionAssignmentService: React.FC = () => {
  useMissionAssignmentService();
  return null;
};

export default MissionAssignmentService;