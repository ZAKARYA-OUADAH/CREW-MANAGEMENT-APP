import { Hono } from "npm:hono";
import { requireAuth } from "./middleware.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

const usersRoutes = new Hono();

// Initialize Supabase client with service role key for admin operations
const getSupabaseAdmin = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Get all users from auth.users table (admin only)
usersRoutes.get("/", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    console.log('GET /users - User:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin:', userRole);
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const supabase = getSupabaseAdmin();
    
    // Get all users from auth.users table using admin client
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users from auth.users:', error);
      return c.json({ error: 'Failed to fetch users from database' }, 500);
    }
    
    console.log(`Found ${users.users.length} users in auth.users table`);
    
    // Transform the data to include useful information
    const enrichedUsers = users.users.map(user => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      email_confirmed_at: user.email_confirmed_at,
      phone_confirmed_at: user.phone_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      raw_app_meta_data: user.app_metadata,
      raw_user_meta_data: user.user_metadata,
      banned_until: user.banned_until,
      invited_at: user.invited_at,
      confirmed_at: user.confirmed_at,
      // Computed fields
      name: user.user_metadata?.firstName && user.user_metadata?.lastName 
        ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
        : user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      role: user.user_metadata?.role || 'freelancer',
      position: user.user_metadata?.position || 'Unknown',
      status: user.banned_until ? 'suspended' : 
              !user.email_confirmed_at ? 'pending_validation' : 'active',
      validation_status: user.user_metadata?.documentsStatus === 'approved' ? 'approved' :
                        user.user_metadata?.documentsStatus === 'rejected' ? 'rejected' : 'pending',
      profile_complete: !!user.user_metadata?.completionStatus || !!user.email_confirmed_at
    }));
    
    return c.json({ 
      users: enrichedUsers,
      total: enrichedUsers.length,
      pagination: {
        page: 1,
        per_page: enrichedUsers.length,
        total: enrichedUsers.length
      }
    });
    
  } catch (error) {
    console.error('Error in GET /users:', error);
    return c.json({ 
      error: 'Failed to fetch users', 
      details: error.message 
    }, 500);
  }
});

