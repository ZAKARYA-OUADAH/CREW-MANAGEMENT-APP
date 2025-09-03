import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { NotificationProvider } from './components/NotificationContext';
import LoadingScreen from './components/LoadingScreen';
import Login from './components/Login';
import AppRoutes from './components/AppRoutes';

function AppContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading CrewTech..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Login seedingCredentials={null} />
      </div>
    );
  }

  return (
    <Router>
      <NotificationProvider>
        <AppRoutes user={user} onLogout={signOut} />
      </NotificationProvider>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}