import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'freelancer';
  user_metadata?: any;
  access_token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  useSupabaseAuth: boolean;
  toggleAuthMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Generate a mock access token that looks real
const generateMockAccessToken = (userId: string, email: string, role: string): string => {
  try {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const payload = {
      sub: userId,
      email: email,
      role: role,
      iss: 'supabase-demo',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      iat: Math.floor(Date.now() / 1000),
      user_metadata: { role, email }
    };
    
    // Base64 encode header and payload (mock JWT structure)
    const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    // Generate a mock signature
    const signature = btoa(`mock-sig-${userId}-${Date.now()}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  } catch (error) {
    console.error('Error generating mock token:', error);
    return `mock-token-${userId}-${Date.now()}`;
  }
};

// Predefined users for local authentication
const LOCAL_USERS = [
  {
    id: 'admin-1',
    email: 'admin@crewtech.fr',
    password: 'admin123!',
    name: 'Sophie Laurent',
    role: 'admin' as const,
    user_metadata: {
      name: 'Sophie Laurent',
      role: 'admin',
      position: 'Operations Manager'
    }
  },
  {
    id: 'internal-1',
    email: 'internal@crewtech.fr',
    password: 'internal123!',
    name: 'Pierre Dubois',
    role: 'admin' as const, // Changed to admin for testing purposes
    user_metadata: {
      name: 'Pierre Dubois',
      role: 'admin',
      position: 'Internal Captain',
      type: 'internal'
    }
  },
  {
    id: 'freelancer-1',
    email: 'freelancer@aviation.com',
    password: 'freelancer123!',
    name: 'Lisa Anderson',
    role: 'freelancer' as const,
    user_metadata: {
      name: 'Lisa Anderson',
      role: 'freelancer',
      position: 'Flight Attendant',
      type: 'freelancer'
    }
  }
];

const STORAGE_KEY = 'crewtech_auth_user';
const AUTH_MODE_KEY = 'crewtech_auth_mode';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [useSupabaseAuth, setUseSupabaseAuth] = useState(false);

  useEffect(() => {
    // Check authentication mode preference
    const savedAuthMode = localStorage.getItem(AUTH_MODE_KEY);
    if (savedAuthMode === 'supabase') {
      setUseSupabaseAuth(true);
    }

    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const { user: storedUser, timestamp } = JSON.parse(storedData);
        
        // Check if session is still valid (not expired)
        const currentTime = Date.now();
        if (currentTime - timestamp < SESSION_TIMEOUT) {
          // Session is still valid, ensure access token is present
          let accessToken = storedUser.access_token;
          if (!accessToken) {
            accessToken = generateMockAccessToken(storedUser.id, storedUser.email, storedUser.role);
          }
          
          const userData: User = {
            id: storedUser.id,
            email: storedUser.email,
            name: storedUser.name,
            role: storedUser.role,
            user_metadata: storedUser.user_metadata,
            access_token: accessToken
          };
          
          setUser(userData);
          console.log('✅ User session restored from localStorage with access token');
        } else {
          // Session expired, clear storage
          localStorage.removeItem(STORAGE_KEY);
          console.log('⚠️ User session expired, cleared from storage');
        }
      }
    } catch (error) {
      console.error('❌ Error checking existing session:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  const signInWithSupabase = async (email: string, password: string) => {
    try {
      // Try to get Supabase client
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const supabaseUrl = `https://${projectId}.supabase.co`;
      
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': publicAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token && data.user) {
          const userData: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
            role: data.user.user_metadata?.role || 'freelancer',
            user_metadata: data.user.user_metadata,
            access_token: data.access_token
          };
          return { success: true, userData };
        }
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Supabase auth error:', error);
      return { success: false, error: 'Authentication service unavailable' };
    }
  };

  const signInWithLocal = async (email: string, password: string) => {
    // Find user in local users array
    const localUser = LOCAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!localUser) {
      return {
        success: false,
        error: 'User account not found. Please check your email address.'
      };
    }
    
    if (localUser.password !== password) {
      return {
        success: false,
        error: 'Invalid password. Please check your credentials.'
      };
    }
    
    // Create user object for successful login
    const mockAccessToken = generateMockAccessToken(localUser.id, localUser.email, localUser.role);
    const userData: User = {
      id: localUser.id,
      email: localUser.email,
      name: localUser.name,
      role: localUser.role,
      user_metadata: localUser.user_metadata,
      access_token: mockAccessToken
    };
    
    return { success: true, userData };
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      console.log('🔐 Attempting sign in with:', { 
        email, 
        mode: useSupabaseAuth ? 'Supabase' : 'Local',
        password: password.replace(/./g, '*') 
      });
      
      // Simulate network delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let result;
      if (useSupabaseAuth) {
        result = await signInWithSupabase(email, password);
        // Fallback to local if Supabase fails
        if (!result.success) {
          console.log('⚠️ Supabase auth failed, trying local auth...');
          result = await signInWithLocal(email, password);
        }
      } else {
        result = await signInWithLocal(email, password);
      }
      
      if (result.success && result.userData) {
        // Store user session in localStorage with timestamp
        const sessionData = {
          user: result.userData,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        
        setUser(result.userData);
        console.log('✅ Sign in successful:', {
          email: result.userData.email,
          role: result.userData.role,
          hasAccessToken: !!result.userData.access_token
        });
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
      
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      return { 
        success: false, 
        error: error.message || 'An unexpected error occurred during authentication' 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 Signing out user...');
      
      // Clear user session from localStorage
      localStorage.removeItem(STORAGE_KEY);
      
      setUser(null);
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Signout error:', error);
      // Even if there's an error, clear the local state
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const toggleAuthMode = () => {
    const newMode = !useSupabaseAuth;
    setUseSupabaseAuth(newMode);
    localStorage.setItem(AUTH_MODE_KEY, newMode ? 'supabase' : 'local');
    console.log(`🔄 Switched to ${newMode ? 'Supabase' : 'Local'} authentication mode`);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    useSupabaseAuth,
    toggleAuthMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};