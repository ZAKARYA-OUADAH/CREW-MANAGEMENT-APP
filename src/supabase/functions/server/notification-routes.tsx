import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { requireAuth } from "./middleware.tsx";

const notificationRoutes = new Hono();

// Get user notifications
notificationRoutes.get("/", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const notifications = await kv.getByPrefix(`notification:${user.id}:`) || [];
    
    // Sort by creation date, newest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// Mark notification as read
notificationRoutes.put("/:id/read", requireAuth, async (c) => {
  try {
    const notificationId = c.req.param('id');
    const user = c.get('user');
    
    const notification = await kv.get(`notification:${user.id}:${notificationId}`);
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    
    const updatedNotification = {
      ...notification,
      read: true,
      readAt: new Date().toISOString()
    };
    
    await kv.set(`notification:${user.id}:${notificationId}`, updatedNotification);
    
    return c.json({ notification: updatedNotification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({ error: 'Failed to update notification' }, 500);
  }
});

// Handle notification actions (approve/reject date modifications)
notificationRoutes.post("/:id/action", requireAuth, async (c) => {
  try {
    const notificationId = c.req.param('id');
    const user = c.get('user');
    const { action, data } = await c.req.json();
    
    // Only admins can perform notification actions
    if (user.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }
    
    const notification = await kv.get(`notification:${user.id}:${notificationId}`);
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    
    if (notification.category !== 'date_modification') {
      return c.json({ error: 'Invalid notification type for this action' }, 400);
    }
    
    const missionId = data?.missionId || notification.metadata?.missionId;
    
    if (!missionId) {
      return c.json({ error: 'Mission ID not found' }, 400);
    }
    
    // Get the mission order
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    if (action === 'approve') {
      // Apply the date modification
      const updatedMission = {
        ...mission,
        contract: {
          ...mission.contract,
          startDate: notification.metadata.newDates.startDate,
          endDate: notification.metadata.newDates.endDate
        },
        status: 'validated',
        validatedAt: new Date().toISOString(),
        validatedBy: user.id,
        dateModificationApprovedBy: user.id,
        dateModificationApprovedAt: new Date().toISOString()
      };
      
      await kv.set(`mission:${missionId}`, updatedMission);
      
      // Create success notification for the crew member
      const crewNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'success',
        title: 'Modification de dates approuvée',
        message: `Votre demande de modification des dates pour la mission ${missionId} a été approuvée. Nouvelles dates: ${notification.metadata.newDates.startDate} - ${notification.metadata.newDates.endDate}`,
        category: 'mission',
        createdAt: new Date().toISOString(),
        read: false,
        metadata: {
          missionId,
          action: 'date_modification_approved',
          originalDates: notification.metadata.originalDates,
          approvedDates: notification.metadata.newDates
        }
      };
      
      await kv.set(`notification:${mission.crew.id}:${crewNotification.id}`, crewNotification);
      
    } else if (action === 'reject') {
      // Reject the date modification - mission stays in pending_date_modification status
      const updatedMission = {
        ...mission,
        status: 'pending_date_modification',
        dateModificationRejectedBy: user.id,
        dateModificationRejectedAt: new Date().toISOString()
      };
      
      await kv.set(`mission:${missionId}`, updatedMission);
      
      // Create notification for the crew member about rejection
      const crewNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'warning',
        title: 'Modification de dates contestée',
        message: `Votre demande de modification des dates pour la mission ${missionId} a été contestée. Veuillez contacter l'administration pour clarification.`,
        category: 'mission',
        createdAt: new Date().toISOString(),
        read: false,
        metadata: {
          missionId,
          action: 'date_modification_rejected',
          requestedDates: notification.metadata.newDates
        }
      };
      
      await kv.set(`notification:${mission.crew.id}:${crewNotification.id}`, crewNotification);
    } else {
      return c.json({ error: 'Invalid action' }, 400);
    }
    
    // Mark the original notification as read and processed
    const updatedNotification = {
      ...notification,
      read: true,
      readAt: new Date().toISOString(),
      actionTaken: action,
      actionTakenBy: user.id,
      actionTakenAt: new Date().toISOString()
    };
    
    await kv.set(`notification:${user.id}:${notificationId}`, updatedNotification);
    
    return c.json({ 
      success: true, 
      action,
      notification: updatedNotification,
      message: action === 'approve' ? 'Date modification approved' : 'Date modification rejected'
    });
    
  } catch (error) {
    console.error('Error handling notification action:', error);
    return c.json({ error: 'Failed to process notification action' }, 500);
  }
});

// Send date modification request (from crew to admin)
notificationRoutes.post("/date-modification-request", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { missionId, originalDates, newDates, reason } = await c.req.json();
    
    if (!missionId || !originalDates || !newDates || !reason) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Get the mission to verify access
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    if (mission.crew.id !== user.id) {
      return c.json({ error: 'Unauthorized - Not your mission' }, 403);
    }
    
    // Get all admin users to send notifications
    const admins = await kv.getByPrefix('user:') || [];
    const adminUsers = admins.filter(u => u.role === 'admin');
    
    // Create notifications for all admins
    const notifications = adminUsers.map(admin => {
      const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: notificationId,
        type: 'warning',
        title: 'Demande de modification de dates',
        message: `${user.name} demande une modification des dates pour la mission ${missionId}. Dates originales: ${originalDates.startDate} - ${originalDates.endDate}, nouvelles dates demandées: ${newDates.startDate} - ${newDates.endDate}. Motif: ${reason}`,
        category: 'date_modification',
        createdAt: new Date().toISOString(),
        read: false,
        metadata: {
          missionId,
          crewId: user.id,
          originalDates,
          newDates,
          reason,
          action: 'date_modification_request'
        }
      };
    });
    
    // Save all notifications
    for (const admin of adminUsers) {
      const notification = notifications.find(n => true); // Get a notification for this admin
      if (notification) {
        await kv.set(`notification:${admin.id}:${notification.id}`, notification);
      }
    }
    
    // Update mission status
    const updatedMission = {
      ...mission,
      status: 'pending_date_modification',
      dateModificationRequestedAt: new Date().toISOString(),
      dateModificationRequestedBy: user.id
    };
    
    await kv.set(`mission:${missionId}`, updatedMission);
    
    return c.json({ 
      success: true, 
      message: 'Date modification request sent to administrators',
      notificationsSent: notifications.length
    });
    
  } catch (error) {
    console.error('Error sending date modification request:', error);
    return c.json({ error: 'Failed to send date modification request' }, 500);
  }
});

export default notificationRoutes;