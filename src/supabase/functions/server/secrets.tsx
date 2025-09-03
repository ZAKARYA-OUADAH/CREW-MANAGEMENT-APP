/* Server-side secrets configuration for CrewTech Edge Functions */

// Environment variables for server-side operations
export const serverSecrets = {
  // Supabase URLs
  SUPABASE_URL: `https://nrvzifxdmllgcidfhlzh.supabase.co`,
  
  // Public anon key (for client-side operations)
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY2OTAsImV4cCI6MjA3MTk3MjY5MH0.LQkxhokeAsrpQDKmBQ4f6mpP0XJlwRjXNEGKjOM1xVs",
  
  // Service role key (for server-side database operations with full access)
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5NjY5MCwiZXhwIjoyMDcxOTcyNjkwfQ.dCx1BUVy4K7YecsyNN5pAIJ_CKLgO-s5KM5WKIZQyWs"
};

// Helper function to get environment variables with fallbacks
export const getEnvVar = (key: keyof typeof serverSecrets): string => {
  // Try to get from Deno environment first (for production deployment)
  const envValue = Deno.env.get(key);
  if (envValue) {
    return envValue;
  }
  
  // Fallback to hardcoded values (for development and as backup)
  return serverSecrets[key];
};

// Validation function to ensure all required secrets are available
export const validateSecrets = (): { valid: boolean; missing: string[] } => {
  const requiredSecrets = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ] as const;
  
  const missing: string[] = [];
  
  for (const secret of requiredSecrets) {
    const value = getEnvVar(secret);
    if (!value || value.length < 10) {
      missing.push(secret);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
};

// Export individual secrets for convenience
export const SUPABASE_URL = getEnvVar('SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY');
export const SUPABASE_SERVICE_ROLE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

// Debug function (only in development)
export const debugSecrets = () => {
  const isLocal = Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;
  
  if (isLocal) {
    console.log('🔐 Secrets Debug Info:');
    console.log(`  SUPABASE_URL: ${SUPABASE_URL}`);
    console.log(`  SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
    
    const validation = validateSecrets();
    console.log(`  Validation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
    if (!validation.valid) {
      console.log(`  Missing: ${validation.missing.join(', ')}`);
    }
  }
};