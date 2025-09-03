import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './ui/sonner';
import DirectUserCreator from './DirectUserCreator';
import Login from './Login';
import AcceptInvitation from './AcceptInvitation';
import ProfileSetupWizard from './ProfileSetupWizard';
import AutoEdgeFunctionDetector from './AutoEdgeFunctionDetector';

interface UnauthenticatedScreensProps {
  userSetupComplete: boolean;
  showProfileSetup: boolean;
  seedingCredentials: any;
  onUserSetupComplete: (success: boolean, credentials?: any) => void;
  onProfileSetupComplete: () => void;
}

export default function UnauthenticatedScreens({
  userSetupComplete,
  showProfileSetup,
  seedingCredentials,
  onUserSetupComplete,
  onProfileSetupComplete
}: UnauthenticatedScreensProps) {
  // Show DirectUserCreator for initial setup if users haven't been set up yet
  if (!userSetupComplete) {
    return (
      <>
        <div className="space-y-6 p-6">
          <AutoEdgeFunctionDetector />
          <DirectUserCreator onComplete={onUserSetupComplete} />
        </div>
        <Toaster />
      </>
    );
  }

  // Show profile setup if needed
  if (showProfileSetup) {
    return (
      <>
        <ProfileSetupWizard onComplete={onProfileSetupComplete} />
        <Toaster />
      </>
    );
  }

  // Show login screen if no user is authenticated
  return (
    <>
      <Router>
        <div className="space-y-6 p-6">
          <AutoEdgeFunctionDetector />
          <Routes>
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="*" element={<Login seedingCredentials={seedingCredentials} />} />
          </Routes>
        </div>
      </Router>
      <Toaster />
    </>
  );
}