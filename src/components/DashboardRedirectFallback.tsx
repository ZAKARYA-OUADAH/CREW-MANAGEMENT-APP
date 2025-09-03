import React, { useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useProfileRedirect } from './useProfileRedirect';

interface DashboardRedirectFallbackProps {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'admin' | 'freelancer';
    user_metadata?: any;
  };
  error?: string;
}

export default function DashboardRedirectFallback({ user, error }: DashboardRedirectFallbackProps) {
  const { redirectToDashboard } = useProfileRedirect();

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      redirectToDashboard(user);
    }, 5000);

    return () => clearTimeout(timer);
  }, [user, redirectToDashboard]);

  const handleManualRedirect = () => {
    redirectToDashboard(user);
  };

  const handleForceReload = () => {
    window.location.href = window.location.origin;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="p-8 text-center space-y-6">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <AlertCircle className="w-16 h-16 text-orange-500" />
          </div>

          {/* Title and Message */}
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Redirection en cours...
            </h1>
            <p className="text-gray-600">
              Votre profil est prêt. Nous vous redirigeons vers votre dashboard.
            </p>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Utilisateur:</p>
              <p className="font-medium text-gray-900">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-500">
                Rôle: {user.role === 'admin' ? 'Administrateur' : 'Freelancer'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleManualRedirect}
              className="w-full"
              size="lg"
            >
              Aller au Dashboard
            </Button>
            
            <Button 
              onClick={handleForceReload}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recharger la page
            </Button>
          </div>

          {/* Auto-redirect info */}
          <p className="text-xs text-gray-400">
            Redirection automatique dans quelques secondes...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}