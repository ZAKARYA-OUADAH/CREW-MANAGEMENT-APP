import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { requireAuth } from "./middleware.tsx";

const missionAssignmentRoutes = new Hono();

// Assign mission to crew member (automatic after client approval)
missionAssignmentRoutes.put("/:id/assign-to-crew", requireAuth, async (c) => {
  try {
    const missionId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { assignedAt, generateContract = true } = await c.req.json();
    
    console.log(`[PUT /missions/:id/assign-to-crew] Assigning mission ${missionId} to crew`);
    
    if (userRole !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      console.log(`[PUT /missions/:id/assign-to-crew] Mission ${missionId} not found`);
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    if (mission.status !== 'approved') {
      return c.json({ error: 'Mission must be approved before assignment' }, 400);
    }
    
    if (mission.assignedToCrewAt) {
      return c.json({ error: 'Mission already assigned to crew' }, 400);
    }
    
    const now = new Date().toISOString();
    let contractGenerated = false;
    
    // Generate 0-Hour contract if needed
    let updatedContract = mission.contract;
    if (generateContract && mission.crew?.type === 'freelancer' && !mission.contract?.contractGenerated) {
      updatedContract = {
        ...mission.contract,
        contractGenerated: true,
        contractGeneratedAt: now,
        contractType: '0-hour',
        contractNumber: `CTR-${missionId}-${Date.now()}`,
        contractTerms: {
          type: '0-hour',
          description: 'Contrat zéro heure pour mission freelance',
          duration: 'Mission-specific',
          paymentTerms: mission.contract?.salaryType === 'daily' ? 'Per day' : 'Per mission',
          cancellationNotice: '24 hours',
          responsibilities: [
            'Execute assigned mission duties',
            'Maintain professional standards', 
            'Follow safety protocols',
            'Report mission completion'
          ]
        }
      };
      contractGenerated = true;
      
      console.log(`[PUT /missions/:id/assign-to-crew] Generated 0-Hour contract for mission ${missionId}`);
    }
    
    // Update mission with assignment details
    const assignedMission = {
      ...mission,
      status: 'pending_execution',
      assignedToCrewAt: assignedAt || now,
      contract: updatedContract,
      missionFlow: {
        ...mission.missionFlow,
        assignedToCrew: {
          timestamp: assignedAt || now,
          assignedBy: user.id,
          contractGenerated: contractGenerated
        }
      }
    };
    
    await kv.set(`mission:${missionId}`, assignedMission);
    
    // Create notification for crew member
    if (mission.crew?.id) {
      const notification = {
        id: `notif-${Date.now()}`,
        userId: mission.crew.id,
        type: 'success',
        title: '🎯 Mission Assignée',
        message: `Mission ${missionId} vous a été assignée. ${contractGenerated ? 'Contrat 0-heure généré.' : ''} Vous pouvez consulter votre ordre de mission temporaire.`,
        category: 'mission_assignment',
        createdAt: now,
        read: false,
        metadata: { 
          missionId,
          action: 'view_mission',
          actionUrl: `/missions/${missionId}`,
          contractGenerated
        }
      };
      
      await kv.set(`notification:${mission.crew.id}:${notification.id}`, notification);
    }
    
    console.log(`[PUT /missions/:id/assign-to-crew] Mission ${missionId} assigned to crew ${mission.crew?.name} with status pending_execution`);
    
    return c.json({ 
      mission: assignedMission,
      contractGenerated,
      message: `Mission assigned to ${mission.crew?.name}${contractGenerated ? ' with 0-Hour contract generated' : ''}`
    });
  } catch (error) {
    console.error('[PUT /missions/:id/assign-to-crew] Error assigning mission to crew:', error);
    return c.json({ error: 'Failed to assign mission to crew' }, 500);
  }
});

// Start mission execution (crew action)
missionAssignmentRoutes.put("/:id/start-execution", requireAuth, async (c) => {
  try {
    const missionId = c.req.param('id');
    const user = c.get('user');
    const { startedAt } = await c.req.json();
    
    console.log(`[PUT /missions/:id/start-execution] User ${user.id} starting mission ${missionId}`);
    
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    // Check if user has permission to start this mission
    const userRole = user.user_metadata?.role || 'freelancer';
    if (userRole !== 'admin') {
      const isCrewMember = mission.crew?.id === user.id || 
                         mission.crew?.captain?.id === user.id ||
                         mission.crew?.first_officer?.id === user.id ||
                         (mission.crew?.cabin_crew && mission.crew.cabin_crew.some(cc => cc.id === user.id));
      
      if (!isCrewMember) {
        return c.json({ error: 'Forbidden: You can only start your own missions' }, 403);
      }
    }
    
    if (mission.status !== 'pending_execution') {
      return c.json({ error: 'Mission is not pending execution' }, 400);
    }
    
    const now = new Date().toISOString();
    
    const updatedMission = {
      ...mission,
      status: 'in_progress',
      executionStartedAt: startedAt || now,
      missionFlow: {
        ...mission.missionFlow,
        executionStarted: {
          timestamp: startedAt || now,
          startedBy: user.id
        }
      }
    };
    
    await kv.set(`mission:${missionId}`, updatedMission);
    
    // Notify admin about mission start
    const adminNotification = {
      id: `notif-${Date.now()}`,
      userId: 'admin',
      type: 'info',
      title: 'Mission Started',
      message: `${mission.crew?.name || user.user_metadata?.name} has started mission ${missionId}`,
      category: 'mission',
      createdAt: now,
      read: false,
      metadata: { 
        missionId,
        startedBy: user.id,
        crewName: mission.crew?.name || user.user_metadata?.name
      }
    };
    
    await kv.set(`notification:admin:${adminNotification.id}`, adminNotification);
    
    console.log(`[PUT /missions/:id/start-execution] Mission ${missionId} started by ${user.user_metadata?.name}`);
    
    return c.json({ 
      mission: updatedMission,
      message: 'Mission execution started successfully'
    });
  } catch (error) {
    console.error('[PUT /missions/:id/start-execution] Error starting mission execution:', error);
    return c.json({ error: 'Failed to start mission execution' }, 500);
  }
});

// Complete mission execution (crew action)
missionAssignmentRoutes.put("/:id/complete-execution", requireAuth, async (c) => {
  try {
    const missionId = c.req.param('id');
    const user = c.get('user');
    const { completedAt, actualEndDate, extensionReason } = await c.req.json();
    
    console.log(`[PUT /missions/:id/complete-execution] User ${user.id} completing mission ${missionId}`);
    
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    // Check if user has permission to complete this mission
    const userRole = user.user_metadata?.role || 'freelancer';
    if (userRole !== 'admin') {
      const isCrewMember = mission.crew?.id === user.id || 
                         mission.crew?.captain?.id === user.id ||
                         mission.crew?.first_officer?.id === user.id ||
                         (mission.crew?.cabin_crew && mission.crew.cabin_crew.some(cc => cc.id === user.id));
      
      if (!isCrewMember) {
        return c.json({ error: 'Forbidden: You can only complete your own missions' }, 403);
      }
    }
    
    if (mission.status !== 'in_progress') {
      return c.json({ error: 'Mission is not in progress' }, 400);
    }
    
    const now = new Date().toISOString();
    
    // Check if mission was extended
    const originalEndDate = mission.contract?.endDate;
    const wasExtended = actualEndDate && actualEndDate !== originalEndDate;
    
    const updatedMission = {
      ...mission,
      status: 'mission_over',
      executionCompletedAt: completedAt || now,
      actualEndDate: actualEndDate || originalEndDate,
      wasExtended,
      extensionReason: wasExtended ? extensionReason : undefined,
      missionFlow: {
        ...mission.missionFlow,
        executionCompleted: {
          timestamp: completedAt || now,
          completedBy: user.id,
          actualEndDate: actualEndDate || originalEndDate,
          wasExtended,
          extensionReason
        }
      }
    };
    
    await kv.set(`mission:${missionId}`, updatedMission);
    
    // Notify crew member about next steps (validation)
    if (mission.crew?.id) {
      const crewNotification = {
        id: `notif-${Date.now()}`,
        userId: mission.crew.id,
        type: 'info',
        title: 'Mission Terminée - Validation Requise',
        message: `Mission ${missionId} terminée. Veuillez maintenant valider les détails de paiement et confirmer les dates.`,
        category: 'validation',
        createdAt: now,
        read: false,
        metadata: { 
          missionId,
          action: 'validate_mission',
          actionUrl: `/missions/${missionId}/validate`
        }
      };
      
      await kv.set(`notification:${mission.crew.id}:${crewNotification.id}`, crewNotification);
    }
    
    // Notify admin about mission completion
    const adminNotification = {
      id: `notif-${Date.now()}-admin`,
      userId: 'admin',
      type: 'success',
      title: 'Mission Completed',
      message: `${mission.crew?.name || user.user_metadata?.name} has completed mission ${missionId}${wasExtended ? ' (mission was extended)' : ''}`,
      category: 'mission',
      createdAt: now,
      read: false,
      metadata: { 
        missionId,
        completedBy: user.id,
        crewName: mission.crew?.name || user.user_metadata?.name,
        wasExtended,
        extensionReason
      }
    };
    
    await kv.set(`notification:admin:${adminNotification.id}`, adminNotification);
    
    console.log(`[PUT /missions/:id/complete-execution] Mission ${missionId} completed by ${user.user_metadata?.name}`);
    
    return c.json({ 
      mission: updatedMission,
      message: 'Mission execution completed successfully'
    });
  } catch (error) {
    console.error('[PUT /missions/:id/complete-execution] Error completing mission execution:', error);
    return c.json({ error: 'Failed to complete mission execution' }, 500);
  }
});

export default missionAssignmentRoutes;