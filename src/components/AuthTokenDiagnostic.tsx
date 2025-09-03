import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from './AuthProvider';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Key, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Info,
  User,
  Shield
} from 'lucide-react';

interface TokenInfo {
  isValid: boolean;
  header?: any;
  payload?: any;
  expiresAt?: Date;
  isExpired?: boolean;
  timeToExpiry?: string;
}

export default function AuthTokenDiagnostic() {
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const parseJWT = (token: string): TokenInfo => {
    try {
      // Split the token into parts
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { isValid: false };
      }

      // Decode header and payload
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      // Check expiration
      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
      const isExpired = expiresAt ? expiresAt < new Date() : false;
      
      // Calculate time to expiry
      let timeToExpiry = '';
      if (expiresAt) {
        const timeDiff = expiresAt.getTime() - new Date().getTime();
        if (timeDiff > 0) {
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          timeToExpiry = `${hours}h ${minutes}m`;
        } else {
          timeToExpiry = 'Expired';
        }
      }

      return {
        isValid: true,
        header,
        payload,
        expiresAt,
        isExpired,
        timeToExpiry
      };
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return { isValid: false };
    }
  };

  const analyzeToken = () => {
    setAnalyzing(true);
    
    setTimeout(() => {
      if (user?.access_token) {
        const info = parseJWT(user.access_token);
        setTokenInfo(info);
      } else {
        setTokenInfo(null);
      }
      setAnalyzing(false);
    }, 500);
  };

  useEffect(() => {
    if (user?.access_token) {
      analyzeToken();
    }
  }, [user?.access_token]);

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">VALID</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">ERROR</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">WARNING</Badge>;
    }
  };

  const getOverallStatus = (): 'success' | 'error' | 'warning' => {
    if (!user) return 'error';
    if (!user.access_token) return 'error';
    if (!tokenInfo) return 'warning';
    if (!tokenInfo.isValid) return 'error';
    if (tokenInfo.isExpired) return 'error';
    return 'success';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Authentication Token Diagnostic
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeToken}
            disabled={analyzing}
          >
            {analyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {analyzing ? 'Analyzing...' : 'Re-analyze'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon(getOverallStatus())}
          <div className="text-sm">
            <span className="font-medium">Token Status: </span>
            {getStatusBadge(getOverallStatus())}
          </div>
        </div>

        {/* User Information */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">User Information</span>
            </div>
            {user ? getStatusIcon('success') : getStatusIcon('error')}
          </div>
          
          {user ? (
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">ID:</span> {user.id}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Name:</span> {user.name || 'Not set'}</p>
              <p><span className="font-medium">Role:</span> {user.role}</p>
            </div>
          ) : (
            <p className="text-sm text-red-600">No user authenticated</p>
          )}
        </div>

        {/* Access Token Information */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">Access Token</span>
            </div>
            {user?.access_token ? getStatusIcon('success') : getStatusIcon('error')}
          </div>
          
          {user?.access_token ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Token Length: {user.access_token.length} characters
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTokenDetails(!showTokenDetails)}
                >
                  {showTokenDetails ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {showTokenDetails && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                  {user.access_token}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-600">No access token available</p>
          )}
        </div>

        {/* Token Analysis */}
        {tokenInfo && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">Token Analysis</span>
            </div>
            
            {tokenInfo.isValid ? (
              <div className="space-y-3">
                {/* Expiration Info */}
                {tokenInfo.expiresAt && (
                  <div className={`p-2 rounded ${tokenInfo.isExpired ? 'bg-red-50' : 'bg-green-50'}`}>
                    <p className={`text-sm ${tokenInfo.isExpired ? 'text-red-700' : 'text-green-700'}`}>
                      <span className="font-medium">Expires:</span> {formatDate(tokenInfo.expiresAt)}
                      {tokenInfo.timeToExpiry && (
                        <span className="ml-2">({tokenInfo.timeToExpiry})</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Token Claims */}
                {tokenInfo.payload && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">
                      Show Token Claims
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                      {JSON.stringify(tokenInfo.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-600">Token is not in valid JWT format</p>
            )}
          </div>
        )}

        {/* Recommendations */}
        {getOverallStatus() !== 'success' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Issues detected:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {!user && <li>User not authenticated</li>}
                  {user && !user.access_token && <li>No access token available</li>}
                  {tokenInfo && !tokenInfo.isValid && <li>Access token is malformed</li>}
                  {tokenInfo && tokenInfo.isExpired && <li>Access token has expired</li>}
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  Try signing out and signing back in to refresh your authentication token.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {analyzing && (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Analyzing token...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}