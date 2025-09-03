import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { CheckCircle, ArrowRight, Users, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { useProfileRedirect } from './useProfileRedirect';

interface ProfileCompletionRedirectProps {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'admin' | 'freelancer';
    user_metadata?: any;
  };
  onComplete: () => void;
}

export default function ProfileCompletionRedirect({ user, onComplete }: ProfileCompletionRedirectProps) {
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Simple redirect function without using hooks
  const redirectToDashboard = (targetUser: typeof user) => {
    console.log('🚀 Redirecting user to dashboard:', {
      email: targetUser.email,
      role: targetUser.role,
      name: targetUser.name
    });

    // Use window.location for a complete navigation
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 100);
  };

  const getDashboardInfo = () => {
    const features = user.role === 'admin' 
      ? ['Gestion des équipages', 'Planification des missions', 'Validation des documents', 'Export financier', 'Supervision globale']
      : ['Missions disponibles', 'Profil personnel', 'Documents de vol', 'Historique des missions', 'Notifications'];
    
    if (user.role === 'admin') {
      return {
        title: 'CrewTech Admin',
        description: 'Votre profil administrateur a été configuré avec succès. Vous allez être redirigé vers le tableau de bord administrateur.',
        icon: <Settings className="w-8 h-8 text-blue-600" />,
        route: '/',
        features: features
      };
    } else {
      return {
        title: 'CrewTech Crew',
        description: 'Votre profil freelancer a été configuré avec succès. Vous allez être redirigé vers le tableau de bord crew.',
        icon: <Users className="w-8 h-8 text-green-600" />,
        route: '/',
        features: features
      };
    }
  };

  const dashboardInfo = getDashboardInfo();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          clearInterval(timer);
          // Use the redirect hook for better navigation
          setTimeout(() => {
            redirectToDashboard(user);
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  const handleManualRedirect = () => {
    setIsRedirecting(true);
    redirectToDashboard(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle className="w-16 h-16 text-green-500 animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-green-100 animate-ping" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Profil Configuré !
            </h1>
            <p className="text-gray-600">
              Félicitations {user.name || user.email}
            </p>
          </div>

          {/* Dashboard Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-center space-x-2">
              {dashboardInfo.icon}
              <h3 className="font-medium text-gray-900">
                {dashboardInfo.title}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600">
              {dashboardInfo.description}
            </p>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {dashboardInfo.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-1 text-xs text-gray-500">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Countdown */}
          {!isRedirecting ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
              </p>
              
              <Button 
                onClick={handleManualRedirect}
                className="w-full"
                size="lg"
              >
                Accéder au Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
              <p className="text-sm text-gray-500">
                Redirection en cours...
              </p>
            </div>
          )}

          {/* User Info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
              <span>Connecté en tant que:</span>
              <span className="font-medium text-gray-600">
                {user.role === 'admin' ? 'Administrateur' : 'Freelancer'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}