// Get user by ID (admin only)
usersRoutes.get("/:id", requireAuth, async (c) => {
  try {
    const userId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    console.log('GET /users/:id - User ID:', userId, 'Requester:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin' && user.id !== userId) {
      console.log('Access denied - user is not admin and not requesting own data');
      return c.json({ error: 'Forbidden: Admin access required or own data only' }, 403);
    }
    
    const supabase = getSupabaseAdmin();
    
    // Get specific user from auth.users table
    const { data: userData, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
      console.error('Error fetching user from auth.users:', error);
      if (error.message.includes('not found')) {
        return c.json({ error: 'User not found' }, 404);
      }
      return c.json({ error: 'Failed to fetch user from database' }, 500);
    }
    
    if (!userData.user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    console.log(`Found user ${userId} in auth.users table`);
    
    // Transform the data
    const enrichedUser = {
      id: userData.user.id,
      email: userData.user.email,
      phone: userData.user.phone,
      email_confirmed_at: userData.user.email_confirmed_at,
      phone_confirmed_at: userData.user.phone_confirmed_at,
      last_sign_in_at: userData.user.last_sign_in_at,
      created_at: userData.user.created_at,
      updated_at: userData.user.updated_at,
      raw_app_meta_data: userData.user.app_metadata,
      raw_user_meta_data: userData.user.user_metadata,
      banned_until: userData.user.banned_until,
      invited_at: userData.user.invited_at,
      confirmed_at: userData.user.confirmed_at,
      // Computed fields
      name: userData.user.user_metadata?.firstName && userData.user.user_metadata?.lastName 
        ? `${userData.user.user_metadata.firstName} ${userData.user.user_metadata.lastName}`
        : userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'Unknown',
      role: userData.user.user_metadata?.role || 'freelancer',
      position: userData.user.user_metadata?.position || 'Unknown',
      status: userData.user.banned_until ? 'suspended' : 
              !userData.user.email_confirmed_at ? 'pending_validation' : 'active',
      validation_status: userData.user.user_metadata?.documentsStatus === 'approved' ? 'approved' :
                        userData.user.user_metadata?.documentsStatus === 'rejected' ? 'rejected' : 'pending',
      profile_complete: !!userData.user.user_metadata?.completionStatus || !!userData.user.email_confirmed_at
    };
    
    return c.json({ user: enrichedUser });
    
  } catch (error) {
    console.error('Error in GET /users/:id:', error);
    return c.json({ 
      error: 'Failed to fetch user', 
      details: error.message 
    }, 500);
  }
});

// Update user metadata (admin only)
usersRoutes.put("/:id/metadata", requireAuth, async (c) => {
  try {
    const userId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { user_metadata, app_metadata } = await c.req.json();
    
    console.log('PUT /users/:id/metadata - User ID:', userId, 'Requester:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const supabase = getSupabaseAdmin();
    
    // Update user metadata
    const updateData: any = {};
    if (user_metadata) updateData.user_metadata = user_metadata;
    if (app_metadata) updateData.app_metadata = app_metadata;
    
    const { data: userData, error } = await supabase.auth.admin.updateUserById(
      userId,
      updateData
    );
    
    if (error) {
      console.error('Error updating user metadata:', error);
      return c.json({ error: 'Failed to update user metadata' }, 500);
    }
    
    console.log(`Updated user ${userId} metadata`);
    
    return c.json({ 
      user: userData.user,
      message: 'User metadata updated successfully' 
    });
    
  } catch (error) {
    console.error('Error in PUT /users/:id/metadata:', error);
    return c.json({ 
      error: 'Failed to update user metadata', 
      details: error.message 
    }, 500);
  }
});

// Ban/unban user (admin only)
usersRoutes.put("/:id/ban", requireAuth, async (c) => {
  try {
    const userId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    const { ban, duration_days } = await c.req.json();
    
    console.log('PUT /users/:id/ban - User ID:', userId, 'Requester:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const supabase = getSupabaseAdmin();
    
    let banUntil = null;
    if (ban && duration_days) {
      const now = new Date();
      banUntil = new Date(now.getTime() + duration_days * 24 * 60 * 60 * 1000).toISOString();
    }
    
    // Update user ban status
    const { data: userData, error } = await supabase.auth.admin.updateUserById(
      userId,
      { ban_duration: ban ? (banUntil ? 'temporary' : 'permanent') : 'none' }
    );
    
    if (error) {
      console.error('Error updating user ban status:', error);
      return c.json({ error: 'Failed to update user ban status' }, 500);
    }
    
    console.log(`${ban ? 'Banned' : 'Unbanned'} user ${userId}`);
    
    return c.json({ 
      user: userData.user,
      message: `User ${ban ? 'banned' : 'unbanned'} successfully` 
    });
    
  } catch (error) {
    console.error('Error in PUT /users/:id/ban:', error);
    return c.json({ 
      error: 'Failed to update user ban status', 
      details: error.message 
    }, 500);
  }
});

// Delete user (admin only, soft delete)
usersRoutes.delete("/:id", requireAuth, async (c) => {
  try {
    const userId = c.req.param('id');
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    console.log('DELETE /users/:id - User ID:', userId, 'Requester:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    if (user.id === userId) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }
    
    const supabase = getSupabaseAdmin();
    
    // Soft delete user by updating metadata
    const { data: userData, error } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        user_metadata: {
          ...user.user_metadata,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        }
      }
    );
    
    if (error) {
      console.error('Error soft deleting user:', error);
      return c.json({ error: 'Failed to delete user' }, 500);
    }
    
    console.log(`Soft deleted user ${userId}`);
    
    return c.json({ 
      message: 'User deleted successfully',
      user: userData.user
    });
    
  } catch (error) {
    console.error('Error in DELETE /users/:id:', error);
    return c.json({ 
      error: 'Failed to delete user', 
      details: error.message 
    }, 500);
  }
});

// Create complete user profile after setup wizard completion
usersRoutes.post("/create-profile", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { userProfile, profileMetadata, passportMetadata, certificates } = await c.req.json();
    
    console.log('POST /users/create-profile - User:', user.id);
    console.log('Profile data:', userProfile);
    console.log('Metadata:', { profileMetadata, passportMetadata, certificates });
    
    const supabase = getSupabaseAdmin();
    
    // Validate that the user is creating their own profile
    if (user.id !== userProfile.id) {
      return c.json({ error: 'Forbidden: Can only create own profile' }, 403);
    }
    
    // Start a transaction-like approach by creating/updating user first
    console.log('Creating user profile in public.users table...');
    
    // Insert user into public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([userProfile], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (userError) {
      console.error('Error creating user profile:', userError);
      return c.json({ 
        error: 'Failed to create user profile', 
        details: userError.message 
      }, 500);
    }
    
    console.log('User profile created:', userData);
    
    // Insert certificates/qualifications if provided
    if (certificates && certificates.length > 0) {
      console.log('Creating qualifications...');
      
      const qualificationsToInsert = certificates.map(cert => ({
        ...cert,
        user_id: user.id,
        created_at: new Date().toISOString()
      }));
      
      const { data: qualData, error: qualError } = await supabase
        .from('qualifications')
        .insert(qualificationsToInsert)
        .select();
      
      if (qualError) {
        console.error('Error creating qualifications:', qualError);
        // Don't fail the whole process, just log the error
        console.warn('Continuing without qualifications due to error:', qualError.message);
      } else {
        console.log('Qualifications created:', qualData);
      }
    }
    
    // Create completion notification
    console.log('Creating notifications...');
    
    try {
      // User notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'SYSTEM',
          title: 'Profile completed',
          message: 'Thank you! Your profile is complete and pending validation.',
          action_required: false,
          created_at: new Date().toISOString()
        });
      
      // Admin notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id, // Will be filtered to admins by the notification system
          type: 'ALERT',
          title: 'New user pending validation',
          message: `${userProfile.name} has completed their profile and is awaiting validation.`,
          action_required: true,
          created_at: new Date().toISOString()
        });
        
      console.log('Notifications created');
    } catch (notifError) {
      console.warn('Failed to create notifications:', notifError);
      // Don't fail the process for notification errors
    }
    
    // Update auth metadata to mark profile as complete
    try {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          profile_complete: true,
          completion_date: new Date().toISOString()
        }
      });
      console.log('Auth metadata updated');
    } catch (authError) {
      console.warn('Failed to update auth metadata:', authError);
    }
    
    return c.json({
      success: true,
      message: 'User profile created successfully',
      user: userData,
      qualifications_count: certificates?.length || 0
    });
    
  } catch (error) {
    console.error('Error in POST /users/create-profile:', error);
    return c.json({ 
      error: 'Failed to create user profile', 
      details: error.message 
    }, 500);
  }
});

