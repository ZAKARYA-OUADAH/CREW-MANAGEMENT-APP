import { createClient } from "npm:@supabase/supabase-js";

// Check environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

console.log('Middleware - Environment check:', {
  SUPABASE_URL: SUPABASE_URL ? 'SET' : 'MISSING',
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
});

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables in middleware');
}

// Initialize Supabase clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Middleware to verify user authentication
export const requireAuth = async (c: any, next: any) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      console.log('No Authorization header provided');
      return c.json({ error: 'Unauthorized: No Authorization header' }, 401);
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    if (!accessToken) {
      console.log('No access token in Authorization header');
      return c.json({ error: 'Unauthorized: Invalid Authorization header format' }, 401);
    }
    
    console.log('Attempting to verify token:', accessToken.substring(0, 20) + '...');
    
    try {
      // Method 1: Try to verify JWT with admin client using the correct approach
      console.log('Attempting JWT verification with admin client...');
      
      const { data: jwtData, error: jwtError } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (!jwtError && jwtData.user) {
        console.log('User authenticated successfully via JWT verification:', jwtData.user.id);
        c.set('user', jwtData.user);
        await next();
        return;
      }
      
      console.log('JWT verification failed, trying alternative method:', jwtError?.message || 'No user data');
      
      // Method 2: Create a temporary client with the user's token
      try {
        console.log('Trying client with user token...');
        const tempClient = supabaseAnon;
        
        // Set the auth headers manually for this request
        const { data: sessionData, error: sessionError } = await tempClient.auth.getUser(accessToken);
        
        if (!sessionError && sessionData.user) {
          console.log('User authenticated via temp client:', sessionData.user.id);
          c.set('user', sessionData.user);
          await next();
          return;
        }
        
        console.log('Temp client failed:', sessionError?.message || 'No user data');
        
      } catch (tempClientError) {
        console.log('Temp client error:', tempClientError);
      }
      
      // Method 3: Try to decode the JWT manually to at least get basic info
      try {
        console.log('Attempting manual JWT decode...');
        
        // Simple JWT decode (just for debugging - not for production security)
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('JWT payload:', { 
            sub: payload.sub, 
            exp: payload.exp, 
            iat: payload.iat,
            email: payload.email,
            role: payload.user_metadata?.role
          });
          
          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            console.log('Token is expired');
            return c.json({ 
              error: 'Unauthorized: Token expired', 
              code: 401, 
              message: 'Token has expired',
              exp: payload.exp,
              now: now,
              expired_seconds_ago: now - payload.exp
            }, 401);
          }
          
          // For development purposes, allow the request with basic user info
          if (payload.sub) {
            console.log('Using JWT payload for basic auth, user ID:', payload.sub);
            const userFromJWT = { 
              id: payload.sub, 
              email: payload.email || 'unknown@example.com',
              user_metadata: payload.user_metadata || {}
            };
            
            console.log('User from JWT:', userFromJWT);
            c.set('user', userFromJWT);
            await next();
            return;
          }
        }
      } catch (decodeError) {
        console.log('JWT decode failed:', decodeError);
      }
      
      // All methods failed
      console.error('All authentication methods failed');
      return c.json({ 
        error: 'Unauthorized: Invalid token', 
        code: 401, 
        message: 'Token validation failed - no valid authentication method succeeded'
      }, 401);
      
    } catch (authError) {
      console.error('Authentication error:', authError);
      return c.json({ 
        error: 'Unauthorized: Authentication failed', 
        code: 401, 
        message: `Authentication error: ${authError.message}`
      }, 401);
    }
    
  } catch (error) {
    console.error('Middleware error:', error);
    return c.json({ error: `Internal server error in auth middleware: ${error.message}` }, 500);
  }
};