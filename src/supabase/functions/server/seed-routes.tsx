import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import { requireAuth } from "./middleware.tsx";
import { TEST_USERS, DEFAULT_CREDENTIALS } from "./seed-data.tsx";
import { createSampleMissions, createSampleNotifications, handleExistingUser } from "./seed-helpers.tsx";

const seedRoutes = new Hono();

// Initialize Supabase client for admin operations
const initializeSupabaseClient = () => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log('Initializing Supabase client:', {
    SUPABASE_URL: SUPABASE_URL ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
  });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required Supabase environment variables');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

// Public status endpoint (no auth required)
seedRoutes.get("/status-public", async (c) => {
  try {
    console.log('Public status endpoint called');
    const users = await kv.getByPrefix('user:') || [];
    const missions = await kv.getByPrefix('mission:') || [];
    const notifications = await kv.getByPrefix('notification:') || [];

    const result = {
      database_status: {
        users: users.length,
        missions: missions.length,
        notifications: notifications.length,
        last_check: new Date().toISOString()
      }
    };
    
    console.log('Status result:', result);
    return c.json(result);
  } catch (error) {
    console.error('Status endpoint error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// AUTO-SEED endpoint - automatically populate database if empty (NO AUTH REQUIRED)
seedRoutes.post("/auto-seed", async (c) => {
  console.log('=== AUTO-SEED ENDPOINT CALLED ===');
  
  try {
    // Initialize Supabase client
    const supabase = initializeSupabaseClient();
    console.log('Supabase client initialized successfully');

    // Check if database already has data
    console.log('Checking existing database content...');
    const existingUsers = await kv.getByPrefix('user:') || [];
    console.log(`Found ${existingUsers.length} existing users`);
    
    if (existingUsers.length > 0) {
      console.log('Database already populated, skipping auto-seed');
      return c.json({
        success: true,
        message: 'Database already populated',
        data: {
          users_created: 0,
          missions_created: 0,
          notifications_created: 0,
          existing_users: existingUsers.length
        },
        credentials: DEFAULT_CREDENTIALS
      });
    }

    console.log('Database is empty, proceeding with auto-seed...');

    const createdUsers = [];

    // Create users in Supabase Auth and store additional data
    console.log('Creating test users in Supabase Auth...');
    
    for (let i = 0; i < TEST_USERS.length; i++) {
      const user = TEST_USERS[i];
      console.log(`Creating user ${i + 1}/${TEST_USERS.length}: ${user.name} (${user.email})`);
      
      try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          user_metadata: { 
            name: user.name, 
            role: user.role, 
            type: user.type 
          },
          email_confirm: true
        });

        if (authError) {
          console.error(`Failed to create user ${user.email}:`, authError);
          
          // Check if user already exists
          if (authError.message.includes('already been registered') || authError.message.includes('already registered')) {
            console.log(`User ${user.email} already exists, trying to find existing user`);
            
            // Try to get existing user
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers.users?.find(u => u.email === user.email);
            
            if (existingUser) {
              const userData = await handleExistingUser(supabase, user, existingUser);
              createdUsers.push(userData);
              continue;
            } else {
              console.error(`User ${user.email} should exist but was not found in user list`);
            }
          }
          
          // If it's a different error, throw it
          throw new Error(`Failed to create user ${user.email}: ${authError.message}`);
        }

        if (!authData.user) {
          console.error(`No user data returned for ${user.email}`);
          throw new Error(`No user data returned for ${user.email}`);
        }

        console.log(`Successfully created user in Auth: ${authData.user.id}`);

        // Store additional user data in KV store
        const userData = {
          id: authData.user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          type: user.type,
          ...user.data,
          created_at: new Date().toISOString(),
          profile_complete: true,
          last_active: new Date()
        };

        await kv.set(`user:${authData.user.id}`, userData);
        createdUsers.push(userData);
        console.log(`Stored user data in KV: ${user.name} (${user.email})`);

      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error);
        throw error; // Re-throw to stop the process
      }
    }

    console.log(`Successfully created ${createdUsers.length} users`);

    // Create sample mission orders
    console.log('Creating sample missions...');
    const missions = createSampleMissions(createdUsers);

    for (const mission of missions) {
      if (mission.crew) {
        await kv.set(`mission:${mission.id}`, {
          ...mission,
          createdBy: createdUsers.find(u => u.email === 'admin@crewtech.fr')?.id
        });
        console.log(`Created mission: ${mission.id}`);
      }
    }

    // Create sample notifications
    console.log('Creating sample notifications...');
    const notificationCount = await createSampleNotifications(createdUsers);

    console.log('Auto-seed completed successfully!');

    return c.json({
      success: true,
      message: 'Database auto-seeded successfully',
      data: {
        users_created: createdUsers.length,
        missions_created: missions.length,
        notifications_created: notificationCount
      },
      credentials: DEFAULT_CREDENTIALS
    });

  } catch (error) {
    console.error('=== AUTO-SEEDING ERROR ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    
    return c.json({ 
      success: false, 
      error: 'Database auto-seeding failed', 
      details: error.message,
      stack: error.stack
    }, 500);
  }
});

// Seed endpoint - populate database with test data (requires auth)
seedRoutes.post("/seed", requireAuth, async (c) => {
  try {
    console.log('Manual database seeding requested by user');
    
    // Initialize Supabase client
    const supabase = initializeSupabaseClient();

    // Clear existing data
    console.log('Clearing existing data...');
    const existingKeys = await kv.getByPrefix('') || [];
    for (const item of existingKeys) {
      if (item.id) {
        const keyParts = item.id.split(':');
        if (keyParts.length >= 2) {
          await kv.del(item.id);
        }
      }
    }

    // Use the same seeding logic as auto-seed but clear data first
    const createdUsers = [];

    for (const user of TEST_USERS) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          user_metadata: { 
            name: user.name, 
            role: user.role, 
            type: user.type 
          },
          email_confirm: true
        });

        if (authError && !authError.message.includes('already been registered')) {
          throw new Error(`Failed to create user ${user.email}: ${authError.message}`);
        }

        const userData = {
          id: authData?.user?.id || user.email, // fallback for existing users
          email: user.email,
          name: user.name,
          role: user.role,
          type: user.type,
          ...user.data,
          created_at: new Date().toISOString(),
          profile_complete: true,
          last_active: new Date()
        };

        if (authData?.user?.id) {
          await kv.set(`user:${authData.user.id}`, userData);
          createdUsers.push(userData);
        }
      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }

    // Create missions and notifications
    const missions = createSampleMissions(createdUsers);
    for (const mission of missions) {
      if (mission.crew) {
        await kv.set(`mission:${mission.id}`, {
          ...mission,
          createdBy: createdUsers.find(u => u.email === 'admin@crewtech.fr')?.id
        });
      }
    }

    const notificationCount = await createSampleNotifications(createdUsers);
    
    return c.json({
      success: true,
      message: 'Database manually seeded successfully',
      data: {
        users_created: createdUsers.length,
        missions_created: missions.length,
        notifications_created: notificationCount
      },
      credentials: DEFAULT_CREDENTIALS
    });

  } catch (error) {
    console.error('Manual seeding error:', error);
    return c.json({ 
      success: false, 
      error: 'Database seeding failed', 
      details: error.message 
    }, 500);
  }
});

