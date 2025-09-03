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

export interface Position {
  id: number;
  code: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PositionOption {
  label: string;
  value: string;
  position: Position;
}

export interface UsePositionsRESTReturn {
  positions: Position[];
  positionOptions: PositionOption[];
  loading: boolean;
  error: string | null;
  refreshPositions: () => Promise<void>;
  searchPositions: (query: string) => PositionOption[];
  getPositionByCode: (code: string) => Position | undefined;
  getPositionById: (id: number) => Position | undefined;
}

const mockPositions: Position[] = [
  {
    id: 1,
    code: 'CPT',
    name: 'Captain',
    description: 'Pilot in Command',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    code: 'FO',
    name: 'First Officer',
    description: 'Second in Command',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    code: 'FA',
    name: 'Flight Attendant',
    description: 'Cabin Crew Member',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    code: 'PURSER',
    name: 'Chief Flight Attendant',
    description: 'Lead Cabin Crew',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    code: 'TECH',
    name: 'Technician',
    description: 'Maintenance Technician',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function usePositionsREST(): UsePositionsRESTReturn {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [usePositionsREST] Fetching positions from Supabase...');

      // Try to fetch from Supabase first
      try {
        const config = await getSupabaseConfig();
        const response = await fetch(
          `${config.url}/rest/v1/positions?select=*&order=name.asc`,
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
        console.log('✅ [usePositionsREST] Raw position data received:', data.length, 'positions');

        // Transform data to match expected Position interface
        const transformedPositions: Position[] = data.map(position => ({
          id: position.id,
          code: position.code,
          name: position.name,
          description: position.description,
          created_at: position.created_at,
          updated_at: position.updated_at
        }));

        console.log('✅ [usePositionsREST] Transformed positions:', transformedPositions.length);
        setPositions(transformedPositions);

      } catch (supabaseError) {
        console.error('❌ [usePositionsREST] Supabase error:', supabaseError);
        console.log('🔄 [usePositionsREST] Using fallback position data');
        setPositions(mockPositions);
      }

    } catch (error) {
      console.error('❌ Error fetching positions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch positions');
      setPositions(mockPositions); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPositions = useCallback(async () => {
    console.log('🔄 Force refreshing positions...');
    await fetchPositions();
  }, [fetchPositions]);

  // Transform positions to options with format "Captain / CPT"
  const positionOptions = useMemo((): PositionOption[] => {
    return positions
      .filter(position => 
        position && 
        position.code && 
        position.name && 
        String(position.code).trim() !== "" &&
        String(position.name).trim() !== ""
      )
      .map(position => ({
        label: `${position.name} / ${position.code}`,
        value: String(position.code).trim(),
        position
      }));
  }, [positions]);

  // Search function for filtering positions
  const searchPositions = useCallback((query: string): PositionOption[] => {
    if (!query.trim()) {
      return positionOptions;
    }

    const searchTerm = query.toLowerCase().trim();
    return positionOptions.filter(option => 
      option.position.name.toLowerCase().includes(searchTerm) ||
      option.position.code.toLowerCase().includes(searchTerm) ||
      (option.position.description && option.position.description.toLowerCase().includes(searchTerm))
    );
  }, [positionOptions]);

  const getPositionByCode = useCallback((code: string): Position | undefined => {
    return positions.find(position => position.code === code);
  }, [positions]);

  const getPositionById = useCallback((id: number): Position | undefined => {
    return positions.find(position => position.id === id);
  }, [positions]);

  // Initial fetch
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    positionOptions,
    loading,
    error,
    refreshPositions,
    searchPositions,
    getPositionByCode,
    getPositionById,
  };
}