// Centralized crew data service that provides consistent crew information across the app
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Aircraft and flight data should come from the database
// No static data is kept here

// Function to check if a document is missing or expired
const checkDocumentStatus = (user: any) => {
  const missingDocs: string[] = [];
  const now = new Date();

  // Check medical certificate
  if (user.medicalExpiry) {
    const medicalExpiry = new Date(user.medicalExpiry);
    if (medicalExpiry <= now) {
      missingDocs.push('medical');
    }
  } else {
    missingDocs.push('medical');
  }

  // Check license
  if (!user.licenseNumber || user.licenseNumber === 'Not provided') {
    missingDocs.push('license');
  }

  // Check passport
  if (!user.passportNumber || user.passportNumber === 'Not provided') {
    missingDocs.push('passport');
  }

  // Check basic profile information
  if (!user.phone) missingDocs.push('phone');
  if (!user.address) missingDocs.push('address');
  if (!user.emergencyContact || !user.emergencyContact.name) missingDocs.push('emergency_contact');

  return missingDocs;
};

// Function to extract aircraft qualifications from complex qualification objects or direct field
const extractAircraftQualifications = (user: any): string[] => {
  // First, check if there's a direct aircraft_qualifications field (our new format)
  if (user.aircraft_qualifications && Array.isArray(user.aircraft_qualifications)) {
    console.log(`[extractAircraftQualifications] Using direct aircraft_qualifications for user:`, user.aircraft_qualifications);
    return user.aircraft_qualifications;
  }
  
  // Fallback to extracting from complex qualifications
  const qualifications = user.qualifications || [];
  if (!Array.isArray(qualifications)) return [];
  
  const aircraftQuals: string[] = [];
  
  qualifications.forEach(qual => {
    if (typeof qual === 'string') {
      // Simple string qualification (immatriculation)
      aircraftQuals.push(qual);
    } else if (qual && typeof qual === 'object') {
      // Complex qualification object from database
      if (qual.type === 'type_rating' && qual.aircraft) {
        // Map aircraft type to immatriculation
        const aircraftType = qual.aircraft;
        const aircraftMap = {
          'Citation_CJ3': 'F-HCTA',
          'Citation_CJ3+': 'F-HCTA',
          'King_Air_350': 'F-HCTB',
          'Phenom_300': 'F-HCTC'
        };
        
        if (aircraftMap[aircraftType]) {
          aircraftQuals.push(aircraftMap[aircraftType]);
        }
      }
    }
  });
  
  console.log(`[extractAircraftQualifications] Extracted from complex qualifications:`, aircraftQuals);
  return aircraftQuals;
};

// Function to transform API user data to crew format
const transformApiUserToCrew = (user: any) => {
  // Handle different user data formats from API
  const name = user.name || `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim() || 'Unknown';
  const position = user.position || user.user_metadata?.position || 'Unknown Position';
  const email = user.email || '';
  const phone = user.phone || user.user_metadata?.phone || '';
  const role = user.role || user.user_metadata?.role || 'freelancer';
  
  // Extract aircraft qualifications from user data
  const aircraftQualifications = extractAircraftQualifications(user);
  
  console.log(`[transformApiUserToCrew] User ${name} qualifications:`, {
    raw: user.qualifications,
    extracted: aircraftQualifications
  });
  
  return {
    id: user.id,
    name,
    position,
    email,
    phone,
    role,
    type: role, // Map role to type for compatibility
    availability: user.availability || 'available',
    qualifications: aircraftQualifications, // Use extracted aircraft qualifications
    address: user.address || '',
    emergencyContact: user.emergencyContact || null,
    ggid: user.ggid || `CREW-${user.id}`,
    licenseNumber: user.licenseNumber || '',
    medicalExpiry: user.medicalExpiry || '',
    passportNumber: user.passportNumber || '',
    missing_docs: checkDocumentStatus(user),
    created_at: user.created_at || user.createdAt,
    status: user.status || 'active',
    user_metadata: user.user_metadata
  };
};

// Function to get all crew members with current status
export const getAllCrewMembers = async () => {
  console.log('[CrewDataService] Fetching crew members from local API...');
  
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/crew`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('[CrewDataService] Local API Response:', result);
    
    if (result && result.success && result.data && Array.isArray(result.data)) {
      const crewData = result.data;
      console.log(`[CrewDataService] Found ${crewData.length} crew members from local API`);
      
      // Transform and filter crew data
      const transformedCrew = crewData
        .filter(crew => crew && crew.id) // Remove null/undefined entries
        .map(transformApiUserToCrew)
        .filter(crew => crew.role !== 'admin'); // Exclude admin users from crew list
      
      console.log(`[CrewDataService] After filtering: ${transformedCrew.length} valid crew members`);
      console.log('[CrewDataService] Crew qualifications summary:', 
        transformedCrew.map(c => ({ 
          name: c.name, 
          qualifications: c.qualifications 
        }))
      );
      
      if (transformedCrew.length > 0) {
        return transformedCrew;
      } else {
        console.log('[CrewDataService] No valid crew members found in API response');
        return [];
      }
    } else {
      console.log('[CrewDataService] Invalid local API response format');
      console.log('[CrewDataService] Response structure:', {
        hasResult: !!result,
        hasSuccess: !!(result && result.success),
        hasData: !!(result && result.data),
        isArray: !!(result && result.data && Array.isArray(result.data)),
        dataLength: result && result.data ? result.data.length : 'N/A'
      });
      return [];
    }
  } catch (error) {
    console.error('[CrewDataService] Error fetching crew from local API:', error);
    // Show more details about the error
    if (error.message) {
      console.error('[CrewDataService] Error details:', error.message);
    }
    return [];
  }
};

