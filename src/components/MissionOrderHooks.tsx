// React hooks for mission orders
import { useState, useEffect } from 'react';
import type { MissionOrder } from './MissionOrderTypes';
import { getMissionOrdersForUser, getAllMissionOrders } from './MissionOrderService';

// Hook for using mission orders (for specific user)
export const useMissionOrders = (userId?: string) => {
  const [missionOrders, setMissionOrders] = useState<MissionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshMissionOrders = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('useMissionOrders: Refreshing missions for user:', userId);
      const missions = await getMissionOrdersForUser(userId);
      console.log('useMissionOrders: Got missions:', missions);
      setMissionOrders(missions);
    } catch (error) {
      console.error('useMissionOrders: Error fetching missions:', error);
      setMissionOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMissionOrders();
  }, [userId]);

  return { missionOrders, loading, refreshMissionOrders };
};

// Hook for using all mission orders (for admin)
export const useAllMissionOrders = () => {
  const [missionOrders, setMissionOrders] = useState<MissionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshMissionOrders = async () => {
    console.log('=== useAllMissionOrders: Starting refresh ===');
    try {
      setLoading(true);
      console.log('useAllMissionOrders: Calling getAllMissionOrders');
      const missions = await getAllMissionOrders();
      console.log('useAllMissionOrders: Received', missions.length, 'missions');
      console.log('useAllMissionOrders: Mission IDs:', missions.map(m => m.id));
      setMissionOrders(missions);
    } catch (error) {
      console.error('useAllMissionOrders: Error in refreshMissionOrders:', error);
      setMissionOrders([]);
    } finally {
      setLoading(false);
      console.log('useAllMissionOrders: Refresh completed, loading set to false');
    }
  };

  useEffect(() => {
    console.log('useAllMissionOrders: useEffect triggered, calling refreshMissionOrders');
    refreshMissionOrders();
  }, []);

  console.log('useAllMissionOrders: Hook returning', {
    missionOrdersCount: missionOrders.length, 
    loading
  });

  return { missionOrders, loading, refreshMissionOrders };
};

// Hook for pending validation missions
export const usePendingValidationMissions = (userId: string) => {
  const [pendingMissions, setPendingMissions] = useState<MissionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingMissions = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const missions = await getMissionOrdersForUser(userId);
        const pending = missions.filter(m => m.status === 'pending_validation');
        setPendingMissions(pending);
      } catch (error) {
        console.error('Error fetching pending validation missions:', error);
        setPendingMissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingMissions();
  }, [userId]);

  return { pendingMissions, loading };
};