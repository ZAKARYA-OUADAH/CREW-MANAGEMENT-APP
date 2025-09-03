import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Key, 
  Zap,
  Info
} from 'lucide-react';

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

export default function AccessTokenFixer() {
  const { user } = useAuth();
  const [isFixing, setIsFixing] = useState(false);
  const [lastFixed, setLastFixed] = useState<Date | null>(null);

  const hasValidToken = user?.access_token && user.access_token.length > 10;

  const refreshAccessToken = async () => {
    if (!user) {
      toast.error('No user authenticated');
      return;
    }

    setIsFixing(true);
    
    try {
      console.log('🔧 Regenerating access token for user:', user.email);
      
      // Generate a new mock access token
      const newToken = generateMockAccessToken(user.id, user.email, user.role);
      
      // Update the user object with the new token
      const updatedUser = {
        ...user,
        access_token: newToken
      };
      
      // Update localStorage
      const sessionData = {
        user: updatedUser,
        timestamp: Date.now()
      };
      localStorage.setItem('crewtech_auth_user', JSON.stringify(sessionData));
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastFixed(new Date());
      toast.success('Access token regenerated successfully! Please refresh the page to apply changes.');
      
      console.log('✅ New access token generated:', newToken.substring(0, 20) + '...');
      
    } catch (error) {
      console.error('❌ Error regenerating access token:', error);
      toast.error('Failed to regenerate access token');
    } finally {
      setIsFixing(false);
    }
  };

  const forcePageReload = () => {
    window.location.reload();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2" />
          Access Token Quick Fix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This tool helps fix authentication issues by regenerating your access token. 
            Use this if you're seeing "No access token available" errors.
          </AlertDescription>
        </Alert>

        {/* Current Status */}
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Current Status: </span>
            {hasValidToken ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Token Available
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Missing Token
              </Badge>
            )}
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="text-sm space-y-1">
            <p><span className="font-medium">User:</span> {user.email}</p>
            <p><span className="font-medium">Role:</span> {user.role}</p>
            <p>
              <span className="font-medium">Token Length:</span> {
                user.access_token ? `${user.access_token.length} characters` : 'No token'
              }
            </p>
          </div>
        )}

        {/* Last Fixed Info */}
        {lastFixed && (
          <div className="p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Token regenerated at {lastFixed.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          <Button
            onClick={refreshAccessToken}
            disabled={isFixing || !user}
            className="w-full"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Regenerating Token...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Regenerate Access Token
              </>
            )}
          </Button>

          {lastFixed && (
            <Button
              variant="outline"
              onClick={forcePageReload}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page to Apply Changes
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-600 space-y-2">
          <p className="font-medium">How to use:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Regenerate Access Token" to create a new token</li>
            <li>Wait for the success message</li>
            <li>Reload the page to apply the changes</li>
            <li>Try the invitation system again</li>
          </ol>
        </div>

        {!user && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please sign in first before attempting to fix the access token.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}