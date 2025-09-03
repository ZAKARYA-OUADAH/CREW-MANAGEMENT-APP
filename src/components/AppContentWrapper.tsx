import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from './ui/sonner';
import { NotificationProvider } from './NotificationContext';
import { ActivityProvider } from './ActivityService';
import { DocumentNotificationProvider } from './DocumentNotificationService';
import { useAuth } from './AuthProvider';
import { SupabaseDataProvider } from './SupabaseDataProvider';
import LoadingScreen from './LoadingScreen';
import UnauthenticatedScreens from './UnauthenticatedScreens';
import AdminBackgroundServices from './AdminBackgroundServices';
import SupabaseDirectBanner from './SupabaseDirectBanner';
import AppRoutes from './AppRoutes';
import { useUserProfile } from './useUserProfile';
import DashboardRedirectFallback from './DashboardRedirectFallback';
import ErrorSuppressor from './ErrorSuppressor';

export default function AppContentWrapper() {
  const { user, loading, signOut } = useAuth();
  const [userSetupComplete, setUserSetupComplete] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  
  // Only call useUserProfile when user is authenticated
  const { 
    showProfileSetup, 
    checkingProfile, 
    setShowProfileSetup 
  } = useUserProfile(user);

  const handleProfileSetupComplete = useCallback(() => {
    console.log('✅ Profile setup completed for user:', user?.email, 'role:', user?.role);
    setShowProfileSetup(false);
    
    // Simple direct redirect without complex error handling
    console.log('🔄 Initiating redirect to dashboard for', user?.role || 'unknown role', '...');
    window.location.href = window.location.origin;
  }, [setShowProfileSetup, user]);

  // Show loading state during initial auth check or profile check
  if (loading || (checkingProfile && user)) {
    return (
      <LoadingScreen 
        message={loading ? 'Loading CrewTech...' : 'Checking profile...'} 
      />
    );
  }

  // Show redirect fallback if there's a redirect error
  if (redirectError && user) {
    return (
      <DashboardRedirectFallback 
        user={user} 
        error={redirectError}
      />
    );
  }

  // Show unauthenticated screens (login, profile setup)
  if (!user || showProfileSetup) {
    return (
      <>
        <ErrorSuppressor showSuppressedCount={false} />
        <UnauthenticatedScreens
          userSetupComplete={userSetupComplete}
          showProfileSetup={showProfileSetup && !!user}
          seedingCredentials={null}
          onUserSetupComplete={() => {}}
          onProfileSetupComplete={handleProfileSetupComplete}
        />
        <Toaster />
      </>
    );
  }

  // Show main application for authenticated users
  return (
    <SupabaseDataProvider>
      <NotificationProvider>
        <ActivityProvider>
          <DocumentNotificationProvider>
            <ErrorSuppressor showSuppressedCount={false} />
            <AdminBackgroundServices userRole={user.role} />
            <SupabaseDirectBanner />
            <Router>
              <AppRoutes user={user} onLogout={signOut} />
            </Router>
            <Toaster />
          </DocumentNotificationProvider>
        </ActivityProvider>
      </NotificationProvider>
    </SupabaseDataProvider>
  );
}