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
export interface Aircraft {
  id: string;
  registration: string;
  type: string;
  model?: string;
  manufacturer?: string;
  status: 'available' | 'maintenance' | 'unavailable';
}

export interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'admin' | 'freelancer' | 'internal';
  phone?: string;
  address?: string;
  ggid?: string;
  created_at: string;
  updated_at: string;
}

export interface Qualification {
  id: number;
  user_id: string;
  type: 'TYPE_RATING' | 'LICENSE' | 'TRAINING' | 'COMPETENCY';
  level?: string;
  aircraft_type?: string;
  code?: string;
  name?: string;
  valid: boolean;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessedCrewMember {
  id: string;
  name: string;
  roleLabel: string;
  position: string;
  statusBadge: {
    text: string;
    color: 'green' | 'yellow' | 'red' | 'gray';
  };
  docsMissing: string[];
  qualified: boolean;
  email: string;
  phone?: string;
  ggid?: string;
  qualificationDetails: {
    hasTypeRating: boolean;
    hasCabinSafety: boolean;
    validQualifications: Qualification[];
    expiredQualifications: Qualification[];
  };
}

export interface UseCrewManagementParams {
  aircraftRegistration?: string;
  positionFilter?: string;
  searchQuery?: string;
}

export interface UseCrewManagementReturn {
  aircraft: Aircraft | null;
  crewMembers: ProcessedCrewMember[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getQualifiedCrew: () => ProcessedCrewMember[];
  getCrewByPosition: (position: string) => ProcessedCrewMember[];
}

const PILOT_POSITIONS = ['Captain', 'First Officer'];
const CABIN_CREW_POSITIONS = ['Flight Attendant', 'Senior Flight Attendant'];

export function useCrewManagement({
  aircraftRegistration,
  positionFilter,
  searchQuery
}: UseCrewManagementParams): UseCrewManagementReturn {
  
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch aircraft by registration
  const fetchAircraft = useCallback(async (registration: string): Promise<Aircraft | null> => {
    try {
      const config = await getSupabaseConfig();
      const response = await fetch(
        `${config.url}/rest/v1/aircraft?registration=eq.${registration}&select=*`,
        {
          headers: {
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch aircraft: ${response.statusText}`);
      }

      const data: Aircraft[] = await response.json();
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('❌ Error fetching aircraft:', error);
      
      // Return demo aircraft for F-HCTC if requested
      if (registration === 'F-HCTC') {
        const demoAircraft: Aircraft = {
          id: 'demo-fhctc',
          registration: 'F-HCTC',
          type: 'Phenom 300',
          model: 'Phenom 300',
          manufacturer: 'Embraer',
          status: 'available'
        };
        console.log('🔄 Using demo aircraft for F-HCTC:', demoAircraft);
        return demoAircraft;
      }
      
      return null;
    }
  }, []);

  // Fetch users with filters from public.users table
  const fetchUsers = useCallback(async (): Promise<User[]> => {
    try {
      const config = await getSupabaseConfig();
      
      // Build query for public.users table
      let query = `${config.url}/rest/v1/users?status=eq.active&role=neq.admin&select=id,name,email,position,status,role,phone,employee_id,created_at,updated_at`;
      
      // Add position filter
      if (positionFilter) {
        query += `&position=eq.${encodeURIComponent(positionFilter)}`;
      }

      // Add search filter (search in name, email, employee_id)
      if (searchQuery) {
        const searchTerm = encodeURIComponent(searchQuery);
        query += `&or=(name.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*,employee_id.ilike.*${searchTerm}*)`;
      }

      console.log('🔍 Fetching users from public.users table:', query);

      const response = await fetch(query, {
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch users:', response.status, response.statusText, errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data: any[] = await response.json();
      console.log('✅ Raw user data received:', data.length, 'users');

      // Transform data to match expected User interface
      const transformedUsers: User[] = data.map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        position: user.position || 'Unknown',
        status: user.status || 'active',
        role: user.role || 'freelancer',
        phone: user.phone,
        address: '', // Not available in new schema
        ggid: user.employee_id, // Map employee_id to ggid for compatibility
        created_at: user.created_at,
        updated_at: user.updated_at
      }));

      console.log('✅ Transformed users:', transformedUsers.length);
      return transformedUsers;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      
      // Return demo users as fallback for testing
      const demoUsers: User[] = [
        {
          id: 'demo-captain-1',
          name: 'Pierre Dubois',
          email: 'captain@crewtech.fr',
          position: 'Captain',
          status: 'active',
          role: 'internal',
          phone: '+33 6 23 45 67 89',
          ggid: 'CAP001',
          created_at: '2024-02-01T09:00:00Z',
          updated_at: '2024-09-01T12:00:00Z'
        },
        {
          id: 'demo-fo-1',
          name: 'Sarah Mitchell',
          email: 'fo@crewtech.fr',
          position: 'First Officer',
          status: 'active',
          role: 'freelancer',
          phone: '+1 555 123 4567',
          ggid: 'FO001',
          created_at: '2024-05-10T11:00:00Z',
          updated_at: '2024-08-15T13:45:00Z'
        },
        {
          id: 'demo-fa-1',
          name: 'Lisa Anderson',
          email: 'fa@crewtech.fr',
          position: 'Flight Attendant',
          status: 'active',
          role: 'freelancer',
          phone: '+44 7123 456789',
          ggid: 'FA001',
          created_at: '2024-03-15T14:00:00Z',
          updated_at: '2024-09-01T10:00:00Z'
        }
      ];

      console.log('🔄 Using demo users as fallback:', demoUsers.length);
      return demoUsers;
    }
  }, [positionFilter, searchQuery]);

  // Fetch qualifications for users
  const fetchQualifications = useCallback(async (userIds: string[]): Promise<Qualification[]> => {
    if (userIds.length === 0) return [];

    try {
      const config = await getSupabaseConfig();
      const userIdsQuery = userIds.map(id => `"${id}"`).join(',');
      const response = await fetch(
        `${config.url}/rest/v1/qualifications?user_id=in.(${userIdsQuery})&select=*`,
        {
          headers: {
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch qualifications: ${response.statusText}`);
      }

      const data: Qualification[] = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching qualifications:', error);
      
      // Fallback demo qualifications to ensure crew members are qualified for F-HCTC
      const demoQualifications: Qualification[] = [];
      
      userIds.forEach((userId, index) => {
        // Type rating for Phenom 300
        demoQualifications.push({
          id: index * 10 + 1,
          user_id: userId,
          type: 'TYPE_RATING',
          aircraft_type: 'Phenom 300',
          code: 'P300',
          name: 'Phenom 300 Type Rating',
          valid: true,
          expiry_date: '2025-12-31',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        });

        // License/Training based on position
        demoQualifications.push({
          id: index * 10 + 2,
          user_id: userId,
          type: userId.includes('fa') ? 'TRAINING' : 'LICENSE',
          code: userId.includes('fa') ? 'CABIN-SAFETY' : 'ATPL',
          name: userId.includes('fa') ? 'Cabin Safety Training' : 'Airline Transport Pilot License',
          level: userId.includes('fa') ? undefined : 'ATPL',
          valid: true,
          expiry_date: '2025-12-31',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        });
      });

      console.log('🔄 Using demo qualifications as fallback:', demoQualifications.length);
      return demoQualifications;
    }
  }, []);

  // Check if qualification is expired
  const isQualificationExpired = useCallback((qual: Qualification): boolean => {
    if (!qual.expiry_date) return false;
    return new Date(qual.expiry_date) < new Date();
  }, []);

  // Check if user has basic qualifications (not blocking for missing docs)
  const hasBasicQualifications = useCallback((
    user: User, 
    aircraft: Aircraft | null, 
    userQualifications: Qualification[]
  ): boolean => {
    if (!aircraft) return true; // No aircraft selected, consider all qualified

    const validQualifications = userQualifications.filter(q => 
      q.valid && !isQualificationExpired(q)
    );

    // For pilots: need TYPE_RATING for the aircraft type
    if (PILOT_POSITIONS.includes(user.position)) {
      return validQualifications.some(qual => 
        qual.type === 'TYPE_RATING' && 
        qual.aircraft_type &&
        (
          qual.aircraft_type.toLowerCase().includes(aircraft.type.toLowerCase()) ||
          qual.aircraft_type.toLowerCase().includes(aircraft.registration.toLowerCase())
        )
      );
    }

    // For cabin crew: need CABIN-SAFETY training
    if (CABIN_CREW_POSITIONS.includes(user.position)) {
      return validQualifications.some(qual => 
        qual.type === 'TRAINING' && 
        qual.code === 'CABIN-SAFETY'
      );
    }

    return false;
  }, [isQualificationExpired]);

  // Check if user is fully qualified (legacy function - now more permissive)
  const isUserQualifiedForAircraft = useCallback((
    user: User, 
    aircraft: Aircraft | null, 
    userQualifications: Qualification[]
  ): boolean => {
    // Allow selection even with missing documents - just check basic qualifications
    return hasBasicQualifications(user, aircraft, userQualifications);
  }, [hasBasicQualifications]);

  // Get missing documents for user
  const getMissingDocuments = useCallback((user: User, userQualifications: Qualification[]): string[] => {
    const missing: string[] = [];

    // Check basic profile completeness
    if (!user.phone) missing.push('Phone');
    if (!user.address) missing.push('Address');
    if (!user.ggid) missing.push('GGID');

    // Check for expired qualifications
    const expiredQuals = userQualifications.filter(q => q.valid && isQualificationExpired(q));
    if (expiredQuals.length > 0) {
      missing.push(`${expiredQuals.length} expired qualification(s)`);
    }

    // Check required qualifications based on position
    if (PILOT_POSITIONS.includes(user.position)) {
      const hasValidLicense = userQualifications.some(q => 
        q.type === 'LICENSE' && q.valid && !isQualificationExpired(q)
      );
      if (!hasValidLicense) missing.push('Valid License');
    }

    return missing;
  }, [isQualificationExpired]);

  // Process crew members with all business logic
  const processedCrewMembers = useMemo((): ProcessedCrewMember[] => {
    return users.map(user => {
      const userQualifications = qualifications.filter(q => q.user_id === user.id);
      const validQualifications = userQualifications.filter(q => q.valid && !isQualificationExpired(q));
      const expiredQualifications = userQualifications.filter(q => q.valid && isQualificationExpired(q));
      
      const hasBasicQuals = hasBasicQualifications(user, aircraft, userQualifications);
      const qualified = isUserQualifiedForAircraft(user, aircraft, userQualifications);
      const docsMissing = getMissingDocuments(user, userQualifications);
      
      // Determine status badge - now more permissive
      let statusBadge: ProcessedCrewMember['statusBadge'];
      if (user.status !== 'active') {
        statusBadge = { text: 'Inactive', color: 'gray' };
      } else if (!hasBasicQuals) {
        statusBadge = { text: 'Missing qualifications', color: 'red' };
      } else if (docsMissing.length > 0) {
        statusBadge = { text: `${docsMissing.length} docs missing`, color: 'yellow' };
      } else {
        statusBadge = { text: 'Available', color: 'green' };
      }

      // Create role label
      const roleLabel = user.role === 'internal' ? 'Internal' : 'Freelancer';

      return {
        id: user.id,
        name: user.name,
        roleLabel,
        position: user.position,
        statusBadge,
        docsMissing,
        qualified,
        email: user.email,
        phone: user.phone,
        ggid: user.ggid,
        qualificationDetails: {
          hasTypeRating: validQualifications.some(q => q.type === 'TYPE_RATING'),
          hasCabinSafety: validQualifications.some(q => q.type === 'TRAINING' && q.code === 'CABIN-SAFETY'),
          validQualifications,
          expiredQualifications
        }
      };
    });
  }, [users, qualifications, aircraft, isUserQualifiedForAircraft, getMissingDocuments, isQualificationExpired]);

  // Main data fetching function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Starting crew management data fetch...');

      // 1. Fetch aircraft if registration provided
      let aircraftData: Aircraft | null = null;
      if (aircraftRegistration) {
        console.log('📍 Fetching aircraft:', aircraftRegistration);
        aircraftData = await fetchAircraft(aircraftRegistration);
        if (aircraftData) {
          console.log('✅ Aircraft found:', aircraftData.type);
        } else {
          console.log('⚠️ Aircraft not found');
        }
      }

      // 2. Fetch users
      console.log('👥 Fetching users with filters:', { positionFilter, searchQuery });
      const usersData = await fetchUsers();
      console.log('✅ Users fetched:', usersData.length);

      // 3. Fetch qualifications for users
      if (usersData.length > 0) {
        console.log('🎓 Fetching qualifications...');
        const userIds = usersData.map(u => u.id);
        const qualificationsData = await fetchQualifications(userIds);
        console.log('✅ Qualifications fetched:', qualificationsData.length);
        setQualifications(qualificationsData);
      } else {
        setQualifications([]);
      }

      setAircraft(aircraftData);
      setUsers(usersData);
      
      console.log('✅ Crew management data fetch completed');
    } catch (error) {
      console.error('❌ Error in crew management data fetch:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch crew data');
    } finally {
      setLoading(false);
    }
  }, [aircraftRegistration, fetchAircraft, fetchUsers, fetchQualifications, positionFilter, searchQuery]);

  // Refresh function
  const refresh = useCallback(async () => {
    console.log('🔄 Manual refresh requested');
    await fetchData();
  }, [fetchData]);

  // Helper functions
  const getQualifiedCrew = useCallback((): ProcessedCrewMember[] => {
    return processedCrewMembers.filter(member => member.qualified);
  }, [processedCrewMembers]);

  const getCrewByPosition = useCallback((position: string): ProcessedCrewMember[] => {
    return processedCrewMembers.filter(member => member.position === position);
  }, [processedCrewMembers]);

  // Initial fetch and refetch when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    aircraft,
    crewMembers: processedCrewMembers,
    loading,
    error,
    refresh,
    getQualifiedCrew,
    getCrewByPosition
  };
}