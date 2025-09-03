// CrewTech Platform - Edge Function Complete
// 🚀 INSTRUCTIONS DE DÉPLOIEMENT :
// 1. Copiez ce code complet
// 2. Dans Supabase Dashboard → Edge Functions → Créer une nouvelle fonction
// 3. Nommez la fonction : "crew-tech-server" 
// 4. Collez ce code et déployez
// 5. URL finale : https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/crew-tech-server/

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// =======================
// CONFIGURATION
// =======================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Configuration automatique des secrets
const getEnvVar = (key: string, fallback?: string): string => {
  return Deno.env.get(key) || fallback || '';
};

const SUPABASE_URL = getEnvVar('SUPABASE_URL', 'https://nrvzifxdmllgcidfhlzh.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY2OTAsImV4cCI6MjA3MTk3MjY5MH0.LQkxhokeAsrpQDKmBQ4f6mpP0XJlwRjXNEGKjOM1xVs');
const SUPABASE_SERVICE_ROLE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5NjY5MCwiZXhwIjoyMDcxOTcyNjkwfQ.dCx1BUVy4K7YecsyNN5pAIJ_CKLgO-s5KM5WKIZQyWs');

// Clients Supabase
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =======================
// UTILITIES KV STORE
// =======================

const KV_TABLE_NAME = 'kv_store_9fd39b98';

