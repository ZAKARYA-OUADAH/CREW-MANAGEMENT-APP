import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { requireAuth } from "./middleware.tsx";

const crewRoutes = new Hono();

// IMPORTANT: Routes spécifiques DOIVENT être définies AVANT les routes paramétrées
// Sinon /:id capture toutes les requêtes incluant /pending-validations

// Create test pending validations (for debugging) - NO AUTH REQUIRED
crewRoutes.post("/create-test-pending", async (c) => {
  try {
    console.log('Creating test pending validations...');
    
    const testPendingUsers = [
      {
        id: 'test-pending-1',
        email: 'john.doe@test.com',
        name: 'John Doe',
        user_metadata: {
          role: 'freelancer',
          firstName: 'John',
          lastName: 'Doe',
          position: 'Captain',
          phone: '+33 6 12 34 56 78'
        },
        status: 'pending_validation',
        created_at: new Date().toISOString(),
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+33 6 12 34 56 78',
          position: 'Captain',
          completionStatus: 'documents',
          documentsStatus: 'pending',
          validationRequired: true
        }
      },
      {
        id: 'test-pending-2',
        email: 'marie.martin@test.com',
        name: 'Marie Martin',
        user_metadata: {
          role: 'freelancer',
          firstName: 'Marie',
          lastName: 'Martin',
          position: 'Flight Attendant',
          phone: '+33 6 87 65 43 21'
        },
        status: 'pending_validation',
        created_at: new Date().toISOString(),
        profile: {
          firstName: 'Marie',
          lastName: 'Martin',
          phone: '+33 6 87 65 43 21',
          position: 'Flight Attendant',
          completionStatus: 'documents',
          documentsStatus: 'pending',
          validationRequired: true
        }
      }
    ];
    
    for (const user of testPendingUsers) {
      await kv.set(`user:${user.id}`, user);
      console.log(`Created test pending user: ${user.name}`);
    }
    
    return c.json({
      success: true,
      message: `Created ${testPendingUsers.length} test pending validations`,
      users: testPendingUsers.map(u => ({ id: u.id, name: u.name, email: u.email }))
    });
    
  } catch (error) {
    console.error('Error creating test pending validations:', error);
    return c.json({ error: 'Failed to create test data' }, 500);
  }
});

// Debug endpoint for pending validations (with minimal auth checking)
crewRoutes.get("/pending-validations-debug", async (c) => {
  try {
    console.log('=== DEBUG PENDING VALIDATIONS ENDPOINT CALLED ===');
    
    // Check auth header first
    const authHeader = c.req.header('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return c.json({ 
        error: 'No Authorization header provided',
        debug: true,
        endpoint: '/crew/pending-validations-debug'
      }, 401);
    }
    
    const accessToken = authHeader.split(' ')[1];
    console.log('Access token present:', !!accessToken);
    
    if (!accessToken) {
      return c.json({ 
        error: 'No access token in Authorization header',
        debug: true,
        endpoint: '/crew/pending-validations-debug'
      }, 401);
    }
    
    // Try to decode JWT manually
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('JWT payload decoded:', {
          sub: payload.sub,
          email: payload.email,
          role: payload.user_metadata?.role,
          exp: payload.exp,
          iat: payload.iat
        });
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          return c.json({ 
            error: 'Token expired',
            debug: true,
            exp: payload.exp,
            now: now,
            endpoint: '/crew/pending-validations-debug'
          }, 401);
        }
        
        // Check if user is admin
        const userRole = payload.user_metadata?.role || 'freelancer';
        console.log('User role from token:', userRole);
        
        if (userRole !== 'admin') {
          return c.json({ 
            error: 'Forbidden: Admin access required',
            debug: true,
            userRole: userRole,
            endpoint: '/crew/pending-validations-debug'
          }, 403);
        }
        
        // Get pending validations
        console.log('Fetching pending validations...');
        const allUsers = await kv.getByPrefix('user:') || [];
        console.log(`Total users found: ${allUsers.length}`);
        
        const pendingFreelancers = allUsers.filter(u => {
          const isPending = u && 
            u.status === 'pending_validation' && 
            u.user_metadata?.role === 'freelancer';
          
          if (u) {
            console.log(`User ${u.id}: status=${u.status}, role=${u.user_metadata?.role}, isPending=${isPending}`);
          }
          
          return isPending;
        });
        
        console.log(`Found ${pendingFreelancers.length} pending validations`);
        
        return c.json({ 
          freelancers: pendingFreelancers,
          debug: {
            totalUsers: allUsers.length,
            pendingCount: pendingFreelancers.length,
            userRole: userRole,
            endpoint: '/crew/pending-validations-debug'
          }
        });
        
      } else {
        return c.json({ 
          error: 'Invalid JWT format',
          debug: true,
          endpoint: '/crew/pending-validations-debug'
        }, 401);
      }
    } catch (decodeError) {
      console.error('JWT decode error:', decodeError);
      return c.json({ 
        error: 'Failed to decode JWT',
        debug: true,
        decodeError: decodeError.message,
        endpoint: '/crew/pending-validations-debug'
      }, 401);
    }
    
  } catch (error) {
    console.error('Debug pending validations error:', error);
    return c.json({ 
      error: 'Internal server error',
      debug: true,
      details: error.message,
      endpoint: '/crew/pending-validations-debug'
    }, 500);
  }
});