// Get user statistics (admin only)
usersRoutes.get("/stats/overview", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    console.log('GET /users/stats/overview - User:', user.id, 'Role:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Access denied - user is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const supabase = getSupabaseAdmin();
    
    // Get all users for statistics
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users for stats:', error);
      return c.json({ error: 'Failed to fetch user statistics' }, 500);
    }
    
    const allUsers = users.users;
    
    // Calculate statistics
    const stats = {
      total: allUsers.length,
      active: allUsers.filter(u => !u.banned_until && u.email_confirmed_at).length,
      inactive: allUsers.filter(u => !u.email_confirmed_at).length,
      banned: allUsers.filter(u => u.banned_until && new Date(u.banned_until) > new Date()).length,
      email_confirmed: allUsers.filter(u => u.email_confirmed_at).length,
      phone_confirmed: allUsers.filter(u => u.phone_confirmed_at).length,
      roles: {
        admin: allUsers.filter(u => u.user_metadata?.role === 'admin').length,
        internal: allUsers.filter(u => u.user_metadata?.role === 'internal').length,
        freelancer: allUsers.filter(u => u.user_metadata?.role === 'freelancer' || !u.user_metadata?.role).length
      },
      validation: {
        pending: allUsers.filter(u => u.user_metadata?.documentsStatus === 'pending' || !u.user_metadata?.documentsStatus).length,
        approved: allUsers.filter(u => u.user_metadata?.documentsStatus === 'approved').length,
        rejected: allUsers.filter(u => u.user_metadata?.documentsStatus === 'rejected').length
      },
      recent_signups: allUsers.filter(u => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(u.created_at) > weekAgo;
      }).length,
      recent_activity: allUsers.filter(u => {
        if (!u.last_sign_in_at) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(u.last_sign_in_at) > weekAgo;
      }).length
    };
    
    return c.json({ stats });
    
  } catch (error) {
    console.error('Error in GET /users/stats/overview:', error);
    return c.json({ 
      error: 'Failed to fetch user statistics', 
      details: error.message 
    }, 500);
  }
});

export default usersRoutes;