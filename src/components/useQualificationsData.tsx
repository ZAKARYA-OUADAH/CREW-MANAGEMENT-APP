import { useState, useEffect } from 'react';
import { useSupabaseData } from './SupabaseDataProvider';

export interface Qualification {
  id: string;
  user_id: string;
  type: 'license' | 'type_rating' | 'medical' | 'training' | 'competency' | 'other';
  code?: string;
  aircraft_type?: string;
  class?: string;
  level?: string;
  issued_date?: string;
  expiry_date?: string;
  valid: boolean;
  created_at: string;
  updated_at: string;
}

interface QualificationsData {
  qualifications: Qualification[];
  loading: boolean;
  error: string | null;
  refreshQualifications: () => Promise<void>;
  getUserQualifications: (userId: string) => Qualification[];
  getValidQualifications: (userId: string) => Qualification[];
  getQualificationsByType: (userId: string, type: Qualification['type']) => Qualification[];
  getAircraftQualifications: (userId: string, aircraftType?: string) => Qualification[];
}

export const useQualificationsData = (): QualificationsData => {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { client: supabase, isConnected } = useSupabaseData();

  const fetchQualifications = async () => {
    if (!supabase || !isConnected) {
      console.log('Supabase not connected, using fallback qualifications');
      setQualifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('qualifications')
        .select('*')
        .order('updated_at', { ascending: false });

      if (queryError) {
        console.error('Error fetching qualifications:', queryError);
        setError(queryError.message);
        setQualifications([]);
      } else {
        console.log('Fetched qualifications:', data);
        setQualifications(data || []);
      }
    } catch (err) {
      console.error('Error in fetchQualifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setQualifications([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshQualifications = async () => {
    await fetchQualifications();
  };

  const getUserQualifications = (userId: string): Qualification[] => {
    return qualifications.filter(qual => qual.user_id === userId);
  };

  const getValidQualifications = (userId: string): Qualification[] => {
    const userQuals = getUserQualifications(userId);
    const now = new Date();
    
    return userQuals.filter(qual => {
      if (!qual.valid) return false;
      if (!qual.expiry_date) return true; // No expiry date means it doesn't expire
      return new Date(qual.expiry_date) > now;
    });
  };

  const getQualificationsByType = (userId: string, type: Qualification['type']): Qualification[] => {
    return getValidQualifications(userId).filter(qual => qual.type === type);
  };

  const getAircraftQualifications = (userId: string, aircraftType?: string): Qualification[] => {
    const validQuals = getValidQualifications(userId);
    
    if (!aircraftType) {
      return validQuals.filter(qual => 
        qual.type === 'type_rating' && qual.aircraft_type
      );
    }
    
    return validQuals.filter(qual => 
      qual.type === 'type_rating' && 
      qual.aircraft_type && 
      qual.aircraft_type.toLowerCase().includes(aircraftType.toLowerCase())
    );
  };

  useEffect(() => {
    if (isConnected) {
      fetchQualifications();
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  return {
    qualifications,
    loading,
    error,
    refreshQualifications,
    getUserQualifications,
    getValidQualifications,
    getQualificationsByType,
    getAircraftQualifications
  };
};