// Get pending validations (admin only) - MUST BE BEFORE /:id route
crewRoutes.get("/pending-validations", requireAuth, async (c) => {
  try {
    console.log('=== GET /crew/pending-validations CALLED (MAIN ENDPOINT) ===');
    
    const user = c.get('user');
    if (!user) {
      console.log('No user found in context');
      return c.json({ error: 'Unauthorized: No user context' }, 401);
    }
    
    const userRole = user.user_metadata?.role || 'freelancer';
    console.log('GET /crew/pending-validations - User:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin, role:', userRole);
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    console.log('Admin access confirmed, getting pending validations...');
    
    // Get all users with pending_validation status
    const allUsers = await kv.getByPrefix('user:') || [];
    console.log(`Total users found: ${allUsers.length}`);
    
    const pendingFreelancers = allUsers.filter(u => {
      const isPending = u && 
        u.status === 'pending_validation' && 
        u.user_metadata?.role === 'freelancer';
      
      if (u) {
        console.log(`User ${u.id}: status=${u.status}, role=${u.user_metadata?.role}, isPending=${isPending}`);
      }
      
      return isPending;
    });
    
    console.log(`Found ${pendingFreelancers.length} pending validations`);
    
    return c.json({ 
      freelancers: pendingFreelancers,
      debug: {
        totalUsers: allUsers.length,
        pendingCount: pendingFreelancers.length,
        userRole: userRole
      }
    });
  } catch (error) {
    console.error('Error getting pending validations:', error);
    return c.json({ error: 'Failed to get pending validations', details: error.message }, 500);
  }
});

// Check if freelancer email exists - MUST BE BEFORE /:id route
crewRoutes.post("/check-email", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { email } = await c.req.json();
    
    console.log('POST /crew/check-email - User:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log(`Checking email: ${email}`);
    
    // Get all users
    const allUsers = await kv.getByPrefix('user:') || [];
    
    // Find user by email
    const existingUser = allUsers.find(u => u.email === email);
    
    if (existingUser) {
      console.log(`Found existing user: ${email} - Status: ${existingUser.status || 'active'}`);
      
      return c.json({ 
        exists: true,
        freelancer: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name || `${existingUser.user_metadata?.firstName || ''} ${existingUser.user_metadata?.lastName || ''}`.trim(),
          status: existingUser.status || 'active',
          position: existingUser.user_metadata?.position,
          profile: existingUser.profile,
          createdAt: existingUser.created_at,
          lastActiveAt: existingUser.last_sign_in_at
        }
      });
    } else {
      console.log(`Email not found: ${email}`);
      return c.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    return c.json({ error: 'Failed to check email' }, 500);
  }
});

