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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Generate a mock access token compatible with browser environment
const generateMockAccessToken = (userId: string, role: string, email: string): string => {
  try {
    // Use btoa (browser-native base64 encoding) instead of Buffer
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: userId,
      email: email,
      iss: 'supabase-demo',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      iat: Math.floor(Date.now() / 1000),
      user_metadata: {
        role: role
      }
    }));
    const signature = 'mock-signature-' + Math.random().toString(36).substr(2, 9);
    return `${header}.${payload}.${signature}`;
  } catch (error) {
    console.error('Error generating mock access token:', error);
    // Fallback to a simple token if encoding fails
    return `mock-token-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    role: 'freelancer' as const,
    user_metadata: {
      name: 'Pierre Dubois',
      role: 'freelancer',
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
  },
  {
    id: 'freelancer-2',
    email: 'captain@freelance.eu',
    password: 'captain123!',
    name: 'Marco Rossi',
    role: 'freelancer' as const,
    user_metadata: {
      name: 'Marco Rossi',
      role: 'freelancer',
      position: 'Freelance Captain',
      type: 'freelancer'
    }
  },
  {
    id: 'freelancer-3',
    email: 'sarah@crewaviation.com',
    password: 'sarah123!',
    name: 'Sarah Mitchell',
    role: 'freelancer' as const,
    user_metadata: {
      name: 'Sarah Mitchell',
      role: 'freelancer',
      position: 'First Officer',
      type: 'freelancer'
    }
  }
];

const STORAGE_KEY = 'crewtech_auth_user';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const checkExistingSession = () => {
      try {
        // Vérifier si nous sommes côté client
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const { user: storedUser, timestamp } = JSON.parse(storedData);
          
          // Check if session is still valid (not expired)
          const currentTime = Date.now();
          if (currentTime - timestamp < SESSION_TIMEOUT) {
            // Session is still valid
            const userData: User = {
              id: storedUser.id,
              email: storedUser.email,
              name: storedUser.name,
              role: storedUser.role,
              user_metadata: storedUser.user_metadata,
              access_token: storedUser.access_token || generateMockAccessToken(storedUser.id, storedUser.role, storedUser.email)
            };
            
            setUser(userData);
            console.log('User session restored from localStorage:', userData);
          } else {
            // Session expired, clear storage
            localStorage.removeItem(STORAGE_KEY);
            console.log('User session expired, cleared from storage');
          }
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      console.log('Attempting local sign in with:', { email, password: password.replace(/./g, '*') });
      
      // Simulate network delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Find user in local users array
      const localUser = LOCAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!localUser) {
        console.log('User not found:', email);
        return {
          success: false,
          error: 'User account not found. Please check your email address.'
        };
      }
      
      if (localUser.password !== password) {
        console.log('Invalid password for user:', email);
        return {
          success: false,
          error: 'Invalid password. Please check your credentials.'
        };
      }
      
      // Create user object for successful login
      const mockAccessToken = generateMockAccessToken(localUser.id, localUser.role, localUser.email);
      const userData: User = {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name,
        role: localUser.role,
        user_metadata: localUser.user_metadata,
        access_token: mockAccessToken
      };
      
      // Store user session in localStorage with timestamp
      if (typeof window !== 'undefined') {
        const sessionData = {
          user: userData,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      }
      
      setUser(userData);
      console.log('Local sign in successful:', userData);
      return { success: true };
      
    } catch (error: any) {
      console.error('Sign in error:', error);
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
      console.log('Signing out user...');
      
      // Clear user session from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      
      setUser(null);
      console.log('Local sign out successful');
    } catch (error) {
      console.error('Signout error:', error);
      // Even if there's an error, clear the local state
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};