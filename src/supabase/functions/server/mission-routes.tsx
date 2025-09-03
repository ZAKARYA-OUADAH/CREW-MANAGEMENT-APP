import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { requireAuth } from "./middleware.tsx";

const missionRoutes = new Hono();

// Get missions
missionRoutes.get("/", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    console.log(`[GET /missions] User ${user.id} (${userRole}) requesting missions`);
    
    // Get all mission orders
    const allMissions = await kv.getByPrefix('mission:') || [];
    console.log(`[GET /missions] Found ${allMissions.length} total missions in database`);
    
    let missions = allMissions;
    
    // Filter by user if not admin
    if (userRole !== 'admin') {
      missions = allMissions.filter(mission => {
        // Check if user is in crew
        const isInCrew = mission.crew?.id === user.id || 
                        mission.crew?.captain?.id === user.id ||
                        mission.crew?.first_officer?.id === user.id ||
                        (mission.crew?.cabin_crew && mission.crew.cabin_crew.some(cc => cc.id === user.id));
        return isInCrew;
      });
      console.log(`[GET /missions] Filtered to ${missions.length} missions for user ${user.id}`);
    }
    
    return c.json({ missions });
  } catch (error) {
    console.error('[GET /missions] Error fetching missions:', error);
    return c.json({ error: 'Failed to fetch missions' }, 500);
  }
});

// Create mission - direct approval with email data
missionRoutes.post("/", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    if (userRole !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const missionData = await c.req.json();
    const missionId = `MO-${Date.now()}`;
    const now = new Date().toISOString();
    
    console.log(`[POST /missions] Creating mission ${missionId} by user ${user.id}`);
    
    // Get status from mission data
    // If email data is included, mission should be pending client approval
    const missionStatus = missionData.status || (missionData.emailData ? 'pending_client_approval' : 'pending_approval');
    
    // Enhance mission data with provisional order information
    const enhancedMissionData = {
      ...missionData,
      isProvisionalOrder: missionStatus !== 'approved', // Not provisional if approved directly
      contract: {
        ...missionData.contract,
        additionalNotes: missionStatus === 'approved' ? missionData.contract?.additionalNotes :
          missionData.contract?.additionalNotes ? 
            `${missionData.contract.additionalNotes}\n\nORDRE PROVISOIRE - Les dates et la durée peuvent être modifiées selon la durée réelle de la mission.` :
            'ORDRE PROVISOIRE - Les dates et la durée peuvent être modifiées selon la durée réelle de la mission.'
      }
    };

    // Add email sent timestamp if email data is present
    if (enhancedMissionData.emailData) {
      enhancedMissionData.emailData = {
        ...enhancedMissionData.emailData,
        sentAt: now // Mark when email was sent
      };
    }

    // Create mission with appropriate status
    const mission = {
      id: missionId,
      ...enhancedMissionData,
      createdAt: now,
      status: missionStatus,
      createdBy: user.id,
      ...(missionStatus === 'approved' && {
        approvedAt: now,
        approver: {
          id: user.id,
          name: user.user_metadata?.name || 'Admin',
          email: user.email,
          date: now
        }
      })
    };
    
    await kv.set(`mission:${missionId}`, mission);
    console.log(`[POST /missions] Mission ${missionId} created with status: ${missionStatus}`);
    
    // Don't notify crew if mission is pending client approval
    // Notification will be sent after client approval/rejection
    if (missionStatus === 'approved' && mission.crew?.id) {
      const notification = {
        id: `notif-${Date.now()}`,
        userId: mission.crew.id,
        type: 'success',
        title: 'Mission Approved',
        message: `Mission ${missionId} has been created and approved. Email prepared for owner notification.`,
        category: 'mission',
        createdAt: now,
        read: false,
        metadata: { 
          missionId,
          ownerEmail: mission.emailData?.ownerEmail,
          totalAmount: mission.emailData?.fees?.totalWithMargin
        }
      };
      
      await kv.set(`notification:${mission.crew.id}:${notification.id}`, notification);
    }
    
    // Log email data if present
    if (mission.emailData) {
      console.log('[POST /missions] Mission created with email data:', {
        ownerEmail: mission.emailData.ownerEmail,
        totalAmount: mission.emailData.fees?.totalWithMargin,
        margin: mission.emailData.fees?.margin
      });
    }
    
    return c.json({ mission });
  } catch (error) {
    console.error('[POST /missions] Error creating mission:', error);
    return c.json({ error: 'Failed to create mission' }, 500);
  }
});

