import { useState, useEffect, useCallback, useMemo } from 'react';

// Get Supabase config
const getSupabaseConfig = async () => {
  try {
    const { projectId, publicAnonKey } = await import('../utils/supabase/info');
    return {
      url: `https://${projectId}.supabase.co`,
      key: publicAnonKey
    };
  } catch (error) {
    console.error('Failed to load Supabase config:', error);
    throw new Error('Supabase configuration not available');
  }
};

// Types
export interface Mission {
  id: string;
  mission_number: string;
  client: string;
  aircraft_id?: string;
  aircraft_type: string;
  aircraft_registration?: string;
  status: 'pending' | 'confirmed' | 'crew_assigned' | 'in_progress' | 'completed' | 'cancelled';
  departure: {
    airport: string;
    date: string;
    time: string;
  };
  arrival: {
    airport: string;
    date: string;
    time: string;
  };
  budget?: number;
  estimated_cost?: number;
  actual_cost?: number;
  billing_type: 'direct' | 'finance';
  validation_status: 'pending' | 'validated' | 'rejected';
  owner_approval: 'pending' | 'approved' | 'rejected';
  assigned_crew: Record<string, string[]>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessedMission extends Mission {
  assignedCrewMembers: CrewMember[];
}

export interface CrewMember {
  id: string;
  name: string;
  email: string;
  position: string;
  role: 'internal' | 'freelancer';
}

export interface UseMissionsDataParams {
  statusFilter?: string;
  searchQuery?: string;
}

export interface UseMissionsDataReturn {
  missions: ProcessedMission[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateMissionStatus: (missionId: string, newStatus: string) => Promise<void>;
  deleteMission: (missionId: string) => Promise<void>;
  getMissionById: (id: string) => ProcessedMission | undefined;
  getPendingMissions: () => ProcessedMission[];
  getActiveMissions: () => ProcessedMission[];
  getCompletedMissions: () => ProcessedMission[];
}

export function useMissionsData({
  statusFilter,
  searchQuery
}: UseMissionsDataParams = {}): UseMissionsDataReturn {

  const [missions, setMissions] = useState<Mission[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback mock data
  const fallbackMissions: Mission[] = [
    {
      id: 'mission-001',
      mission_number: 'CT-2024-001',
      client: 'Air France Business',
      aircraft_type: 'Citation CJ3+',
      status: 'in_progress',
      departure: {
        airport: 'LFPB',
        date: '2024-01-20',
        time: '14:00'
      },
      arrival: {
        airport: 'EGLL',
        date: '2024-01-20',
        time: '15:30'
      },
      budget: 15000,
      estimated_cost: 14500,
      actual_cost: null,
      billing_type: 'direct',
      validation_status: 'validated',
      owner_approval: 'approved',
      assigned_crew: {
        'captain': ['crew-001'],
        'cabin_crew': ['crew-003']
      },
      notes: 'Vol VIP avec service premium',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T08:00:00Z'
    },
    {
      id: 'mission-002',
      mission_number: 'CT-2024-002',
      client: 'Société Générale',
      aircraft_type: 'King Air 350',
      status: 'confirmed',
      departure: {
        airport: 'LFPO',
        date: '2024-01-22',
        time: '09:00'
      },
      arrival: {
        airport: 'LFMN',
        date: '2024-01-22',
        time: '10:45'
      },
      budget: 12000,
      estimated_cost: 11800,
      actual_cost: null,
      billing_type: 'finance',
      validation_status: 'pending',
      owner_approval: 'pending',
      assigned_crew: {
        'captain': ['crew-002'],
        'first_officer': ['crew-005']
      },
      notes: 'Mission corporate standard',
      created_at: '2024-01-16T14:30:00Z',
      updated_at: '2024-01-18T16:00:00Z'
    },
    {
      id: 'mission-003',
      mission_number: 'CT-2024-003',
      client: 'Private Client Monaco',
      aircraft_type: 'Falcon 7X',
      status: 'pending',
      departure: {
        airport: 'LFMN',
        date: '2024-01-25',
        time: '16:00'
      },
      arrival: {
        airport: 'LOWW',
        date: '2024-01-25',
        time: '18:30'
      },
      budget: 25000,
      estimated_cost: 24200,
      actual_cost: null,
      billing_type: 'direct',
      validation_status: 'pending',
      owner_approval: 'pending',
      assigned_crew: {},
      notes: 'Vol privé avec catering spécial',
      created_at: '2024-01-17T11:15:00Z',
      updated_at: '2024-01-17T11:15:00Z'
    },
    {
      id: 'mission-004',
      mission_number: 'CT-2024-004',
      client: 'Tech Corp International',
      aircraft_type: 'Phenom 300',
      status: 'completed',
      departure: {
        airport: 'LFPG',
        date: '2024-01-18',
        time: '08:00'
      },
      arrival: {
        airport: 'EBBR',
        date: '2024-01-18',
        time: '09:15'
      },
      budget: 8500,
      estimated_cost: 8200,
      actual_cost: 8350,
      billing_type: 'finance',
      validation_status: 'validated',
      owner_approval: 'approved',
      assigned_crew: {
        'captain': ['crew-004'],
        'cabin_crew': ['crew-006']
      },
      notes: 'Mission exécutée avec succès',
      created_at: '2024-01-12T09:00:00Z',
      updated_at: '2024-01-18T18:00:00Z'
    }
  ];

  const fallbackCrewMembers: CrewMember[] = [
    { id: 'crew-001', name: 'Sophie Laurent', role: 'internal', email: 'sophie.laurent@crewtech.fr', position: 'Captain' },
    { id: 'crew-002', name: 'Pierre Dubois', role: 'internal', email: 'pierre.dubois@crewtech.fr', position: 'Captain' },
    { id: 'crew-003', name: 'Lisa Anderson', role: 'freelancer', email: 'lisa@aviation.com', position: 'Flight Attendant' },
    { id: 'crew-004', name: 'Marco Rossi', role: 'freelancer', email: 'marco@freelance.eu', position: 'Captain' },
    { id: 'crew-005', name: 'Sarah Mitchell', role: 'freelancer', email: 'sarah@crewaviation.com', position: 'First Officer' },
    { id: 'crew-006', name: 'Jean-Baptiste Martin', role: 'internal', email: 'jb.martin@crewtech.fr', position: 'Flight Attendant' }
  ];

  // Fetch missions from Supabase
  const fetchMissions = useCallback(async (): Promise<Mission[]> => {
    try {
      const config = await getSupabaseConfig();
      
      // Build query with filters
      let query = `${config.url}/rest/v1/missions?select=*&order=created_at.desc`;

      // Add status filter
      if (statusFilter && statusFilter !== 'all') {
        query += `&status=eq.${encodeURIComponent(statusFilter)}`;
      }

      // Add search filter
      if (searchQuery) {
        const searchTerm = encodeURIComponent(searchQuery);
        query += `&or=(mission_number.ilike.*${searchTerm}*,client.ilike.*${searchTerm}*,aircraft_type.ilike.*${searchTerm}*)`;
      }

      console.log('🔍 [useMissionsData] Fetching missions from Supabase:', query);

      const response = await fetch(query, {
        method: 'GET',
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any[] = await response.json();
      console.log('✅ [useMissionsData] Raw mission data received:', data.length, 'missions');

      // Transform data to match expected Mission interface
      const transformedMissions: Mission[] = data.map(mission => ({
        id: mission.id,
        mission_number: mission.mission_number,
        client: mission.client,
        aircraft_id: mission.aircraft_id,
        aircraft_type: mission.aircraft_type,
        aircraft_registration: mission.aircraft_registration,
        status: mission.status || 'pending',
        departure: {
          airport: mission.departure_airport || 'N/A',
          date: mission.departure_date || new Date().toISOString().split('T')[0],
          time: mission.departure_time || '00:00'
        },
        arrival: {
          airport: mission.arrival_airport || 'N/A',
          date: mission.arrival_date || new Date().toISOString().split('T')[0],
          time: mission.arrival_time || '00:00'
        },
        budget: mission.budget,
        estimated_cost: mission.estimated_cost,
        actual_cost: mission.actual_cost,
        billing_type: mission.billing_type || 'direct',
        validation_status: mission.validation_status || 'pending',
        owner_approval: mission.owner_approval || 'pending',
        assigned_crew: mission.assigned_crew || {},
        notes: mission.notes,
        created_at: mission.created_at,
        updated_at: mission.updated_at
      }));

      console.log('✅ [useMissionsData] Transformed missions:', transformedMissions.length);
      return transformedMissions;

    } catch (error) {
      console.error('❌ [useMissionsData] Error fetching missions:', error);
      console.log('🔄 [useMissionsData] Using fallback mission data');
      return fallbackMissions;
    }
  }, [statusFilter, searchQuery]);

  // Fetch crew members from Supabase
  const fetchCrewMembers = useCallback(async (): Promise<CrewMember[]> => {
    try {
      const config = await getSupabaseConfig();
      const response = await fetch(
        `${config.url}/rest/v1/users?status=eq.active&select=id,name,email,position,role`,
        {
          method: 'GET',
          headers: {
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any[] = await response.json();
      console.log('✅ [useMissionsData] Crew members fetched:', data.length);

      // Transform data to match expected CrewMember interface
      const transformedCrewMembers: CrewMember[] = data.map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        position: user.position || 'Unknown',
        role: user.role || 'freelancer'
      }));

      return transformedCrewMembers;

    } catch (error) {
      console.error('❌ [useMissionsData] Error fetching crew members:', error);
      console.log('🔄 [useMissionsData] Using fallback crew data');
      return fallbackCrewMembers;
    }
  }, []);

  // Update mission status
  const updateMissionStatus = useCallback(async (missionId: string, newStatus: string) => {
    try {
      const config = await getSupabaseConfig();
      const response = await fetch(
        `${config.url}/rest/v1/missions?id=eq.${missionId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update mission: ${response.statusText}`);
      }

      // Update local state
      setMissions(prev => prev.map(mission => 
        mission.id === missionId 
          ? { ...mission, status: newStatus as any, updated_at: new Date().toISOString() }
          : mission
      ));

      console.log('✅ [useMissionsData] Mission status updated:', missionId, newStatus);

    } catch (error) {
      console.error('❌ [useMissionsData] Error updating mission status:', error);
      
      // Update local state as fallback
      setMissions(prev => prev.map(mission => 
        mission.id === missionId 
          ? { ...mission, status: newStatus as any, updated_at: new Date().toISOString() }
          : mission
      ));
    }
  }, []);

  // Delete mission
  const deleteMission = useCallback(async (missionId: string) => {
    try {
      const config = await getSupabaseConfig();
      const response = await fetch(
        `${config.url}/rest/v1/missions?id=eq.${missionId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete mission: ${response.statusText}`);
      }

      // Update local state
      setMissions(prev => prev.filter(mission => mission.id !== missionId));

      console.log('✅ [useMissionsData] Mission deleted:', missionId);

    } catch (error) {
      console.error('❌ [useMissionsData] Error deleting mission:', error);
      
      // Update local state as fallback
      setMissions(prev => prev.filter(mission => mission.id !== missionId));
    }
  }, []);

  // Process missions with crew member details
  const processedMissions = useMemo((): ProcessedMission[] => {
    return missions.map(mission => {
      const assignedCrewIds = Object.values(mission.assigned_crew).flat();
      const assignedCrewMembers = crewMembers.filter(crew => assignedCrewIds.includes(crew.id));

      return {
        ...mission,
        assignedCrewMembers
      };
    });
  }, [missions, crewMembers]);

  // Main data fetching function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useMissionsData] Starting missions data fetch...');

      // 1. Fetch missions
      const missionsData = await fetchMissions();
      setMissions(missionsData);

      // 2. Fetch crew members
      const crewData = await fetchCrewMembers();
      setCrewMembers(crewData);

      console.log('✅ [useMissionsData] Data fetch completed');

    } catch (error) {
      console.error('❌ [useMissionsData] Error in data fetch:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch missions data');
      
      // Set fallback data
      setMissions(fallbackMissions);
      setCrewMembers(fallbackCrewMembers);
    } finally {
      setLoading(false);
    }
  }, [fetchMissions, fetchCrewMembers]);

  // Refresh function
  const refresh = useCallback(async () => {
    console.log('🔄 [useMissionsData] Manual refresh requested');
    await fetchData();
  }, [fetchData]);

  // Helper functions
  const getMissionById = useCallback((id: string): ProcessedMission | undefined => {
    return processedMissions.find(mission => mission.id === id);
  }, [processedMissions]);

  const getPendingMissions = useCallback((): ProcessedMission[] => {
    return processedMissions.filter(mission => mission.status === 'pending');
  }, [processedMissions]);

  const getActiveMissions = useCallback((): ProcessedMission[] => {
    return processedMissions.filter(mission => mission.status === 'in_progress');
  }, [processedMissions]);

  const getCompletedMissions = useCallback((): ProcessedMission[] => {
    return processedMissions.filter(mission => mission.status === 'completed');
  }, [processedMissions]);

  // Initial fetch and refetch when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    missions: processedMissions,
    loading,
    error,
    refresh,
    updateMissionStatus,
    deleteMission,
    getMissionById,
    getPendingMissions,
    getActiveMissions,
    getCompletedMissions
  };
}