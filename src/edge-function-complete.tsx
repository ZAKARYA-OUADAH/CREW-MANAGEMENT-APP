// CrewTech Platform - Complete Edge Function
// Deploy this file as a Supabase Edge Function
// File: supabase/functions/crew-tech-server/index.ts

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// =======================
// CONFIGURATION & SECRETS
// =======================

const serverSecrets = {
  SUPABASE_URL: `https://nrvzifxdmllgcidfhlzh.supabase.co`,
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY2OTAsImV4cCI6MjA3MTk3MjY5MH0.LQkxhokeAsrpQDKmBQ4f6mpP0XJlwRjXNEGKjOM1xVs",
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5NjY5MCwiZXhwIjoyMDcxOTcyNjkwfQ.dCx1BUVy4K7YecsyNN5pAIJ_CKLgO-s5KM5WKIZQyWs"
};

const getEnvVar = (key: keyof typeof serverSecrets): string => {
  const envValue = Deno.env.get(key);
  if (envValue) {
    return envValue;
  }
  return serverSecrets[key];
};

const SUPABASE_URL = getEnvVar('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =======================
// KEY-VALUE STORE UTILITIES
// =======================

const KV_TABLE_NAME = 'kv_store_9fd39b98';

const kvStore = {
  async get(key: string): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from(KV_TABLE_NAME)
        .select('value')
        .eq('key', key)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Key not found
        }
        throw error;
      }
      
      return data?.value || null;
    } catch (error) {
      console.error(`KV get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: any): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from(KV_TABLE_NAME)
        .upsert({ key, value }, { onConflict: 'key' });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`KV set error for key ${key}:`, error);
      throw error;
    }
  },

  async del(key: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from(KV_TABLE_NAME)
        .delete()
        .eq('key', key);
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`KV delete error for key ${key}:`, error);
      throw error;
    }
  },

  async mget(keys: string[]): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(KV_TABLE_NAME)
        .select('key, value')
        .in('key', keys);
      
      if (error) {
        throw error;
      }
      
      const keyValueMap = new Map(data?.map(item => [item.key, item.value]) || []);
      return keys.map(key => keyValueMap.get(key) || null);
    } catch (error) {
      console.error('KV mget error:', error);
      return keys.map(() => null);
    }
  },

  async getByPrefix(prefix: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(KV_TABLE_NAME)
        .select('key, value')
        .like('key', `${prefix}%`);
      
      if (error) {
        throw error;
      }
      
      return data?.map(item => item.value) || [];
    } catch (error) {
      console.error(`KV getByPrefix error for prefix ${prefix}:`, error);
      return [];
    }
  }
};

// =======================
// MIDDLEWARE
// =======================

// Enable CORS for all routes
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://*.supabase.co'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Add request logging
app.use('*', logger(console.log));

// Error handling middleware
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  }, 500);
});

// Authentication middleware
const requireAuth = async (c: any, next: any) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({ error: 'Unauthorized: No Authorization header' }, 401);
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized: Invalid Authorization header format' }, 401);
    }
    
    try {
      const { data: jwtData, error: jwtError } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (!jwtError && jwtData.user) {
        c.set('user', jwtData.user);
        await next();
        return;
      }
      
      // Fallback: decode JWT manually
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < now) {
          return c.json({ error: 'Unauthorized: Token expired' }, 401);
        }
        
        if (payload.sub) {
          const userFromJWT = { 
            id: payload.sub, 
            email: payload.email || 'unknown@example.com',
            user_metadata: payload.user_metadata || {}
          };
          
          c.set('user', userFromJWT);
          await next();
          return;
        }
      }
      
      return c.json({ error: 'Unauthorized: Invalid token' }, 401);
      
    } catch (authError) {
      console.error('Authentication error:', authError);
      return c.json({ error: 'Unauthorized: Authentication failed' }, 401);
    }
    
  } catch (error) {
    console.error('Middleware error:', error);
    return c.json({ error: `Internal server error in auth middleware: ${error.message}` }, 500);
  }
};

// =======================
// ROUTES
// =======================

// Health check endpoint
app.get('/make-server-9fd39b98/health', (c) => {
  return c.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'CrewTech Platform'
  });
});

// ===== AUTH ROUTES =====

// Signup endpoint
app.post("/make-server-9fd39b98/auth/signup", async (c) => {
  console.log('Signup endpoint called');
  
  try {
    const requestBody = await c.req.json();
    const { email, password, name, role, type } = requestBody;
    
    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields: email, password, and name are required' }, 400);
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: role || 'freelancer', type: type || 'freelancer' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    if (!authData.user) {
      return c.json({ error: 'Failed to create user - no user data returned' }, 500);
    }

    // Store additional user data
    const userData = {
      id: authData.user.id,
      email,
      name,
      role: role || 'freelancer',
      type: type || 'freelancer',
      created_at: new Date().toISOString(),
      profile_complete: false
    };

    await kvStore.set(`user:${authData.user.id}`, userData);
    
    return c.json({ 
      message: 'User created successfully',
      user: userData 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: `Internal server error during signup: ${error.message}` }, 500);
  }
});

// Login endpoint
app.post("/make-server-9fd39b98/auth/login", async (c) => {
  console.log('Login endpoint called');
  
  try {
    const requestBody = await c.req.json();
    const { email, password } = requestBody;
    
    if (!email || !password) {
      return c.json({ error: 'Missing required fields: email and password are required' }, 400);
    }
    
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return c.json({ error: error.message }, 400);
    }

    if (!data.session || !data.user) {
      return c.json({ error: 'Login failed - no session data' }, 400);
    }

    // Get user data from KV store
    let userData = await kvStore.get(`user:${data.user.id}`);
    
    if (!userData) {
      userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || 'User',
        role: data.user.user_metadata?.role || 'freelancer',
        type: data.user.user_metadata?.type || 'freelancer',
        created_at: new Date().toISOString(),
        profile_complete: false
      };
      await kvStore.set(`user:${data.user.id}`, userData);
    }

    return c.json({
      access_token: data.session.access_token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: `Internal server error during login: ${error.message}` }, 500);
  }
});

// ===== MISSION ROUTES =====

// Get all missions
app.get('/make-server-9fd39b98/missions', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const missions = await kvStore.getByPrefix('mission:');
    
    // Filter missions based on user role
    let filteredMissions = missions;
    if (user.user_metadata?.role === 'freelancer') {
      filteredMissions = missions.filter(mission => 
        mission.assigned_crew?.some((crew: any) => crew.id === user.id) ||
        mission.created_by === user.id
      );
    }
    
    return c.json({ missions: filteredMissions });
  } catch (error) {
    console.error('Get missions error:', error);
    return c.json({ error: 'Failed to fetch missions' }, 500);
  }
});

// Create new mission
app.post('/make-server-9fd39b98/missions', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const missionData = await c.req.json();
    
    const mission = {
      id: crypto.randomUUID(),
      ...missionData,
      created_by: user.id,
      created_at: new Date().toISOString(),
      status: 'pending',
      updated_at: new Date().toISOString()
    };
    
    await kvStore.set(`mission:${mission.id}`, mission);
    
    return c.json({ 
      message: 'Mission created successfully',
      mission 
    });
  } catch (error) {
    console.error('Create mission error:', error);
    return c.json({ error: 'Failed to create mission' }, 500);
  }
});

// Update mission
app.put('/make-server-9fd39b98/missions/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const missionId = c.req.param('id');
    const updateData = await c.req.json();
    
    const existingMission = await kvStore.get(`mission:${missionId}`);
    if (!existingMission) {
      return c.json({ error: 'Mission not found' }, 404);
    }
    
    // Check permissions
    if (user.user_metadata?.role !== 'admin' && existingMission.created_by !== user.id) {
      return c.json({ error: 'Unauthorized to update this mission' }, 403);
    }
    
    const updatedMission = {
      ...existingMission,
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    await kvStore.set(`mission:${missionId}`, updatedMission);
    
    return c.json({ 
      message: 'Mission updated successfully',
      mission: updatedMission 
    });
  } catch (error) {
    console.error('Update mission error:', error);
    return c.json({ error: 'Failed to update mission' }, 500);
  }
});

// ===== CREW ROUTES =====

// Get all crew members
app.get('/make-server-9fd39b98/crew', requireAuth, async (c) => {
  try {
    const crew = await kvStore.getByPrefix('user:');
    return c.json({ crew });
  } catch (error) {
    console.error('Get crew error:', error);
    return c.json({ error: 'Failed to fetch crew' }, 500);
  }
});

// Get crew member by ID
app.get('/make-server-9fd39b98/crew/:id', requireAuth, async (c) => {
  try {
    const crewId = c.req.param('id');
    const crewMember = await kvStore.get(`user:${crewId}`);
    
    if (!crewMember) {
      return c.json({ error: 'Crew member not found' }, 404);
    }
    
    return c.json({ crew: crewMember });
  } catch (error) {
    console.error('Get crew member error:', error);
    return c.json({ error: 'Failed to fetch crew member' }, 500);
  }
});

// ===== NOTIFICATION ROUTES =====

// Get notifications for user
app.get('/make-server-9fd39b98/notifications', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const notifications = await kvStore.getByPrefix(`notification:${user.id}:`);
    
    return c.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// Create notification
app.post('/make-server-9fd39b98/notifications', requireAuth, async (c) => {
  try {
    const notificationData = await c.req.json();
    const { recipient_id, title, message, type = 'info' } = notificationData;
    
    const notification = {
      id: crypto.randomUUID(),
      recipient_id,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString()
    };
    
    await kvStore.set(`notification:${recipient_id}:${notification.id}`, notification);
    
    return c.json({ 
      message: 'Notification created successfully',
      notification 
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return c.json({ error: 'Failed to create notification' }, 500);
  }
});

// ===== DATA ROUTES =====

// Export data (Admin only)
app.get('/make-server-9fd39b98/data/export', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    if (user.user_metadata?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const missions = await kvStore.getByPrefix('mission:');
    const crew = await kvStore.getByPrefix('user:');
    const notifications = await kvStore.getByPrefix('notification:');
    
    return c.json({
      export_date: new Date().toISOString(),
      data: {
        missions,
        crew,
        notifications
      }
    });
  } catch (error) {
    console.error('Export data error:', error);
    return c.json({ error: 'Failed to export data' }, 500);
  }
});

// ===== SEEDING ROUTES =====

// Seed initial data
app.post('/make-server-9fd39b98/seed/init', async (c) => {
  try {
    console.log('Initializing seed data...');
    
    // Create admin user
    const adminUser = {
      id: 'admin-user-001',
      email: 'admin@crewtech.com',
      name: 'Admin CrewTech',
      role: 'admin',
      type: 'internal',
      created_at: new Date().toISOString(),
      profile_complete: true
    };
    
    await kvStore.set(`user:${adminUser.id}`, adminUser);
    
    // Create sample freelancer
    const freelancer = {
      id: 'freelancer-001',
      email: 'pilot@crewtech.com',
      name: 'Jean Dupont',
      role: 'freelancer',
      type: 'freelancer',
      qualifications: ['ATPL', 'Type Rating A320'],
      availability: 'available',
      created_at: new Date().toISOString(),
      profile_complete: true
    };
    
    await kvStore.set(`user:${freelancer.id}`, freelancer);
    
    // Create sample mission
    const mission = {
      id: 'mission-001',
      title: 'Paris - London Business Flight',
      client: 'Business Corp',
      departure_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      departure_airport: 'LFPG',
      arrival_airport: 'EGLL',
      aircraft_type: 'Citation CJ3',
      passengers: 4,
      status: 'pending',
      created_by: adminUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kvStore.set(`mission:${mission.id}`, mission);
    
    return c.json({ 
      message: 'Initial data seeded successfully',
      data: {
        users: [adminUser, freelancer],
        missions: [mission]
      }
    });
  } catch (error) {
    console.error('Seed init error:', error);
    return c.json({ error: 'Failed to seed initial data' }, 500);
  }
});

// Default route for unmatched paths
app.all('*', (c) => {
  console.log(`Unmatched route: ${c.req.method} ${c.req.url}`);
  return c.json({ 
    error: 'Route not found',
    method: c.req.method,
    path: c.req.url,
    timestamp: new Date().toISOString(),
    available_routes: [
      'GET /make-server-9fd39b98/health',
      'POST /make-server-9fd39b98/auth/signup',
      'POST /make-server-9fd39b98/auth/login',
      'GET /make-server-9fd39b98/missions',
      'POST /make-server-9fd39b98/missions',
      'PUT /make-server-9fd39b98/missions/:id',
      'GET /make-server-9fd39b98/crew',
      'GET /make-server-9fd39b98/notifications',
      'POST /make-server-9fd39b98/notifications',
      'GET /make-server-9fd39b98/data/export',
      'POST /make-server-9fd39b98/seed/init'
    ]
  }, 404);
});

// =======================
// SERVER STARTUP
// =======================

console.log('🚀 CrewTech Platform - Hono server starting...');
console.log('📍 Available routes:');
console.log('   - GET  /make-server-9fd39b98/health');
console.log('   - POST /make-server-9fd39b98/auth/signup');
console.log('   - POST /make-server-9fd39b98/auth/login');
console.log('   - GET  /make-server-9fd39b98/missions');
console.log('   - POST /make-server-9fd39b98/missions');
console.log('   - PUT  /make-server-9fd39b98/missions/:id');
console.log('   - GET  /make-server-9fd39b98/crew');
console.log('   - GET  /make-server-9fd39b98/notifications');
console.log('   - POST /make-server-9fd39b98/notifications');
console.log('   - GET  /make-server-9fd39b98/data/export (Admin)');
console.log('   - POST /make-server-9fd39b98/seed/init');

Deno.serve(app.fetch);