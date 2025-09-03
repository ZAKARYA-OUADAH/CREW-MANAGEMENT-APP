import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { checkMissionsForValidation } from './MissionOrderService';

// Component to automatically check for missions that need validation
// This runs periodically for admin users to update mission statuses
export default function MissionValidationChecker() {
  const { user } = useAuth();

  useEffect(() => {
    // Only run for admin users
    if (user?.role !== 'admin') return;

    const checkMissions = async () => {
      try {
        await checkMissionsForValidation();
        console.log('Mission validation check completed');
      } catch (error) {
        console.error('Error checking missions for validation:', error);
      }
    };

    // Check immediately on mount
    checkMissions();

    // Set up periodic checking (every 30 minutes)
    const interval = setInterval(checkMissions, 30 * 60 * 1000);

    // Also check when the user becomes active (when they return to the tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkMissions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.role]);

  // This component doesn't render anything
  return null;
}

// Hook for components that need to trigger validation checks manually
export const useMissionValidationChecker = () => {
  const { user } = useAuth();

  const triggerValidationCheck = async () => {
    if (user?.role !== 'admin') {
      console.warn('Only admin users can trigger validation checks');
      return;
    }

    try {
      await checkMissionsForValidation();
      console.log('Manual mission validation check completed');
      
      // Trigger refresh of mission data
      window.dispatchEvent(new CustomEvent('missionOrderUpdated'));
    } catch (error) {
      console.error('Error triggering validation check:', error);
      throw error;
    }
  };

  return { triggerValidationCheck };
};