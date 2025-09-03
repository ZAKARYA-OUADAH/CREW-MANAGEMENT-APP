import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'freelancer';
  user_metadata?: any;
  access_token?: string;
}

interface UseUserProfileReturn {
  showProfileSetup: boolean;
  userProfileData: any;
  checkingProfile: boolean;
  setShowProfileSetup: (show: boolean) => void;
}

export function useUserProfile(user: User | null): UseUserProfileReturn {
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);

  // Check if user needs to complete profile setup
  const checkUserProfile = async () => {
    if (!user) return;
    
    try {
      setCheckingProfile(true);
      
      // NOUVEAU: Les admins n'ont jamais besoin de setup de profil
      if (user.role === 'admin') {
        console.log('👑 Admin user detected - skipping profile setup');
        setShowProfileSetup(false);
        setUserProfileData({
          name: user.name,
          email: user.email,
          ...user.user_metadata
        });
        return;
      }
      
      // Logique pour les crews/freelancers uniquement
      const profileComplete = user.user_metadata?.profile_complete || 
                             user.user_metadata?.completion_date ||
                             false;
      
      const hasBasicInfo = user.name || user.email;
      
      console.log('🔍 Checking crew profile completion:', {
        role: user.role,
        profileComplete,
        hasBasicInfo,
        email: user.email,
        name: user.name,
        metadata: user.user_metadata
      });
      
      // Nouveau crew qui n'a pas encore terminé le setup
      if (!profileComplete && hasBasicInfo && user.role === 'freelancer') {
        console.log('🚀 New crew member needs to complete profile setup');
        setShowProfileSetup(true);
        setUserProfileData(null);
      } else {
        // Crew existant ou setup terminé
        console.log('✅ Crew profile is complete or user setup finished');
        setShowProfileSetup(false);
        setUserProfileData({
          name: user.name,
          email: user.email,
          ...user.user_metadata
        });
      }
      
    } catch (error) {
      console.error('Error checking user profile:', error);
      
      // En cas d'erreur réseau, utiliser une logique de fallback plus simple
      // Les admins ne passent jamais par le setup
      if (user.role === 'admin') {
        console.log('👑 Admin fallback - proceeding without profile setup');
        setShowProfileSetup(false);
        setUserProfileData({
          name: user.name || user.user_metadata?.name,
          email: user.email,
          ...user.user_metadata
        });
        return;
      }
      
      // Pour les crews, vérifier si l'utilisateur a un nom et un email au minimum
      const hasBasicInfo = user.name || user.user_metadata?.name || user.email;
      
      if (!hasBasicInfo && user.role === 'freelancer') {
        console.log('🚨 Crew missing basic information, showing profile setup');
        setShowProfileSetup(true);
      } else {
        console.log('✅ Crew has basic information, proceeding without profile setup');
        setShowProfileSetup(false);
        setUserProfileData({
          name: user.name || user.user_metadata?.name,
          email: user.email,
          ...user.user_metadata
        });
      }
    } finally {
      setCheckingProfile(false);
    }
  };

  // Check profile when user changes
  useEffect(() => {
    if (user && !checkingProfile) {
      // Timeout pour éviter les blocages
      const timeoutId = setTimeout(() => {
        checkUserProfile();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  return {
    showProfileSetup,
    userProfileData,
    checkingProfile,
    setShowProfileSetup
  };
}