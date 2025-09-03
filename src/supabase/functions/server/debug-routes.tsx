import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const debugRoutes = new Hono();

// Initialize Supabase client for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Debug endpoint to check Supabase Auth users
debugRoutes.get("/auth-users", async (c) => {
  try {
    console.log('Listing Supabase Auth users...');
    
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return c.json({ error: error.message }, 500);
    }
    
    const users = data.users || [];
    console.log(`Found ${users.length} users in Supabase Auth`);
    
    const userDetails = users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed: user.email_confirmed_at ? true : false,
      user_metadata: user.user_metadata
    }));
    
    return c.json({
      count: users.length,
      users: userDetails
    });
  } catch (error) {
    console.error('Debug auth-users error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint to check KV store data
debugRoutes.get("/kv-data", async (c) => {
  try {
    console.log('Checking KV store data...');
    
    const users = await kv.getByPrefix('user:') || [];
    const missions = await kv.getByPrefix('mission:') || [];
    const notifications = await kv.getByPrefix('notification:') || [];
    
    return c.json({
      kv_store: {
        users: {
          count: users.length,
          data: users.slice(0, 3) // Show first 3 for brevity
        },
        missions: {
          count: missions.length,
          data: missions.slice(0, 3)
        },
        notifications: {
          count: notifications.length,
          data: notifications.slice(0, 3)
        }
      }
    });
  } catch (error) {
    console.error('Debug kv-data error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint to test user login
debugRoutes.post("/test-login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    console.log(`Testing login for: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Login test failed:', error);
      return c.json({ 
        success: false, 
        error: error.message,
        details: error
      });
    }
    
    return c.json({
      success: true,
      user_id: data.user?.id,
      email: data.user?.email,
      session_valid: !!data.session
    });
  } catch (error) {
    console.error('Debug test-login error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Clear all auth users (for debugging only)
debugRoutes.delete("/clear-auth", async (c) => {
  try {
    console.log('Clearing all Supabase Auth users...');
    
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw new Error(error.message);
    }
    
    const users = data.users || [];
    let deleted = 0;
    
    for (const user of users) {
      try {
        await supabase.auth.admin.deleteUser(user.id);
        deleted++;
        console.log(`Deleted user: ${user.email}`);
      } catch (deleteError) {
        console.error(`Failed to delete user ${user.email}:`, deleteError);
      }
    }
    
    return c.json({
      success: true,
      deleted_users: deleted,
      total_users: users.length
    });
  } catch (error) {
    console.error('Debug clear-auth error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Full system reset
debugRoutes.post("/full-reset", async (c) => {
  try {
    console.log('Starting full system reset...');
    
    // Clear KV store
    const existingKeys = await kv.getByPrefix('') || [];
    for (const item of existingKeys) {
      if (item.id) {
        await kv.del(item.id);
      }
    }
    console.log(`Cleared ${existingKeys.length} KV store entries`);
    
    // Clear Auth users
    const { data, error } = await supabase.auth.admin.listUsers();
    if (!error && data.users) {
      for (const user of data.users) {
        try {
          await supabase.auth.admin.deleteUser(user.id);
        } catch (deleteError) {
          console.error(`Failed to delete user ${user.email}:`, deleteError);
        }
      }
      console.log(`Cleared ${data.users.length} Auth users`);
    }
    
    return c.json({
      success: true,
      message: 'Full system reset completed',
      cleared: {
        kv_entries: existingKeys.length,
        auth_users: data?.users?.length || 0
      }
    });
  } catch (error) {
    console.error('Debug full-reset error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default debugRoutes;