const kv = {
  async get(key: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from(KV_TABLE_NAME)
        .select('value')
        .eq('key', key)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      return data?.value || null;
    } catch (error) {
      console.error(`KV get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: any) {
    try {
      const { error } = await supabaseAdmin
        .from(KV_TABLE_NAME)
        .upsert({ key, value }, { onConflict: 'key' });
      
      if (error) throw error;
    } catch (error) {
      console.error(`KV set error for key ${key}:`, error);
      throw error;
    }
  },

  async getByPrefix(prefix: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from(KV_TABLE_NAME)
        .select('key, value')
        .like('key', `${prefix}%`);
      
      if (error) throw error;
      return data?.map(item => item.value) || [];
    } catch (error) {
      console.error(`KV getByPrefix error for prefix ${prefix}:`, error);
      return [];
    }
  }
};

// =======================
// AUTH MIDDLEWARE
// =======================

const requireAuth = async (request: Request): Promise<{ user?: any; error?: string }> => {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return { error: 'No Authorization header' };
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    if (!accessToken) {
      return { error: 'Invalid Authorization header format' };
    }
    
    // Essayer d'abord avec l'admin client
    const { data: jwtData, error: jwtError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!jwtError && jwtData.user) {
      return { user: jwtData.user };
    }
    
    // Fallback: décoder le JWT manuellement
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < now) {
          return { error: 'Token expired' };
        }
        
        if (payload.sub) {
          return {
            user: { 
              id: payload.sub, 
              email: payload.email || 'unknown@example.com',
              user_metadata: payload.user_metadata || {}
            }
          };
        }
      }
    } catch (decodeError) {
      console.log('JWT decode failed:', decodeError);
    }
    
    return { error: 'Invalid token' };
    
  } catch (error) {
    console.error('Auth error:', error);
    return { error: 'Authentication failed' };
  }
};

// =======================
// HANDLER PRINCIPAL
// =======================

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  console.log(`${method} ${path}`);

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // =======================
    // ROUTES DE BASE
    // =======================
    
    // Health check
    if (path === '/make-server-9fd39b98/health' && method === 'GET') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'CrewTech Platform'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Secrets status
    if (path === '/make-server-9fd39b98/secrets/status' && method === 'GET') {
      const missing = [];
      if (!SUPABASE_URL) missing.push('SUPABASE_URL');
      if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
      if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      
      return new Response(JSON.stringify({
        valid: missing.length === 0,
        missing,
        configured: {
          SUPABASE_URL: !!SUPABASE_URL,
          SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
          SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // =======================
    // ROUTES AUTH
    // =======================
    
    // Signup
    if (path === '/make-server-9fd39b98/auth/signup' && method === 'POST') {
      const { email, password, name, role, type } = await req.json();
      
      if (!email || !password || !name) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: email, password, and name are required'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role: role || 'freelancer', type: type || 'freelancer' },
        email_confirm: true
      });

      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      if (!authData.user) {
        return new Response(JSON.stringify({
          error: 'Failed to create user - no user data returned'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }

      const userData = {
        id: authData.user.id,
        email,
        name,
        role: role || 'freelancer',
        type: type || 'freelancer',
        created_at: new Date().toISOString(),
        profile_complete: false
      };

      await kv.set(`user:${authData.user.id}`, userData);
      
      return new Response(JSON.stringify({
        message: 'User created successfully',
        user: userData 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Login
    if (path === '/make-server-9fd39b98/auth/login' && method === 'POST') {
      const { email, password } = await req.json();
      
      if (!email || !password) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: email and password are required'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      if (!data.session || !data.user) {
        return new Response(JSON.stringify({
          error: 'Login failed - no session data'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      let userData = await kv.get(`user:${data.user.id}`);
      
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
        await kv.set(`user:${data.user.id}`, userData);
      }

      return new Response(JSON.stringify({
        access_token: data.session.access_token,
        user: userData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // =======================
    // ROUTES MISSIONS (AUTH REQUIRED)
    // =======================
    
    // Get missions
    if (path === '/make-server-9fd39b98/missions' && method === 'GET') {
      const authResult = await requireAuth(req);
      if (authResult.error || !authResult.user) {
        return new Response(JSON.stringify({ error: authResult.error || 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }

      const missions = await kv.getByPrefix('mission:');
      
      // Filter based on user role
      let filteredMissions = missions;
      if (authResult.user.user_metadata?.role === 'freelancer') {
        filteredMissions = missions.filter((mission: any) => 
          mission.assigned_crew?.some((crew: any) => crew.id === authResult.user.id) ||
          mission.created_by === authResult.user.id
        );
      }
      
      return new Response(JSON.stringify({ missions: filteredMissions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Create mission
    if (path === '/make-server-9fd39b98/missions' && method === 'POST') {
      const authResult = await requireAuth(req);
      if (authResult.error || !authResult.user) {
        return new Response(JSON.stringify({ error: authResult.error || 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }

      const missionData = await req.json();
      
      const mission = {
        id: crypto.randomUUID(),
        ...missionData,
        created_by: authResult.user.id,
        created_at: new Date().toISOString(),
        status: 'pending',
        updated_at: new Date().toISOString()
      };
      
      await kv.set(`mission:${mission.id}`, mission);
      
      return new Response(JSON.stringify({
        message: 'Mission created successfully',
        mission 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // =======================
    // ROUTES CREW (AUTH REQUIRED)
    // =======================
    
    // Get crew
    if (path === '/make-server-9fd39b98/crew' && method === 'GET') {
      const authResult = await requireAuth(req);
      if (authResult.error || !authResult.user) {
        return new Response(JSON.stringify({ error: authResult.error || 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }

      const crew = await kv.getByPrefix('user:');
      return new Response(JSON.stringify({ crew }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // =======================
    // ROUTES NOTIFICATIONS
    // =======================
    
    // Get notifications
    if (path === '/make-server-9fd39b98/notifications' && method === 'GET') {
      const authResult = await requireAuth(req);
      if (authResult.error || !authResult.user) {
        return new Response(JSON.stringify({ error: authResult.error || 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }

      const notifications = await kv.getByPrefix(`notification:${authResult.user.id}:`);
      return new Response(JSON.stringify({ notifications }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Create notification
    if (path === '/make-server-9fd39b98/notifications' && method === 'POST') {
      const authResult = await requireAuth(req);
      if (authResult.error || !authResult.user) {
        return new Response(JSON.stringify({ error: authResult.error || 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }

      const notificationData = await req.json();
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
      
      await kv.set(`notification:${recipient_id}:${notification.id}`, notification);
      
      return new Response(JSON.stringify({
        message: 'Notification created successfully',
        notification 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // =======================
    // ROUTES DEBUG
    // =======================
    
    // KV test
    if (path === '/make-server-9fd39b98/debug/kv-test' && method === 'POST') {
      try {
        const { test_key, test_value } = await req.json();
        await kv.set(test_key, test_value);
        const retrieved = await kv.get(test_key);
        
        return new Response(JSON.stringify({
          success: true,
          test_key,
          stored_value: test_value,
          retrieved_value: retrieved,
          match: JSON.stringify(test_value) === JSON.stringify(retrieved)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }

    // Auth test
    if (path === '/make-server-9fd39b98/debug/auth-test' && method === 'GET') {
      return new Response(JSON.stringify({
        auth_system: 'functional',
        timestamp: new Date().toISOString(),
        supabase_url: SUPABASE_URL,
        keys_configured: {
          anon: !!SUPABASE_ANON_KEY,
          service_role: !!SUPABASE_SERVICE_ROLE_KEY
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // =======================
    // SEEDING
    // =======================
    
    // Initialize seed data
    if (path === '/make-server-9fd39b98/seed/init' && method === 'POST') {
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
      
      await kv.set(`user:${adminUser.id}`, adminUser);
      
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
      
      await kv.set(`user:${freelancer.id}`, freelancer);
      
      // Create sample mission
      const mission = {
        id: 'mission-001',
        title: 'Paris - London Business Flight',
        client: 'Business Corp',
        departure_date: new Date(Date.now() + 86400000).toISOString(),
        departure_airport: 'LFPG',
        arrival_airport: 'EGLL',
        aircraft_type: 'Citation CJ3',
        passengers: 4,
        status: 'pending',
        created_by: adminUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await kv.set(`mission:${mission.id}`, mission);
      
      return new Response(JSON.stringify({
        message: 'Initial data seeded successfully',
        data: {
          users: [adminUser, freelancer],
          missions: [mission]
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // =======================
    // ROUTE NOT FOUND
    // =======================
    
    return new Response(JSON.stringify({
      error: 'Route not found',
      method,
      path,
      timestamp: new Date().toISOString(),
      available_routes: [
        'GET /make-server-9fd39b98/health',
        'GET /make-server-9fd39b98/secrets/status',
        'POST /make-server-9fd39b98/auth/signup',
        'POST /make-server-9fd39b98/auth/login',
        'GET /make-server-9fd39b98/missions',
        'POST /make-server-9fd39b98/missions',
        'GET /make-server-9fd39b98/crew',
        'GET /make-server-9fd39b98/notifications',
        'POST /make-server-9fd39b98/notifications',
        'POST /make-server-9fd39b98/debug/kv-test',
        'GET /make-server-9fd39b98/debug/auth-test',
        'POST /make-server-9fd39b98/seed/init'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404
    });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

console.log('🚀 CrewTech Edge Function démarrée !');
console.log('📍 Routes disponibles : /make-server-9fd39b98/*');
console.log('✅ CORS configuré pour tous les domaines');
console.log('🔐 Authentification JWT intégrée');