// Supabase client configuration for CrewTech
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Create the real Supabase client
const supabaseClient = createSupabaseClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Function to create client (for consistency with previous API)
export const createClient = () => {
  return supabaseClient;
};

// Export the main client
export const supabase = supabaseClient;

// Default export
export default supabaseClient;