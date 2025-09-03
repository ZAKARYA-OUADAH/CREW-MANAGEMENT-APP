// React hooks for mission orders
import { useState, useEffect } from 'react';
import type { MissionOrder } from './MissionOrderTypes';
import { getMissionOrdersForUser } from '../MissionOrderService';

// Hook for using mission orders
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