// No static crew data - all crew data should come from the database

// Function to get a specific crew member by ID
export const getCrewMemberById = async (id: string) => {
  try {
    const allCrew = await getAllCrewMembers();
    const crew = allCrew.find(crew => crew.id === id);
    
    if (!crew) {
      console.warn(`Crew member with ID ${id} not found`);
      return null;
    }
    
    return crew;
  } catch (error) {
    console.error(`Error fetching crew member ${id}:`, error);
    return null;
  }
};

// Aircraft and flight functions should use the API
export const getAircraftByImmat = async (immat: string) => {
  // Should call the aircraft API
  console.warn('getAircraftByImmat should call the aircraft API');
  return null;
};

export const getAircraftById = async (id: string) => {
  // Should call the aircraft API
  console.warn('getAircraftById should call the aircraft API');
  return null;
};

export const getFlightsByAircraftId = async (aircraftId: string) => {
  // Should call the flights API
  console.warn('getFlightsByAircraftId should call the flights API');
  return [];
};

// Hook to use crew data with real-time updates
export const useCrewData = () => {
  const [crewData, setCrewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    const loadCrewData = async () => {
      setLoading(true);
      console.log('[useCrewData] Loading crew data...');
      
      try {
        const data = await getAllCrewMembers();
        console.log(`[useCrewData] Loaded ${data.length} crew members:`, data.map(c => ({ id: c.id, name: c.name, role: c.role, qualifications: c.qualifications })));
        setCrewData(data);
        
        // Check if we're getting API data or fallback data
        // If we have users with IDs that match the API format, we're using API data
        const hasApiData = data.some(crew => 
          crew.id.includes('internal-') || 
          crew.id.includes('freelancer-') || 
          crew.id.startsWith('MO-') ||
          crew.id.includes('admin-')
        );
        setApiConnected(hasApiData);
        
        console.log('[useCrewData] API connected status:', hasApiData, 'Data source:', hasApiData ? 'Local API' : 'Static fallback');
        
        if (!hasApiData) {
          console.log('[useCrewData] No API data found - database might be empty');
        }
      } catch (error) {
        console.error('[useCrewData] Error loading crew data:', error);
        setCrewData([]);
        setApiConnected(false);
      } finally {
        setLoading(false);
      }
    };

    loadCrewData();

    // Update crew data when localStorage changes (user profile updates)
    const handleStorageChange = () => {
      console.log('[useCrewData] Storage changed, reloading crew data...');
      loadCrewData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when profile is updated
    window.addEventListener('profileUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  const refreshCrewData = useCallback(async () => {
    console.log('[useCrewData] Manually refreshing crew data...');
    setLoading(true);
    try {
      const data = await getAllCrewMembers();
      console.log(`[useCrewData] Refreshed ${data.length} crew members`);
      setCrewData(data);
      
      // Update API connection status
      const hasApiData = data.some(crew => 
        crew.id.includes('internal-') || 
        crew.id.includes('freelancer-') || 
        crew.id.startsWith('MO-') ||
        crew.id.includes('admin-')
      );
      setApiConnected(hasApiData);
    } catch (error) {
      console.error('[useCrewData] Error refreshing crew data:', error);
      setCrewData([]);
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to avoid recreation

  return {
    allCrew: crewData,
    loading,
    apiConnected,
    getCrewById: (id: string) => crewData.find(crew => crew.id === id),
    refreshCrewData
  };
};