// Check for missions that need validation
missionRoutes.post("/check-validation", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    if (userRole !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    console.log(`[POST /check-validation] User ${user.id} checking missions for validation`);
    
    // Get all approved missions
    const allMissions = await kv.getByPrefix('mission:') || [];
    const approvedMissions = allMissions.filter(mission => mission.status === 'approved');
    
    console.log(`[POST /check-validation] Found ${approvedMissions.length} approved missions to check`);
    
    const now = new Date();
    let updated = 0;
    
    for (const mission of approvedMissions) {
      if (mission.contract?.endDate) {
        const endDate = new Date(mission.contract.endDate);
        // Add one day buffer to ensure mission is truly completed
        endDate.setHours(23, 59, 59, 999);
        
        if (now > endDate) {
          // Mission is completed, move to pending_validation
          const updatedMission = {
            ...mission,
            status: 'pending_validation',
            completedAt: mission.completedAt || endDate.toISOString(),
            validationRequestedAt: now.toISOString(),
            validation: {
              requestedAt: now.toISOString()
            }
          };
          
          await kv.set(`mission:${mission.id}`, updatedMission);
          
          // Create notification for crew member
          if (mission.crew?.id) {
            const notification = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              userId: mission.crew.id,
              type: 'info',
              title: 'Mission Validation Required',
              message: `Mission ${mission.id} requires your validation. Please review mission details and confirm your payment information.`,
              category: 'validation',
              createdAt: now.toISOString(),
              read: false,
              metadata: { 
                missionId: mission.id,
                action: 'validate_mission',
                actionUrl: `/missions/${mission.id}/validate`
              }
            };
            
            await kv.set(`notification:${mission.crew.id}:${notification.id}`, notification);
          }
          
          updated++;
          console.log(`[POST /check-validation] Mission ${mission.id} moved to pending_validation status`);
        }
      }
    }
    
    return c.json({ 
      message: `${updated} missions moved to pending validation`,
      updated 
    });
  } catch (error) {
    console.error('[POST /check-validation] Error checking missions for validation:', error);
    return c.json({ error: 'Failed to check missions for validation' }, 500);
  }
});

// Get single mission
missionRoutes.get("/:id", requireAuth, async (c) => {
  try {
    const missionId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    console.log(`[GET /missions/:id] User ${user.id} (${userRole}) requesting mission ${missionId}`);
    
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      console.log(`[GET /missions/:id] Mission ${missionId} not found in database`);
      
      // Debug: List all mission keys to help troubleshoot
      const allMissions = await kv.getByPrefix('mission:') || [];
      const missionKeys = allMissions.map(m => m.id || 'undefined-id');
      console.log(`[GET /missions/:id] Available mission IDs: ${missionKeys.join(', ')}`);
      
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    // Check access rights
    if (userRole !== 'admin') {
      const isInCrew = mission.crew?.id === user.id || 
                      mission.crew?.captain?.id === user.id ||
                      mission.crew?.first_officer?.id === user.id ||
                      (mission.crew?.cabin_crew && mission.crew.cabin_crew.some(cc => cc.id === user.id));
      
      if (!isInCrew) {
        console.log(`[GET /missions/:id] User ${user.id} denied access to mission ${missionId}`);
        return c.json({ error: 'Forbidden: Access denied' }, 403);
      }
    }
    
    console.log(`[GET /missions/:id] Mission ${missionId} found and access granted`);
    return c.json({ mission });
  } catch (error) {
    console.error(`[GET /missions/:id] Error fetching mission:`, error);
    return c.json({ error: 'Failed to fetch mission' }, 500);
  }
});