// Get seeding status (requires auth)
seedRoutes.get("/status", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const users = await kv.getByPrefix('user:') || [];
    const missions = await kv.getByPrefix('mission:') || [];
    const notifications = await kv.getByPrefix('notification:') || [];

    return c.json({
      database_status: {
        users: users.length,
        missions: missions.length,
        notifications: notifications.length,
        last_check: new Date().toISOString()
      },
      authenticated_user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'unknown'
      }
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Test auth endpoint (requires auth)
seedRoutes.get("/test-auth", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    console.log('Test auth endpoint accessed by user:', user);
    
    return c.json({
      success: true,
      message: 'Authentication test successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'unknown',
        name: user.user_metadata?.name
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return c.json({ 
      success: false,
      error: error.message 
    }, 500);
  }
});

// Clear/cleanup database - Admin only
seedRoutes.post("/clear", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.user_metadata?.role || 'freelancer';
    
    if (userRole !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    console.log(`Database cleanup requested by admin: ${user.user_metadata?.name || user.email}`);
    
    // Get initial count for reporting
    const initialUsers = await kv.getByPrefix('user:') || [];
    const initialMissions = await kv.getByPrefix('mission:') || [];
    const initialNotifications = await kv.getByPrefix('notification:') || [];
    const initialRibUpdates = await kv.getByPrefix('rib_update:') || [];
    const initialPaymentIssues = await kv.getByPrefix('payment_issue:') || [];

    console.log('Current database content:', {
      users: initialUsers.length,
      missions: initialMissions.length,
      notifications: initialNotifications.length,
      rib_updates: initialRibUpdates.length,
      payment_issues: initialPaymentIssues.length
    });

    let deletedCount = 0;
    let errors = [];

    // Clear all KV store data
    console.log('Clearing KV store data...');
    
    // Delete users
    for (const user of initialUsers) {
      try {
        await kv.del(user.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete user ${user.id}:`, error);
        errors.push(`User ${user.id}: ${error.message}`);
      }
    }

    // Delete missions
    for (const mission of initialMissions) {
      try {
        await kv.del(mission.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete mission ${mission.id}:`, error);
        errors.push(`Mission ${mission.id}: ${error.message}`);
      }
    }

    // Delete notifications
    for (const notification of initialNotifications) {
      try {
        await kv.del(notification.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete notification ${notification.id}:`, error);
        errors.push(`Notification ${notification.id}: ${error.message}`);
      }
    }

    // Delete RIB updates
    for (const ribUpdate of initialRibUpdates) {
      try {
        await kv.del(ribUpdate.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete RIB update ${ribUpdate.id}:`, error);
        errors.push(`RIB update ${ribUpdate.id}: ${error.message}`);
      }
    }

    // Delete payment issues
    for (const paymentIssue of initialPaymentIssues) {
      try {
        await kv.del(paymentIssue.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete payment issue ${paymentIssue.id}:`, error);
        errors.push(`Payment issue ${paymentIssue.id}: ${error.message}`);
      }
    }

    // Clear Supabase Auth users (optional - careful!)
    try {
      console.log('Clearing Supabase Auth users...');
      const supabase = initializeSupabaseClient();
      
      // Get all users
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Error listing auth users:', listError);
        errors.push(`Failed to list auth users: ${listError.message}`);
      } else {
        console.log(`Found ${authUsers.users.length} auth users to delete`);
        
        // Delete each user
        for (const authUser of authUsers.users) {
          try {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
            if (deleteError) {
              console.error(`Failed to delete auth user ${authUser.id}:`, deleteError);
              errors.push(`Auth user ${authUser.id}: ${deleteError.message}`);
            } else {
              console.log(`Deleted auth user: ${authUser.email}`);
            }
          } catch (error) {
            console.error(`Error deleting auth user ${authUser.id}:`, error);
            errors.push(`Auth user ${authUser.id}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error('Error during auth cleanup:', error);
      errors.push(`Auth cleanup error: ${error.message}`);
    }

    // Verify cleanup
    console.log('Verifying cleanup...');
    const remainingUsers = await kv.getByPrefix('user:') || [];
    const remainingMissions = await kv.getByPrefix('mission:') || [];
    const remainingNotifications = await kv.getByPrefix('notification:') || [];

    const result = {
      success: true,
      message: 'Database cleanup completed',
      cleanup_summary: {
        before: {
          users: initialUsers.length,
          missions: initialMissions.length,
          notifications: initialNotifications.length,
          rib_updates: initialRibUpdates.length,
          payment_issues: initialPaymentIssues.length,
          total: initialUsers.length + initialMissions.length + initialNotifications.length + initialRibUpdates.length + initialPaymentIssues.length
        },
        after: {
          users: remainingUsers.length,
          missions: remainingMissions.length,
          notifications: remainingNotifications.length,
          total: remainingUsers.length + remainingMissions.length + remainingNotifications.length
        },
        deleted_items: deletedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined,
      performed_by: {
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email,
        timestamp: new Date().toISOString()
      }
    };

    console.log('Cleanup completed:', result);
    return c.json(result);

  } catch (error) {
    console.error('Database cleanup error:', error);
    return c.json({ 
      success: false, 
      error: 'Database cleanup failed', 
      details: error.message,
      stack: error.stack
    }, 500);
  }
});

export default seedRoutes;