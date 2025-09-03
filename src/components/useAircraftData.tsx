import { useState, useEffect } from 'react';

export interface AircraftData {
  id: string;
  registration: string;
  type: string;
  manufacturer: string;
  model: string;
  category: string;
  max_passengers: number;
  pilots_required: number;
  cabin_crew_required: number;
  range_nm?: number;
  cruise_speed?: number;
  service_ceiling?: number;
  base_airport?: string;
  status: 'available' | 'maintenance' | 'unavailable' | 'sold';
  hourly_cost?: number;
  currency: string;
  maintenance_until?: string;
  last_inspection?: string;
  next_inspection?: string;
  created_at: string;
  updated_at: string;
}

export interface UseAircraftDataReturn {
  aircraft: AircraftData[];
  loading: boolean;
  error: string | null;
  refreshAircraft: () => Promise<void>;
  getAircraftByRegistration: (registration: string) => AircraftData | undefined;
  getAircraftById: (id: string) => AircraftData | undefined;
  getAvailableAircraft: () => AircraftData[];
}

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

export function useAircraftData(): UseAircraftDataReturn {
  const [aircraft, setAircraft] = useState<AircraftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallbackAircraft: AircraftData[] = [
    {
      id: 'aircraft-001',
      registration: 'F-HCTA',
      type: 'Citation CJ3+',
      manufacturer: 'Cessna',
      model: 'CJ3+',
      category: 'Business Jet',
      max_passengers: 8,
      pilots_required: 2,
      cabin_crew_required: 0,
      range_nm: 2040,
      cruise_speed: 416,
      service_ceiling: 45000,
      base_airport: 'LFPB',
      status: 'available',
      hourly_cost: 3200.00,
      currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'aircraft-002',
      registration: 'F-HCTB',
      type: 'King Air 350',
      manufacturer: 'Beechcraft',
      model: '350',
      category: 'Turboprop',
      max_passengers: 9,
      pilots_required: 2,
      cabin_crew_required: 0,
      range_nm: 1806,
      cruise_speed: 312,
      service_ceiling: 35000,
      base_airport: 'LFPB',
      status: 'available',
      hourly_cost: 2800.00,
      currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'aircraft-003',
      registration: 'F-HCTC',
      type: 'Phenom 300',
      manufacturer: 'Embraer',
      model: '300',
      category: 'Light Jet',
      max_passengers: 7,
      pilots_required: 2,
      cabin_crew_required: 0,
      range_nm: 1971,
      cruise_speed: 453,
      service_ceiling: 45000,
      base_airport: 'LFPB',
      status: 'maintenance',
      hourly_cost: 3500.00,
      currency: 'EUR',
      maintenance_until: '2024-12-31',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'aircraft-004',
      registration: 'F-HCTD',
      type: 'Falcon 7X',
      manufacturer: 'Dassault',
      model: '7X',
      category: 'Heavy Jet',
      max_passengers: 12,
      pilots_required: 2,
      cabin_crew_required: 1,
      range_nm: 5950,
      cruise_speed: 488,
      service_ceiling: 51000,
      base_airport: 'LFPB',
      status: 'available',
      hourly_cost: 6500.00,
      currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const fetchAircraft = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useAircraftData] Fetching aircraft from Supabase...');

      // Try to fetch from Supabase first
      try {
        const config = await getSupabaseConfig();
        const response = await fetch(
          `${config.url}/rest/v1/aircraft?select=*&order=registration.asc`,
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
        console.log('✅ [useAircraftData] Raw aircraft data received:', data.length, 'aircraft');

        if (data.length > 0) {
          // Transform data to match expected AircraftData interface
          const transformedAircraft: AircraftData[] = data.map(aircraft => ({
            id: aircraft.id,
            registration: aircraft.registration,
            type: aircraft.type,
            manufacturer: aircraft.manufacturer || 'Unknown',
            model: aircraft.model || aircraft.type,
            category: aircraft.category || 'Business Aircraft',
            max_passengers: aircraft.max_passengers || 8,
            pilots_required: aircraft.pilots_required || 2,
            cabin_crew_required: aircraft.cabin_crew_required || 0,
            range_nm: aircraft.range_nm,
            cruise_speed: aircraft.cruise_speed,
            service_ceiling: aircraft.service_ceiling,
            base_airport: aircraft.base_airport,
            status: aircraft.status || 'available',
            hourly_cost: aircraft.hourly_cost,
            currency: aircraft.currency || 'EUR',
            maintenance_until: aircraft.maintenance_until,
            last_inspection: aircraft.last_inspection,
            next_inspection: aircraft.next_inspection,
            created_at: aircraft.created_at,
            updated_at: aircraft.updated_at
          }));

          console.log('✅ [useAircraftData] Transformed aircraft:', transformedAircraft.length);
          setAircraft(transformedAircraft);
          setError(null);
        } else {
          console.log('⚠️ [useAircraftData] No aircraft found in Supabase, using fallback data');
          setAircraft(fallbackAircraft);
          setError('No aircraft found in database');
        }

      } catch (supabaseError) {
        console.error('❌ [useAircraftData] Supabase error:', supabaseError);
        console.log('🔄 [useAircraftData] Using fallback aircraft data');
        setAircraft(fallbackAircraft);
        
        if (supabaseError instanceof Error) {
          if (supabaseError.message.includes('Failed to fetch')) {
            setError('Connection to database failed - using demo data');
          } else {
            setError(`Database error: ${supabaseError.message} - using demo data`);
          }
        } else {
          setError('Unknown database error - using demo data');
        }
      }

    } catch (err) {
      console.error('[useAircraftData] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setAircraft(fallbackAircraft);
    } finally {
      setLoading(false);
    }
  };

  const refreshAircraft = async () => {
    await fetchAircraft();
  };

  const getAircraftByRegistration = (registration: string): AircraftData | undefined => {
    return aircraft.find(ac => ac.registration === registration);
  };

  const getAircraftById = (id: string): AircraftData | undefined => {
    return aircraft.find(ac => ac.id === id);
  };

  const getAvailableAircraft = (): AircraftData[] => {
    return aircraft.filter(ac => ac.status === 'available');
  };

  // Initial fetch
  useEffect(() => {
    fetchAircraft();
  }, []);

  return {
    aircraft,
    loading,
    error,
    refreshAircraft,
    getAircraftByRegistration,
    getAircraftById,
    getAvailableAircraft
  };
}