import { useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { localApiClient } from '../utils/local/LocalClient';

// Utility function to make fetch requests with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 8000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
};

// Check if Supabase is properly configured
const isSupabaseConfigured = (): boolean => {
  return !!(
    projectId && 
    publicAnonKey && 
    projectId !== 'your-project-id' && 
    publicAnonKey.length > 50 &&
    projectId.length > 10
  );
};

// Check if Supabase is accessible (simple connectivity test)
const testSupabaseConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(
      `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
      {
        headers: { 'Content-Type': 'application/json' },
      },
      5000 // Short timeout for connectivity test
    );
    return response.ok;
  } catch (error) {
    console.log(`🔄 [DataSync] Connectivity test failed: ${error.message}`);
    return false;
  }
};

export default function DataSynchronizationService() {
  const { user } = useAuth();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<Date | null>(null);
  const consecutiveFailuresRef = useRef<number>(0);
  const isOnlineRef = useRef<boolean>(false);

  const performSync = async () => {
    if (!user || user.role !== 'admin') {
      return;
    }

    // Check configuration first
    if (!isSupabaseConfigured()) {
      console.log('🔄 [DataSync] Supabase not configured - skipping sync');
      consecutiveFailuresRef.current = 0; // Reset failures since this isn't a real failure
      return;
    }

    console.log('🔄 [DataSync] Starting background synchronization...');
    
    try {
      // Step 1: Test basic connectivity
      const isConnected = await testSupabaseConnectivity();
      
      if (!isConnected) {
        console.log('🔄 [DataSync] Supabase not reachable - working in offline mode');
        consecutiveFailuresRef.current++;
        isOnlineRef.current = false;
        
        // If we've had too many consecutive failures, reduce sync frequency
        if (consecutiveFailuresRef.current > 5) {
          console.log('🔄 [DataSync] Multiple failures detected - reducing sync frequency');
        }
        
        return;
      }

      // Step 2: Check database status
      const statusResponse = await fetchWithTimeout(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/seed/status-public`,
        {
          headers: { 'Content-Type': 'application/json' },
        },
        6000
      );

      if (!statusResponse.ok) {
        console.log(`🔄 [DataSync] Status endpoint failed: HTTP ${statusResponse.status}`);
        consecutiveFailuresRef.current++;
        return;
      }

      const supabaseData = await statusResponse.json();
      const supabaseMissionsCount = supabaseData.database_status?.missions || 0;
      const supabaseUsersCount = supabaseData.database_status?.users || 0;
      
      isOnlineRef.current = true;
      consecutiveFailuresRef.current = 0; // Reset failure counter on success

      console.log(`🔄 [DataSync] Supabase has ${supabaseUsersCount} users, ${supabaseMissionsCount} missions`);

      // Step 3: Check LocalClient data
      let localMissionsCount = 0;
      try {
        const localMissionsResult = await localApiClient.getMissions();
        localMissionsCount = localMissionsResult.success ? localMissionsResult.data.length : 0;
        console.log(`🔄 [DataSync] LocalClient has ${localMissionsCount} missions`);
      } catch (localError) {
        console.log(`🔄 [DataSync] LocalClient check failed: ${localError.message}`);
      }

      // Step 4: Initialize Supabase if empty
      if (supabaseMissionsCount === 0 && supabaseUsersCount === 0) {
        console.log('🔄 [DataSync] No data found, initializing Supabase...');
        
        try {
          const initResponse = await fetchWithTimeout(
            `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/seed/auto-seed`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            },
            12000 // Longer timeout for initialization
          );

          if (initResponse.ok) {
            const initData = await initResponse.json();
            console.log(`✅ [DataSync] Initialized Supabase with ${initData.data?.users_created || 0} users and ${initData.data?.missions_created || 0} missions`);
          } else {
            console.log(`⚠️ [DataSync] Initialization failed: HTTP ${initResponse.status}`);
          }
        } catch (initError) {
          console.log(`⚠️ [DataSync] Initialization error: ${initError.message}`);
        }
      }

      // Step 5: Sync from Supabase to LocalClient if needed
      if (supabaseMissionsCount > localMissionsCount) {
        console.log(`🔄 [DataSync] Syncing ${supabaseMissionsCount - localMissionsCount} missions from Supabase to LocalClient`);
        
        try {
          const missionsResponse = await fetchWithTimeout(
            `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
            },
            8000
          );

          if (missionsResponse.ok) {
            const missionsData = await missionsResponse.json();
            const missions = missionsData.missions || [];
            
            let syncedCount = 0;
            for (const mission of missions) {
              try {
                // Check if mission already exists in LocalClient to avoid duplicates
                const existingResult = await localApiClient.getMission(mission.id);
                if (!existingResult.success) {
                  await localApiClient.createMission(mission);
                  syncedCount++;
                }
              } catch (syncError) {
                console.log(`🔄 [DataSync] Failed to sync mission ${mission.id}:`, syncError.message);
              }
            }
            
            if (syncedCount > 0) {
              console.log(`✅ [DataSync] Successfully synced ${syncedCount} new missions`);
            } else {
              console.log(`✅ [DataSync] All missions already synchronized`);
            }
          } else {
            console.log(`⚠️ [DataSync] Failed to fetch missions: HTTP ${missionsResponse.status}`);
          }
        } catch (syncError) {
          console.log(`⚠️ [DataSync] Mission sync error: ${syncError.message}`);
        }
      }

      lastSyncRef.current = new Date();
      console.log('✅ [DataSync] Background synchronization completed successfully');

    } catch (error) {
      console.log(`🔄 [DataSync] Background sync error: ${error.message}`);
      consecutiveFailuresRef.current++;
      isOnlineRef.current = false;
      
      // Log more specific error information
      if (error.message.includes('timed out')) {
        console.log('🔄 [DataSync] Timeout detected - server may be slow');
      } else if (error.message.includes('Failed to fetch')) {
        console.log('🔄 [DataSync] Network error - server may be offline');
      } else {
        console.log('🔄 [DataSync] Unexpected error during sync');
      }
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      // Clear any existing interval if user is not admin
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    console.log('🔄 [DataSync] Service initialized for admin user');

    // Perform initial sync after a short delay
    const initialSyncTimeout = setTimeout(() => {
      performSync();
    }, 3000); // Wait 3 seconds after mount

    // Set up periodic sync with adaptive frequency
    const setupPeriodicSync = () => {
      const getInterval = () => {
        // If we've had many consecutive failures, sync less frequently
        if (consecutiveFailuresRef.current > 5) {
          return 5 * 60 * 1000; // 5 minutes
        } else if (consecutiveFailuresRef.current > 2) {
          return 3 * 60 * 1000; // 3 minutes
        } else {
          return 2 * 60 * 1000; // 2 minutes (default)
        }
      };

      syncIntervalRef.current = setInterval(() => {
        performSync();
        
        // Adjust interval based on current failure count
        const newInterval = getInterval();
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = setInterval(performSync, newInterval);
        }
      }, getInterval());
    };

    setupPeriodicSync();

    // Cleanup on unmount
    return () => {
      clearTimeout(initialSyncTimeout);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      console.log('🔄 [DataSync] Service cleaned up');
    };
  }, [user]);

  // This component doesn't render anything
  return null;
}