// Send freelancer invitation - MUST BE BEFORE /:id route
crewRoutes.post("/invite", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { email } = await c.req.json();
    
    console.log('POST /crew/invite - User:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    console.log(`Sending invitation to: ${email}`);
    
    // Check if user already exists
    const allUsers = await kv.getByPrefix('user:') || [];
    const existingUser = allUsers.find(u => u.email === email);
    
    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    const now = new Date().toISOString();
    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create invitation record
    const invitation = {
      id: invitationToken,
      email: email,
      invitedBy: user.id,
      inviterName: user.user_metadata?.name || user.email,
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      type: 'freelancer'
    };
    
    await kv.set(`invitation:${invitationToken}`, invitation);
    
    // In a real implementation, you would send an email here
    // For now, we'll create a notification for the admin
    const adminNotification = {
      id: `notif-${Date.now()}`,
      userId: user.id,
      type: 'success',
      title: 'Invitation Sent',
      message: `Invitation sent to ${email}. They have 7 days to accept.`,
      category: 'admin',
      createdAt: now,
      read: false,
      metadata: { 
        invitationId: invitationToken,
        email: email,
        action: 'view_invitation',
        actionUrl: `/admin/invitations/${invitationToken}`
      }
    };
    
    await kv.set(`notification:${user.id}:${adminNotification.id}`, adminNotification);
    
    console.log(`Invitation created for ${email} with token ${invitationToken}`);
    
    // Log invitation for debugging (in real app, this would be sent via email)
    console.log(`=== INVITATION EMAIL (DEBUG) ===`);
    console.log(`To: ${email}`);
    console.log(`Subject: Invitation to join Aviation Company as Freelancer`);
    console.log(`Invitation Link: ${Deno.env.get('SITE_URL')}/accept-invitation?token=${invitationToken}`);
    console.log(`=== END EMAIL ===`);
    
    return c.json({ 
      invitation: {
        id: invitationToken,
        email: email,
        status: 'pending',
        expiresAt: invitation.expiresAt
      },
      message: 'Invitation sent successfully',
      // For debugging - remove in production
      debugInfo: {
        acceptUrl: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/accept-invitation?token=${invitationToken}`
      }
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return c.json({ error: 'Failed to send invitation' }, 500);
  }
});

// Accept invitation and create account (public route) - MUST BE BEFORE /:id route
crewRoutes.post("/accept-invitation", async (c) => {
  try {
    const { token, userData } = await c.req.json();
    
    if (!token) {
      return c.json({ error: 'Invitation token is required' }, 400);
    }

    console.log(`Processing invitation acceptance for token: ${token}`);
    
    // Get invitation
    const invitation = await kv.get(`invitation:${token}`);
    
    if (!invitation) {
      return c.json({ error: 'Invalid or expired invitation' }, 404);
    }

    if (invitation.status !== 'pending') {
      return c.json({ error: 'Invitation has already been used or expired' }, 400);
    }

    // Check expiration
    if (new Date(invitation.expiresAt) < new Date()) {
      return c.json({ error: 'Invitation has expired' }, 400);
    }

    // Check if user already exists
    const allUsers = await kv.getByPrefix('user:') || [];
    const existingUser = allUsers.find(u => u.email === invitation.email);
    
    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    const now = new Date().toISOString();
    const userId = `user-${Date.now()}`;
    
    // Create new user
    const newUser = {
      id: userId,
      email: invitation.email,
      user_metadata: {
        role: 'freelancer',
        firstName: userData.firstName,
        lastName: userData.lastName,
        position: userData.position,
        phone: userData.phone
      },
      name: `${userData.firstName} ${userData.lastName}`,
      status: 'pending_validation', // Requires admin validation for sensitive documents
      created_at: now,
      acceptedInvitationAt: now,
      invitedBy: invitation.invitedBy,
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        position: userData.position,
        completionStatus: 'basic_info', // basic_info -> documents -> validated
        documentsStatus: 'pending',
        validationRequired: true
      }
    };
    
    await kv.set(`user:${userId}`, newUser);
    
    // Mark invitation as accepted
    const updatedInvitation = {
      ...invitation,
      status: 'accepted',
      acceptedAt: now,
      userId: userId
    };
    
    await kv.set(`invitation:${token}`, updatedInvitation);
    
    // Create welcome notification for new user
    const welcomeNotification = {
      id: `notif-${Date.now()}`,
      userId: userId,
      type: 'info',
      title: 'Welcome to Aviation Company',
      message: 'Please complete your profile with required documents. Your account will be activated after admin validation.',
      category: 'welcome',
      createdAt: now,
      read: false,
      metadata: { 
        action: 'complete_profile',
        actionUrl: '/profile'
      }
    };
    
    await kv.set(`notification:${userId}:${welcomeNotification.id}`, welcomeNotification);
    
    // Notify admin about new registration
    const adminNotification = {
      id: `notif-${Date.now()}-admin`,
      userId: invitation.invitedBy,
      type: 'info',
      title: 'New Freelancer Registration',
      message: `${newUser.name} (${invitation.email}) has accepted the invitation and created their account.`,
      category: 'admin',
      createdAt: now,
      read: false,
      metadata: { 
        userId: userId,
        action: 'review_profile',
        actionUrl: `/admin/crew/${userId}`
      }
    };
    
    await kv.set(`notification:${invitation.invitedBy}:${adminNotification.id}`, adminNotification);
    
    console.log(`New freelancer account created: ${userId} for ${invitation.email}`);
    
    return c.json({ 
      user: newUser,
      message: 'Account created successfully. Please complete your profile and upload required documents.'
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return c.json({ error: 'Failed to process invitation' }, 500);
  }
});

// ========================================
// ROUTES PARAMETRÉES - DOIVENT ÊTRE APRÈS LES ROUTES SPÉCIFIQUES
// ========================================

// Get all crew (admin only)
crewRoutes.get("/", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    console.log('GET /crew - User:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin:', userRole);
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const allCrew = await kv.getByPrefix('user:') || [];
    console.log(`Found ${allCrew.length} crew members`);
    
    return c.json({ crew: allCrew });
  } catch (error) {
    console.error('Error fetching crew:', error);
    return c.json({ error: 'Failed to fetch crew' }, 500);
  }
});

// Create crew member
crewRoutes.post("/", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const crewData = await c.req.json();
    
    console.log('POST /crew - User:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const crewId = `crew-${Date.now()}`;
    const now = new Date().toISOString();
    
    const newCrew = {
      id: crewId,
      ...crewData,
      created_at: now,
      updated_at: now,
      created_by: user.id
    };
    
    await kv.set(`user:${crewId}`, newCrew);
    
    return c.json({ crew: newCrew });
  } catch (error) {
    console.error('Error creating crew member:', error);
    return c.json({ error: 'Failed to create crew member' }, 500);
  }
});

// Approve freelancer validation (admin only) - MUST BE BEFORE /:id route
crewRoutes.put("/:id/approve-validation", requireAuth, async (c) => {
  try {
    const freelancerId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { comments } = await c.req.json();
    
    console.log('PUT /crew/:id/approve-validation - Freelancer ID:', freelancerId, 'User:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const freelancer = await kv.get(`user:${freelancerId}`);
    
    if (!freelancer) {
      console.log('Freelancer not found:', freelancerId);
      return c.json({ error: 'Freelancer not found' }, 404);
    }
    
    if (freelancer.status !== 'pending_validation') {
      console.log('Freelancer is not pending validation, status:', freelancer.status);
      return c.json({ error: 'Freelancer is not pending validation' }, 400);
    }

    const now = new Date().toISOString();
    
    // Update freelancer status to active
    const approvedFreelancer = {
      ...freelancer,
      status: 'active',
      validatedAt: now,
      validatedBy: user.id,
      validationComments: comments,
      profile: {
        ...freelancer.profile,
        documentsStatus: 'approved',
        validationRequired: false
      }
    };
    
    await kv.set(`user:${freelancerId}`, approvedFreelancer);
    
    // Create notification for the freelancer
    const notification = {
      id: `notif-${Date.now()}`,
      userId: freelancerId,
      type: 'success',
      title: 'Profile Approved',
      message: 'Your freelancer profile has been approved and your account is now active. Welcome to the team!',
      category: 'account',
      createdAt: now,
      read: false,
      metadata: {
        validationComments: comments
      }
    };
    
    await kv.set(`notification:${freelancerId}:${notification.id}`, notification);
    
    console.log(`Freelancer ${freelancerId} approved by ${user.user_metadata?.name || user.email}`);
    
    return c.json({ 
      freelancer: approvedFreelancer,
      message: 'Freelancer approved and activated successfully' 
    });
  } catch (error) {
    console.error('Error approving freelancer validation:', error);
    return c.json({ error: 'Failed to approve freelancer validation' }, 500);
  }
});

// Reject freelancer validation (admin only) - MUST BE BEFORE /:id route
crewRoutes.put("/:id/reject-validation", requireAuth, async (c) => {
  try {
    const freelancerId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { comments } = await c.req.json();
    
    console.log('PUT /crew/:id/reject-validation - Freelancer ID:', freelancerId, 'User:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    if (!comments) {
      return c.json({ error: 'Rejection comments are required' }, 400);
    }

    const freelancer = await kv.get(`user:${freelancerId}`);
    
    if (!freelancer) {
      console.log('Freelancer not found:', freelancerId);
      return c.json({ error: 'Freelancer not found' }, 404);
    }
    
    if (freelancer.status !== 'pending_validation') {
      console.log('Freelancer is not pending validation, status:', freelancer.status);
      return c.json({ error: 'Freelancer is not pending validation' }, 400);
    }

    const now = new Date().toISOString();
    
    // Update freelancer status to rejected
    const rejectedFreelancer = {
      ...freelancer,
      status: 'inactive',
      rejectedAt: now,
      rejectedBy: user.id,
      rejectionComments: comments,
      profile: {
        ...freelancer.profile,
        documentsStatus: 'rejected',
        validationRequired: true
      }
    };
    
    await kv.set(`user:${freelancerId}`, rejectedFreelancer);
    
    // Create notification for the freelancer
    const notification = {
      id: `notif-${Date.now()}`,
      userId: freelancerId,
      type: 'warning',
      title: 'Profile Validation Required',
      message: `Your profile validation was not approved. Please review and update your documents. Reason: ${comments}`,
      category: 'account',
      createdAt: now,
      read: false,
      metadata: {
        rejectionComments: comments,
        action: 'update_profile',
        actionUrl: '/profile'
      }
    };
    
    await kv.set(`notification:${freelancerId}:${notification.id}`, notification);
    
    console.log(`Freelancer ${freelancerId} rejected by ${user.user_metadata?.name || user.email}`);
    
    return c.json({ 
      freelancer: rejectedFreelancer,
      message: 'Freelancer validation rejected' 
    });
  } catch (error) {
    console.error('Error rejecting freelancer validation:', error);
    return c.json({ error: 'Failed to reject freelancer validation' }, 500);
  }
});

// Update crew member status (admin only) - MUST BE BEFORE /:id route
crewRoutes.put("/:id/status", requireAuth, async (c) => {
  try {
    const crewId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { availability } = await c.req.json();
    
    console.log('PUT /crew/:id/status - Crew ID:', crewId, 'User:', user.id, 'Role:', userRole);
    
    // Only admins can change crew status
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    if (!availability || !['available', 'busy'].includes(availability)) {
      return c.json({ error: 'Invalid availability status. Must be "available" or "busy"' }, 400);
    }
    
    console.log(`Updating crew ${crewId} status to ${availability}`);
    
    const existingCrew = await kv.get(`user:${crewId}`);
    
    if (!existingCrew) {
      console.log('Crew member not found for status update:', crewId);
      return c.json({ error: 'Crew member not found' }, 404);
    }
    
    const updatedCrew = {
      ...existingCrew,
      availability: availability,
      updated_at: new Date().toISOString(),
      status_updated_by: user.id,
      status_updated_at: new Date().toISOString()
    };
    
    await kv.set(`user:${crewId}`, updatedCrew);
    
    console.log(`Successfully updated crew ${crewId} availability to ${availability}`);
    
    // Create notification for the crew member if they're not the one making the change
    if (user.id !== crewId) {
      const notification = {
        id: `notif-${Date.now()}`,
        userId: crewId,
        type: 'info',
        title: 'Availability Status Updated',
        message: `Your availability has been changed to ${availability} by ${user.user_metadata?.name || user.email}`,
        category: 'crew',
        createdAt: new Date().toISOString(),
        read: false,
        metadata: {
          availability: availability,
          updatedBy: user.user_metadata?.name || user.email
        }
      };
      
      await kv.set(`notification:${crewId}:${notification.id}`, notification);
    }
    
    return c.json({ 
      crew: updatedCrew,
      message: `Crew availability updated to ${availability}` 
    });
  } catch (error) {
    console.error('Error updating crew status:', error);
    return c.json({ error: 'Failed to update crew status' }, 500);
  }
});

// Get crew member by ID - MUST BE LAST AMONG GET /:param routes
crewRoutes.get("/:id", requireAuth, async (c) => {
  try {
    const crewId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    console.log('GET /crew/:id - Crew ID:', crewId, 'User:', user.id, 'Role:', userRole);
    
    // Users can access their own data, admins can access anyone's
    if (userRole !== 'admin' && user.id !== crewId) {
      console.log('Access denied - not admin and not own data');
      return c.json({ error: 'Forbidden: Access denied' }, 403);
    }
    
    const crewMember = await kv.get(`user:${crewId}`);
    
    if (!crewMember) {
      console.log('Crew member not found:', crewId);
      return c.json({ error: 'Crew member not found' }, 404);
    }
    
    return c.json({ crew: crewMember });
  } catch (error) {
    console.error('Error fetching crew member:', error);
    return c.json({ error: 'Failed to fetch crew member' }, 500);
  }
});

// Update crew member - MUST BE LAST AMONG PUT /:param routes
crewRoutes.put("/:id", requireAuth, async (c) => {
  try {
    const crewId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const updateData = await c.req.json();
    
    console.log('PUT /crew/:id - Crew ID:', crewId, 'User:', user.id, 'Role:', userRole);
    
    // Users can update their own data, admins can update anyone's
    if (userRole !== 'admin' && user.id !== crewId) {
      console.log('Access denied - not admin and not own data');
      return c.json({ error: 'Forbidden: Access denied' }, 403);
    }
    
    const existingCrew = await kv.get(`user:${crewId}`);
    
    if (!existingCrew) {
      console.log('Crew member not found for update:', crewId);
      return c.json({ error: 'Crew member not found' }, 404);
    }
    
    const updatedCrew = {
      ...existingCrew,
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`user:${crewId}`, updatedCrew);
    
    return c.json({ crew: updatedCrew });
  } catch (error) {
    console.error('Error updating crew member:', error);
    return c.json({ error: 'Failed to update crew member' }, 500);
  }
});

export default crewRoutes;