// Approve mission - now main approval route
missionRoutes.put("/:id/approve", requireAuth, async (c) => {
  try {
    const missionId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const approvalData = await c.req.json() || {};
    
    console.log(`[PUT /missions/:id/approve] User ${user.id} (${userRole}) approving mission ${missionId}`);
    
    if (userRole !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      console.log(`[PUT /missions/:id/approve] Mission ${missionId} not found in database`);
      
      // Debug: List all mission keys to help troubleshoot
      const allMissions = await kv.getByPrefix('mission:') || [];
      const missionKeys = allMissions.map(m => m.id || 'undefined-id');
      console.log(`[PUT /missions/:id/approve] Available mission IDs: ${missionKeys.join(', ')}`);
      
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    // Only approve if not already approved
    if (mission.status === 'approved') {
      console.log(`[PUT /missions/:id/approve] Mission ${missionId} already approved`);
      return c.json({ message: 'Mission already approved', mission });
    }
    
    const now = new Date().toISOString();
    const approvedMission = {
      ...mission,
      status: 'approved',
      approvedAt: now,
      approver: {
        id: user.id,
        name: user.user_metadata?.name || 'Admin',
        email: user.email,
        date: now
      },
      emailData: approvalData.emailData // Store email data for PDF generation
    };
    
    await kv.set(`mission:${missionId}`, approvedMission);
    
    // Create notification for crew member
    if (mission.crew?.id) {
      const notification = {
        id: `notif-${Date.now()}`,
        userId: mission.crew.id,
        type: 'success',
        title: 'Mission Approved',
        message: `Mission ${missionId} has been approved and sent to the owner`,
        category: 'mission',
        createdAt: now,
        read: false,
        metadata: { missionId }
      };
      
      await kv.set(`notification:${mission.crew.id}:${notification.id}`, notification);
    }
    
    console.log(`[PUT /missions/:id/approve] Mission ${missionId} approved and email data stored`);
    
    // TODO: In production, implement actual PDF generation and email sending here
    // For now, we just log the email data
    if (approvalData.emailData) {
      console.log('[PUT /missions/:id/approve] Email data for PDF generation:', {
        ownerEmail: approvalData.emailData.ownerEmail,
        subject: approvalData.emailData.subject,
        fees: approvalData.emailData.fees,
        missionId: missionId
      });
      
      // Simulate PDF generation
      console.log('[PUT /missions/:id/approve] Generated PDF with mission details and fees:', approvalData.emailData.fees);
      console.log('[PUT /missions/:id/approve] Email sent to:', approvalData.emailData.ownerEmail);
    }
    
    return c.json({ 
      mission: approvedMission,
      message: 'Mission approved, PDF generated, and email sent to owner'
    });
  } catch (error) {
    console.error('[PUT /missions/:id/approve] Error approving mission:', error);
    return c.json({ error: 'Failed to approve mission' }, 500);
  }
});

// Reject mission
missionRoutes.put("/:id/reject", requireAuth, async (c) => {
  try {
    const missionId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { reason } = await c.req.json();
    
    console.log(`[PUT /missions/:id/reject] User ${user.id} (${userRole}) rejecting mission ${missionId}`);
    
    if (userRole !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      console.log(`[PUT /missions/:id/reject] Mission ${missionId} not found in database`);
      
      // Debug: List all mission keys to help troubleshoot
      const allMissions = await kv.getByPrefix('mission:') || [];
      const missionKeys = allMissions.map(m => m.id || 'undefined-id');
      console.log(`[PUT /missions/:id/reject] Available mission IDs: ${missionKeys.join(', ')}`);
      
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    const rejectedMission = {
      ...mission,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
      rejectedBy: {
        id: user.id,
        name: user.user_metadata?.name || 'Admin',
        email: user.email
      }
    };
    
    await kv.set(`mission:${missionId}`, rejectedMission);
    
    // Create notification for crew member
    if (mission.crew?.id) {
      const notification = {
        id: `notif-${Date.now()}`,
        userId: mission.crew.id,
        type: 'error',
        title: 'Mission Rejected',
        message: `Mission ${missionId} has been rejected: ${reason}`,
        category: 'mission',
        createdAt: new Date().toISOString(),
        read: false,
        metadata: { missionId }
      };
      
      await kv.set(`notification:${mission.crew.id}:${notification.id}`, notification);
    }
    
    console.log(`[PUT /missions/:id/reject] Mission ${missionId} rejected: ${reason}`);
    return c.json({ mission: rejectedMission });
  } catch (error) {
    console.error('[PUT /missions/:id/reject] Error rejecting mission:', error);
    return c.json({ error: 'Failed to reject mission' }, 500);
  }
});

// Validate mission
missionRoutes.put("/:id/validate", requireAuth, async (c) => {
  try {
    const missionId = c.req.param('id');
    const user = c.get('user');
    const validationData = await c.req.json();
    
    console.log(`[PUT /missions/:id/validate] User ${user.id} validating mission ${missionId}`);
    
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      console.log(`[PUT /missions/:id/validate] Mission ${missionId} not found in database`);
      
      // Debug: List all mission keys to help troubleshoot
      const allMissions = await kv.getByPrefix('mission:') || [];
      const missionKeys = allMissions.map(m => m.id || 'undefined-id');
      console.log(`[PUT /missions/:id/validate] Available mission IDs: ${missionKeys.join(', ')}`);
      
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    console.log(`[PUT /missions/:id/validate] Mission ${missionId} current status: ${mission.status}`);
    
    // Check if user has permission to validate this mission
    const userRole = user.user_metadata?.role || 'freelancer';
    if (userRole !== 'admin') {
      const isInCrew = mission.crew?.id === user.id || 
                      mission.crew?.captain?.id === user.id ||
                      mission.crew?.first_officer?.id === user.id ||
                      (mission.crew?.cabin_crew && mission.crew.cabin_crew.some(cc => cc.id === user.id));
      
      if (!isInCrew) {
        return c.json({ error: 'Forbidden: You can only validate your own missions' }, 403);
      }
    }
    
    if (mission.status !== 'pending_validation' && mission.status !== 'pending_date_modification') {
      return c.json({ error: `Mission is not in a validatable status. Current status: ${mission.status}` }, 400);
    }
    
    const now = new Date().toISOString();
    
    // Check if there's a date modification request
    let missionStatus = 'validated';
    let dateModificationRequest = null;
    
    if (validationData.dateModification) {
      missionStatus = 'pending_date_modification';
      dateModificationRequest = {
        requestedAt: now,
        originalStartDate: validationData.dateModification.originalStartDate,
        originalEndDate: validationData.dateModification.originalEndDate,
        newStartDate: validationData.dateModification.newStartDate,
        newEndDate: validationData.dateModification.newEndDate,
        reason: validationData.dateModification.reason,
        status: 'pending'
      };
    }

    // Handle service invoice data for service missions
    let serviceInvoiceData = null;
    if (mission.type === 'service' && validationData.serviceInvoice) {
      serviceInvoiceData = {
        lines: validationData.serviceInvoice.lines,
        subtotal: validationData.serviceInvoice.subtotal,
        taxRate: validationData.serviceInvoice.taxRate,
        taxAmount: validationData.serviceInvoice.taxAmount,
        total: validationData.serviceInvoice.total,
        currency: validationData.serviceInvoice.currency,
        notes: validationData.serviceInvoice.notes,
        invoiceNumber: validationData.serviceInvoice.invoiceNumber,
        invoiceDate: validationData.serviceInvoice.invoiceDate,
        vatNumber: validationData.serviceInvoice.vatNumber,
        externalInvoiceFile: validationData.serviceInvoice.externalInvoiceFile ? {
          name: validationData.serviceInvoice.externalInvoiceFile.name,
          size: validationData.serviceInvoice.externalInvoiceFile.size,
          type: validationData.serviceInvoice.externalInvoiceFile.type,
          uploadedAt: now
        } : undefined
      };
    }

    // Update mission with validation data
    const validatedMission = {
      ...mission,
      status: missionStatus,
      validatedAt: now,
      dateModificationRequestedAt: dateModificationRequest ? now : undefined,
      validation: {
        ...mission.validation,
        validatedAt: now,
        crewComments: validationData.crewComments,
        ribConfirmed: validationData.ribConfirmed,
        issuesReported: validationData.issuesReported || [],
        paymentIssue: validationData.paymentIssue || false,
        paymentIssueDetails: validationData.paymentIssueDetails,
        newRIB: validationData.newRIB
      },
      serviceInvoice: serviceInvoiceData,
      dateModification: dateModificationRequest
    };
    
    await kv.set(`mission:${missionId}`, validatedMission);
    
    // Handle RIB update if provided
    if (validationData.newRIB) {
      const ribUpdateRequest = {
        id: `rib-${Date.now()}`,
        userId: user.id,
        missionId: missionId,
        currentRIB: validationData.currentRIB,
        newRIB: validationData.newRIB,
        requestedAt: now,
        status: 'pending',
        reason: 'Mission validation RIB update'
      };
      
      await kv.set(`rib_update:${ribUpdateRequest.id}`, ribUpdateRequest);
      
      // Notify admin about RIB update request
      const adminNotification = {
        id: `notif-${Date.now()}`,
        userId: 'admin', // This would be actual admin user IDs in production
        type: 'info',
        title: 'RIB Update Request',
        message: `${user.user_metadata?.name || user.email} has requested a RIB update for mission ${missionId}`,
        category: 'admin',
        createdAt: now,
        read: false,
        metadata: { 
          ribUpdateId: ribUpdateRequest.id,
          missionId: missionId,
          userId: user.id
        }
      };
      
      await kv.set(`notification:admin:${adminNotification.id}`, adminNotification);
    }
    
    // Handle payment issues if reported
    if (validationData.paymentIssue) {
      const paymentIssue = {
        id: `issue-${Date.now()}`,
        userId: user.id,
        missionId: missionId,
        description: validationData.paymentIssueDetails,
        reportedAt: now,
        status: 'open',
        priority: 'high'
      };
      
      await kv.set(`payment_issue:${paymentIssue.id}`, paymentIssue);
      
      // Notify admin about payment issue
      const adminNotification = {
        id: `notif-${Date.now()}-payment`,
        userId: 'admin',
        type: 'warning',
        title: 'Payment Issue Reported',
        message: `${user.user_metadata?.name || user.email} reported a payment issue for mission ${missionId}`,
        category: 'admin',
        createdAt: now,
        read: false,
        metadata: { 
          paymentIssueId: paymentIssue.id,
          missionId: missionId,
          userId: user.id
        }
      };
      
      await kv.set(`notification:admin:${adminNotification.id}`, adminNotification);
    }
    
    // Handle date modification request if present
    if (dateModificationRequest) {
      // Create notification for admin about date modification
      const adminNotification = {
        id: `notif-${Date.now()}-date-mod-admin`,
        userId: 'admin',
        type: 'info',
        title: 'Date Modification Request',
        message: `${user.user_metadata?.name || user.email} has requested date modification during validation of mission ${missionId}`,
        category: 'admin',
        createdAt: now,
        read: false,
        metadata: { 
          missionId: missionId,
          userId: user.id,
          action: 'review_date_modification',
          actionUrl: `/admin/missions/${missionId}/date-modification`
        }
      };
      
      await kv.set(`notification:admin:${adminNotification.id}`, adminNotification);
    }

    // Create confirmation notification for crew member
    const crewNotification = {
      id: `notif-${Date.now()}-validated`,
      userId: user.id,
      type: 'success',
      title: dateModificationRequest ? 'Mission Validated - Date Modification Requested' : 'Mission Validated',
      message: dateModificationRequest ? 
        `Mission ${missionId} has been validated and your date modification request has been sent to administration for approval.` :
        `Mission ${missionId} has been successfully validated. Thank you for your confirmation.`,
      category: 'mission',
      createdAt: now,
      read: false,
      metadata: { missionId }
    };
    
    await kv.set(`notification:${user.id}:${crewNotification.id}`, crewNotification);
    
    console.log(`[PUT /missions/:id/validate] Mission ${missionId} validated by ${user.user_metadata?.name || user.email}`);
    
    return c.json({ 
      mission: validatedMission,
      message: 'Mission validated successfully'
    });
  } catch (error) {
    console.error('[PUT /missions/:id/validate] Error validating mission:', error);
    return c.json({ error: 'Failed to validate mission' }, 500);
  }
});

// Approve client response (move from pending_client_approval to approved)
missionRoutes.put("/:id/approve-client-response", requireAuth, async (c) => {
  try {
    const missionId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { comments } = await c.req.json();
    
    console.log(`[PUT /missions/:id/approve-client-response] User ${user.id} (${userRole}) approving client response for mission ${missionId}`);
    
    if (userRole !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      console.log(`[PUT /missions/:id/approve-client-response] Mission ${missionId} not found`);
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    if (mission.status !== 'pending_client_approval') {
      return c.json({ error: 'Mission is not pending client approval' }, 400);
    }
    
    const now = new Date().toISOString();
    const approvedMission = {
      ...mission,
      status: 'approved',
      clientApprovedAt: now,
      clientResponse: {
        approved: true,
        respondedAt: now,
        comments: comments
      }
    };
    
    await kv.set(`mission:${missionId}`, approvedMission);
    
    // NOW create notification for crew member since client approved
    if (mission.crew?.id) {
      const notification = {
        id: `notif-${Date.now()}`,
        userId: mission.crew.id,
        type: 'success',
        title: 'Mission approuvée par le client',
        message: `La mission ${missionId} a été approuvée par le client. Vous pouvez maintenant consulter votre ordre de mission.`,
        category: 'mission',
        createdAt: now,
        read: false,
        metadata: { 
          missionId,
          clientApproved: true,
          actionUrl: `/missions/${missionId}`
        }
      };
      
      await kv.set(`notification:${mission.crew.id}:${notification.id}`, notification);
    }
    
    console.log(`[PUT /missions/:id/approve-client-response] Mission ${missionId} approved by client`);
    
    return c.json({ 
      mission: approvedMission,
      message: 'Mission approved by client, crew notified'
    });
  } catch (error) {
    console.error('[PUT /missions/:id/approve-client-response] Error approving client response:', error);
    return c.json({ error: 'Failed to approve client response' }, 500);
  }
});

// Reject client response (move from pending_client_approval to client_rejected)
missionRoutes.put("/:id/reject-client-response", requireAuth, async (c) => {
  try {
    const missionId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { rejectionReason } = await c.req.json();
    
    console.log(`[PUT /missions/:id/reject-client-response] User ${user.id} (${userRole}) rejecting client response for mission ${missionId}`);
    
    if (userRole !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      console.log(`[PUT /missions/:id/reject-client-response] Mission ${missionId} not found`);
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    if (mission.status !== 'pending_client_approval') {
      return c.json({ error: 'Mission is not pending client approval' }, 400);
    }
    
    const now = new Date().toISOString();
    const rejectedMission = {
      ...mission,
      status: 'client_rejected',
      clientRejectedAt: now,
      clientResponse: {
        approved: false,
        respondedAt: now,
        rejectionReason: rejectionReason
      }
    };
    
    await kv.set(`mission:${missionId}`, rejectedMission);
    
    // Create notification for crew member about client rejection
    if (mission.crew?.id) {
      const notification = {
        id: `notif-${Date.now()}`,
        userId: mission.crew.id,
        type: 'error',
        title: 'Mission rejetée par le client',
        message: `La mission ${missionId} a été rejetée par le client. Raison: ${rejectionReason}`,
        category: 'mission',
        createdAt: now,
        read: false,
        metadata: { 
          missionId,
          clientRejected: true,
          rejectionReason: rejectionReason
        }
      };
      
      await kv.set(`notification:${mission.crew.id}:${notification.id}`, notification);
    }
    
    console.log(`[PUT /missions/:id/reject-client-response] Mission ${missionId} rejected by client: ${rejectionReason}`);
    
    return c.json({ 
      mission: rejectedMission,
      message: 'Mission rejected by client, crew notified'
    });
  } catch (error) {
    console.error('[PUT /missions/:id/reject-client-response] Error rejecting client response:', error);
    return c.json({ error: 'Failed to reject client response' }, 500);
  }
});

// Request date modification
missionRoutes.post("/:id/request-date-modification", requireAuth, async (c) => {
  try {
    const missionId = c.req.param('id');
    const user = c.get('user');
    const dateModificationData = await c.req.json();
    
    console.log(`[POST /missions/:id/request-date-modification] User ${user.id} requesting date modification for mission ${missionId}`);
    
    const mission = await kv.get(`mission:${missionId}`);
    
    if (!mission) {
      console.log(`[POST /missions/:id/request-date-modification] Mission ${missionId} not found`);
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    // Check if user has permission to request modification for this mission
    const userRole = user.user_metadata?.role || 'freelancer';
    if (userRole !== 'admin') {
      const isInCrew = mission.crew?.id === user.id || 
                      mission.crew?.captain?.id === user.id ||
                      mission.crew?.first_officer?.id === user.id ||
                      (mission.crew?.cabin_crew && mission.crew.cabin_crew.some(cc => cc.id === user.id));
      
      if (!isInCrew) {
        return c.json({ error: 'Forbidden: You can only request modifications for your own missions' }, 403);
      }
    }
    
    const now = new Date().toISOString();
    
    // Create date modification request
    const dateModificationRequest = {
      requestedAt: now,
      originalStartDate: dateModificationData.originalStartDate,
      originalEndDate: dateModificationData.originalEndDate,
      newStartDate: dateModificationData.newStartDate,
      newEndDate: dateModificationData.newEndDate,
      reason: dateModificationData.reason,
      status: 'pending'
    };
    
    // Update mission with date modification request
    const updatedMission = {
      ...mission,
      status: mission.status === 'validated' ? 'validated' : 'pending_date_modification',
      dateModificationRequestedAt: now,
      dateModification: dateModificationRequest
    };
    
    await kv.set(`mission:${missionId}`, updatedMission);
    
    // Create notification for admin
    const adminNotification = {
      id: `notif-${Date.now()}`,
      userId: 'admin', // This would be actual admin user IDs in production
      type: 'info',
      title: 'Date Modification Request',
      message: `${user.user_metadata?.name || user.email} has requested date modification for mission ${missionId}`,
      category: 'admin',
      createdAt: now,
      read: false,
      metadata: { 
        missionId: missionId,
        userId: user.id,
        action: 'review_date_modification',
        actionUrl: `/admin/missions/${missionId}/date-modification`
      }
    };
    
    await kv.set(`notification:admin:${adminNotification.id}`, adminNotification);
    
    // Create confirmation notification for crew member
    const crewNotification = {
      id: `notif-${Date.now()}-date-mod`,
      userId: user.id,
      type: 'info',
      title: 'Date Modification Requested',
      message: `Your request to modify dates for mission ${missionId} has been sent to administration for approval.`,
      category: 'mission',
      createdAt: now,
      read: false,
      metadata: { missionId }
    };
    
    await kv.set(`notification:${user.id}:${crewNotification.id}`, crewNotification);
    
    console.log(`[POST /missions/:id/request-date-modification] Date modification requested for mission ${missionId}`);
    
    return c.json({ 
      mission: updatedMission,
      message: 'Date modification request submitted successfully'
    });
  } catch (error) {
    console.error('[POST /missions/:id/request-date-modification] Error requesting date modification:', error);
    return c.json({ error: 'Failed to request date modification' }, 500);
  }
});

export default missionRoutes;