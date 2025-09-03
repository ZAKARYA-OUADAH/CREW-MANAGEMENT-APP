import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { validateSecrets, debugSecrets } from "./secrets.tsx";
import { createClient } from 'npm:@supabase/supabase-js@2';
import authRoutes from "./auth-routes.tsx";
import missionRoutes from "./mission-routes.tsx";
import missionAssignmentRoutes from "./mission-assignment-routes.tsx";
import crewRoutes from "./crew-routes.tsx";
import usersRoutes from "./users-routes.tsx";
import dataRoutes from "./data-routes.tsx";
import seedRoutes from "./seed-routes.tsx";
import debugRoutes from "./debug-routes.tsx";
import notificationRoutes from "./notification-routes.tsx";
import aircraftRoutes from "./aircraft-routes.tsx";
import qualificationsRoutes from "./qualifications-routes.tsx";
import positionRoutes from "./position-routes.tsx";
import inviteRoutes from "./invite-routes.tsx";
import ocrRoutes from "./ocr-routes.tsx";

const app = new Hono();

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

// Health check endpoint
app.get('/make-server-9fd39b98/health', (c) => {
  const secretsValidation = validateSecrets();
  return c.json({ 
    status: secretsValidation.valid ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    secrets: {
      configured: secretsValidation.valid,
      missing: secretsValidation.missing
    }
  });
});

// Secrets validation endpoint
app.get('/make-server-9fd39b98/secrets/status', (c) => {
  const validation = validateSecrets();
  return c.json({
    valid: validation.valid,
    missing: validation.missing,
    configured: {
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL') || !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!Deno.env.get('SUPABASE_ANON_KEY') || !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || !!process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    timestamp: new Date().toISOString()
  });
});

// Mount route handlers with prefix
app.route('/make-server-9fd39b98/auth', authRoutes);
app.route('/make-server-9fd39b98/missions', missionRoutes);
app.route('/make-server-9fd39b98/missions', missionAssignmentRoutes);
app.route('/make-server-9fd39b98/crew', crewRoutes);
app.route('/make-server-9fd39b98/users', usersRoutes);
app.route('/make-server-9fd39b98/data', dataRoutes);
app.route('/make-server-9fd39b98/seed', seedRoutes);
app.route('/make-server-9fd39b98/debug', debugRoutes);
app.route('/make-server-9fd39b98/notifications', notificationRoutes);
app.route('/make-server-9fd39b98', aircraftRoutes);
app.route('/make-server-9fd39b98/qualifications', qualificationsRoutes);
app.route('/make-server-9fd39b98/positions', positionRoutes);
app.route('/make-server-9fd39b98', inviteRoutes);
app.route('/make-server-9fd39b98', ocrRoutes);

// Default route for unmatched paths
app.all('*', (c) => {
  console.log(`Unmatched route: ${c.req.method} ${c.req.url}`);
  return c.json({ 
    error: 'Route not found',
    method: c.req.method,
    path: c.req.url,
    timestamp: new Date().toISOString()
  }, 404);
});

console.log('🚀 Hono server starting...');

// Initialize Storage buckets
const initializeStorage = async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Storage initialization skipped: Missing Supabase credentials');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user-docs bucket for profile documents
    const bucketName = 'user-docs';
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
      } else {
        console.log(`✅ Created storage bucket: ${bucketName}`);
      }
    } else {
      console.log(`✅ Storage bucket already exists: ${bucketName}`);
    }
  } catch (error) {
    console.error('❌ Storage initialization error:', error);
  }
};

// Validate secrets on startup
const secretsValidation = validateSecrets();
if (!secretsValidation.valid) {
  console.error('❌ Server startup failed: Missing required secrets:');
  console.error(`   Missing: ${secretsValidation.missing.join(', ')}`);
  console.error('   Please check your environment variables or secrets configuration.');
} else {
  console.log('✅ All required secrets are configured');
  // Initialize storage buckets
  initializeStorage();
}

// Debug secrets in development
debugSecrets();

console.log('📍 Available routes:');
console.log('   - /make-server-9fd39b98/health (GET)');
console.log('   - /make-server-9fd39b98/auth/* (Auth routes)');
console.log('   - /make-server-9fd39b98/missions/* (Mission routes)');
console.log('   - /make-server-9fd39b98/crew/* (Crew routes)');
console.log('   - /make-server-9fd39b98/users/* (Users routes - Supabase auth.users table)');
console.log('   - /make-server-9fd39b98/data/* (Data routes)');
console.log('   - /make-server-9fd39b98/seed/* (Seed routes)');
console.log('   - /make-server-9fd39b98/debug/* (Debug routes)');
console.log('   - /make-server-9fd39b98/notifications/* (Notification routes)');
console.log('   - /make-server-9fd39b98/aircraft/* (Aircraft routes)');
console.log('   - /make-server-9fd39b98/qualifications/* (Qualifications routes)');
console.log('   - /make-server-9fd39b98/positions/* (Position routes)');
console.log('   - /make-server-9fd39b98/invite-user (POST) - Invite new users');
console.log('   - /make-server-9fd39b98/ocr-passport (POST) - Process passport OCR');

Deno.serve(app.fetch);