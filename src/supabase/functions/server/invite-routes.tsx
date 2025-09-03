import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE'],
}));

// Initialize Supabase client with service role (server-side only)
const getSupabaseServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Initialize regular Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Verify admin access
const verifyAdminAccess = async (accessToken: string) => {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      throw new Error('Invalid access token');
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      throw new Error('Admin access required');
    }

    return user;
  } catch (error) {
    throw new Error('Unauthorized access');
  }
};

// POST /invite-user - Invite a new user (Admin only)
app.post('/invite-user', async (c) => {
  try {
    console.log('Invite user request received');
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    // Verify admin access
    const adminUser = await verifyAdminAccess(accessToken);
    console.log('Admin user verified:', adminUser.email);
    
    // Parse request body
    const body = await c.req.json();
    const { email, first_name, last_name, base_country, base_city, role, position } = body;
    
    // Validate required fields
    if (!email || !first_name || !last_name || !base_country || !base_city || !role) {
      return c.json({
        error: 'Missing required fields: email, first_name, last_name, base_country, base_city, role'
      }, 400);
    }
    
    // Validate role
    if (!['internal', 'freelancer'].includes(role)) {
      return c.json({
        error: 'Role must be either "internal" or "freelancer"'
      }, 400);
    }
    
    console.log('Inviting user:', { email, first_name, last_name, role, position, base_city, base_country });
    
    const supabaseService = getSupabaseServiceClient();
    const supabase = getSupabaseClient();
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return c.json({
        error: 'User with this email already exists'
      }, 409);
    }
    
    // Create user via admin.inviteUserByEmail
    const { data: inviteData, error: inviteError } = await supabaseService.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name,
        last_name,
        base_country,
        base_city,
        role,
        position,
        invited_by: adminUser.id,
        profile: {
          place_of_birth: '',
          gender: '',
          address: `${base_city}, ${base_country}`,
          postal_code: '',
          city: base_city,
          country: base_country
        }
      }
    });
    
    if (inviteError) {
      console.error('Invite error:', inviteError);
      return c.json({
        error: 'Failed to send invitation email',
        details: inviteError.message
      }, 500);
    }
    
    console.log('User invitation sent:', inviteData);
    
    // Create entry in public.users table
    const fullName = `${first_name} ${last_name}`;
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .insert({
        id: inviteData.user.id,
        email,
        name: fullName,
        role,
        position: position || null,
        status: 'active',
        nationality: '', // Will be filled during profile setup
        birth_date: null,
        phone: null,
        validation_status: 'pending',
        profile_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (publicUserError) {
      console.error('Public user creation error:', publicUserError);
      // Try to clean up the auth user if public user creation failed
      await supabaseService.auth.admin.deleteUser(inviteData.user.id);
      return c.json({
        error: 'Failed to create user profile',
        details: publicUserError.message
      }, 500);
    }
    
    console.log('Public user created:', publicUser);
    
    // Create initial notification for admins
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: adminUser.id, // Notify the admin who sent the invite
        type: 'SYSTEM',
        title: 'User invitation sent',
        message: `Invitation sent to ${fullName} (${email})`,
        action_required: false,
        created_at: new Date().toISOString()
      });
    
    if (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the request for notification errors
    }
    
    return c.json({
      user_id: inviteData.user.id,
      invite_status: 'email_sent',
      public_user_id: publicUser.id,
      message: 'Invitation sent successfully'
    });
    
  } catch (error) {
    console.error('Invite user error:', error);
    return c.json({
      error: 'Internal server error',
      details: error.message
    }, 500);
  }
});

// GET /invitations - List pending invitations (Admin only)
app.get('/invitations', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }
    
    const accessToken = authHeader.split(' ')[1];
    await verifyAdminAccess(accessToken);
    
    const supabase = getSupabaseClient();
    
    // Get users with incomplete profiles
    const { data: pendingUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('profile_complete', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      return c.json({ error: 'Failed to fetch pending invitations' }, 500);
    }
    
    return c.json({ invitations: pendingUsers || [] });
    
  } catch (error) {
    console.error('Get invitations error:', error);
    return c.json({
      error: 'Internal server error',
      details: error.message
    }, 500);
  }
});

export default app;