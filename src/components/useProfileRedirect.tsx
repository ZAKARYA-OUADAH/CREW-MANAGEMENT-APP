import { useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'freelancer';
  user_metadata?: any;
  access_token?: string;
}

export function useProfileRedirect() {

  const redirectToDashboard = useCallback((targetUser: User) => {
    const currentUser = targetUser;
    
    if (!currentUser) {
      console.warn('⚠️ No user available for redirect');
      return;
    }

    console.log('🚀 Redirecting user to dashboard:', {
      email: currentUser.email,
      role: currentUser.role,
      name: currentUser.name
    });

    // Get the appropriate dashboard route based on user role
    const getDashboardRoute = () => {
      switch (currentUser.role) {
        case 'admin':
          return '/'; // Admin dashboard is at root
        case 'freelancer':
          return '/'; // Freelancer dashboard is also at root (different layout)
        default:
          return '/';
      }
    };

    const targetRoute = getDashboardRoute();

    // Use window.location for a complete navigation
    // This ensures all components are properly re-initialized
    setTimeout(() => {
      window.location.href = window.location.origin + targetRoute;
    }, 100);
  }, []);

  const getWelcomeMessage = useCallback((targetUser: User) => {
    const currentUser = targetUser;
    
    if (!currentUser) return 'Bienvenue dans CrewTech';

    const roleName = currentUser.role === 'admin' ? 'Administrateur' : 'Freelancer';
    const userName = currentUser.name || currentUser.email;
    
    return `Bienvenue ${userName} - ${roleName}`;
  }, []);

  const getDashboardFeatures = useCallback((targetUser: User) => {
    const currentUser = targetUser;
    
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      return [
        'Gestion des équipages',
        'Planification des missions',
        'Validation des documents',
        'Export financier',
        'Supervision globale'
      ];
    } else {
      return [
        'Missions disponibles',
        'Profil personnel',
        'Documents de vol',
        'Historique des missions',
        'Notifications'
      ];
    }
  }, []);

  return {
    redirectToDashboard,
    getWelcomeMessage,
    getDashboardFeatures
  };
}