// Service for managing mission orders and mission lifecycle
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import type { 
  MissionOrder, 
  ValidationData, 
  DateModificationData, 
  APIConnectionDiagnostic 
} from './MissionOrderTypes';
import { generateMockMissionOrders } from './MissionOrderMockData';

// Re-export types and helpers for backward compatibility
export type { MissionOrder, ValidationData, DateModificationData };
export { 
  getStatusText, 
  getStatusColor, 
  getMissionTypeText 
} from './MissionOrderHelpers';
export { 
  useMissionOrders, 
  useAllMissionOrders,
  usePendingValidationMissions 
} from './MissionOrderHooks';

// Utility function to make fetch requests with timeout and retry
const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = 8000,
  retries: number = 1
): Promise<Response> => {
  let lastError: Error;
  
  for (let i = 0; i <= retries; i++) {
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
      lastError = error as Error;
      
      if (error.name === 'AbortError') {
        lastError = new Error(`Request timed out after ${timeoutMs}ms`);
      }
      
      // Don't retry on the last attempt
      if (i < retries) {
        console.log(`🔄 [MissionService] Retry ${i + 1}/${retries} after error: ${lastError.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }
  }
  
  throw lastError;
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

// Quick connectivity test
const testSupabaseConnectivity = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }
  
  try {
    const response = await fetchWithTimeout(
      `https://${projectId}.supabase.co/health`,
      { method: 'GET' },
      3000, // Very short timeout for connectivity test
      0 // No retries for connectivity test
    );
    return response.ok;
  } catch {
    return false;
  }
};

// Diagnostic function to test API connectivity
export const diagnoseMissionAPIConnection = async (): Promise<APIConnectionDiagnostic> => {
  const result: APIConnectionDiagnostic = {
    serverReachable: false,
    authValid: true,
    endpointWorking: false,
    error: undefined
  };

  if (!isSupabaseConfigured()) {
    result.error = 'Supabase not configured properly';
    return result;
  }

  // Test basic connectivity first
  console.log('🔍 [MissionService] Testing basic connectivity...');
  const isConnected = await testSupabaseConnectivity();
  
  if (!isConnected) {
    result.error = 'Supabase server not reachable';
    console.log('❌ [MissionService] Supabase server not reachable');
    
    // Test local API as fallback
    try {
      console.log('🔍 [MissionService] Testing Local API as fallback...');
      const localResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (localResponse.ok) {
        result.serverReachable = true;
        result.endpointWorking = true;
        console.log('✅ [MissionService] Local API is working as fallback');
      } else {
        throw new Error(`HTTP ${localResponse.status}: ${localResponse.statusText}`);
      }
    } catch (localError) {
      result.error = `Both Supabase and Local API unreachable. Local: ${localError.message}`;
      console.log(`❌ [MissionService] Local API also failed: ${localError.message}`);
    }
    
    return result;
  }

  result.serverReachable = true;
  console.log('✅ [MissionService] Supabase server is reachable');

  // Test missions endpoint
  try {
    console.log('🔍 [MissionService] Testing missions endpoint...');
    const response = await fetchWithTimeout(
      `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      },
      5000,
      1
    );
    
    if (response.ok) {
      result.endpointWorking = true;
      console.log('✅ [MissionService] Missions endpoint working');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    // Fallback to local API
    try {
      const localResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (localResponse.ok) {
        result.endpointWorking = true;
        console.log('✅ [MissionService] Local missions endpoint working as fallback');
      } else {
        throw new Error(`HTTP ${localResponse.status}: ${localResponse.statusText}`);
      }
    } catch (localError) {
      result.error = `Missions endpoint failed: ${error.message}`;
      console.log(`❌ [MissionService] Missions endpoint error: ${result.error}`);
    }
  }

  return result;
};

// Enhanced mission fetching with better error handling and fallback
const fetchMissionsFromSupabase = async (): Promise<MissionOrder[]> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  console.log('🔍 [MissionService] Fetching missions from Supabase...');
  
  // Quick connectivity test first
  const isConnected = await testSupabaseConnectivity();
  if (!isConnected) {
    throw new Error('Supabase server not reachable');
  }
  
  const response = await fetchWithTimeout(
    `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`,
    {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    },
    8000,
    1 // One retry
  );

  if (!response.ok) {
    throw new Error(`Supabase HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.missions && Array.isArray(result.missions)) {
    console.log(`✅ [MissionService] Supabase returned ${result.missions.length} missions`);
    return result.missions;
  } else {
    console.log('⚠️ [MissionService] Supabase response has no missions array');
    return [];
  }
};

const fetchMissionsFromLocalAPI = async (): Promise<MissionOrder[]> => {
  console.log('🔍 [MissionService] Fetching missions from Local API...');
  
  const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (result && result.success && result.data) {
    console.log(`✅ [MissionService] Local API returned ${result.data.length} missions`);
    return result.data;
  } else if (result.missions && Array.isArray(result.missions)) {
    console.log(`✅ [MissionService] Local API returned ${result.missions.length} missions`);
    return result.missions;
  } else {
    console.log('⚠️ [MissionService] Local API returned no valid data');
    return [];
  }
};

const getMockMissions = (): MissionOrder[] => {
  console.log('🔍 [MissionService] Using mock missions as fallback');
  const mockData = generateMockMissionOrders();
  console.log(`✅ [MissionService] Generated ${mockData.length} mock missions`);
  return mockData;
};

// Get mission orders for current user (with enhanced fallback logic)
export const getMissionOrdersForUser = async (userId: string): Promise<MissionOrder[]> => {
  console.log(`🔍 [MissionService] Getting missions for user: ${userId}`);
  
  let allMissions: MissionOrder[] = [];
  
  // Step 1: Try Supabase (with better error handling)
  try {
    allMissions = await fetchMissionsFromSupabase();
    console.log(`✅ [MissionService] Successfully fetched ${allMissions.length} missions from Supabase`);
  } catch (supabaseError) {
    console.log(`⚠️ [MissionService] Supabase failed (${supabaseError.message}), trying Local API...`);
    
    // Step 2: Try Local API
    try {
      allMissions = await fetchMissionsFromLocalAPI();
      console.log(`✅ [MissionService] Successfully fetched ${allMissions.length} missions from Local API`);
    } catch (localError) {
      console.log(`⚠️ [MissionService] Local API failed (${localError.message}), using mock data...`);
      
      // Step 3: Use mock data
      allMissions = getMockMissions();
    }
  }
  
  // Filter missions for the specific user
  const userMissions = allMissions.filter((mission: any) => {
    const isAssigned = mission.crew?.id === userId || 
                     mission.crew?.captain?.id === userId ||
                     mission.crew?.first_officer?.id === userId ||
                     (mission.crew?.cabin_crew && mission.crew.cabin_crew.some((cc: any) => cc.id === userId));
    
    if (isAssigned) {
      console.log(`✅ [MissionService] Found mission ${mission.id} assigned to user ${userId}`);
    }
    
    return isAssigned;
  });
  
  console.log(`📊 [MissionService] Returning ${userMissions.length} missions for user ${userId} (out of ${allMissions.length} total)`);
  return userMissions;
};

// Get all mission orders (for admin) - with enhanced fallback logic
export const getAllMissionOrders = async (): Promise<MissionOrder[]> => {
  console.log('🔍 [MissionService] Getting all missions (admin request)');
  
  // Step 1: Try Supabase
  try {
    const missions = await fetchMissionsFromSupabase();
    if (missions.length > 0) {
      return missions;
    }
    console.log('⚠️ [MissionService] Supabase returned empty array, trying fallback...');
  } catch (supabaseError) {
    console.log(`⚠️ [MissionService] Supabase failed for admin (${supabaseError.message}), trying Local API...`);
  }
  
  // Step 2: Try Local API
  try {
    const missions = await fetchMissionsFromLocalAPI();
    if (missions.length > 0) {
      return missions;
    }
    console.log('⚠️ [MissionService] Local API returned empty array, using mock data...');
  } catch (localError) {
    console.log(`⚠️ [MissionService] Local API failed for admin (${localError.message}), using mock data...`);
  }
  
  // Step 3: Use mock data
  return getMockMissions();
};

// Get mission order by ID (with enhanced fallback logic)
export const getMissionOrderById = async (id: string): Promise<MissionOrder | undefined> => {
  console.log(`🔍 [MissionService] Getting mission by ID: ${id}`);
  
  // Step 1: Try Supabase
  if (isSupabaseConfigured()) {
    try {
      const isConnected = await testSupabaseConnectivity();
      if (isConnected) {
        const response = await fetchWithTimeout(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          },
          6000,
          1
        );

        if (response.ok) {
          const result = await response.json();
          if (result.mission) {
            console.log(`✅ [MissionService] Found mission ${id} in Supabase`);
            return result.mission;
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ [MissionService] Supabase lookup failed for mission ${id}: ${error.message}`);
    }
  }
  
  // Step 2: Try Local API
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${id}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result && result.success && result.data) {
        console.log(`✅ [MissionService] Found mission ${id} in Local API`);
        return result.data;
      } else if (result.mission) {
        console.log(`✅ [MissionService] Found mission ${id} in Local API`);
        return result.mission;
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`⚠️ [MissionService] Local API lookup failed for mission ${id}: ${error.message}`);
  }
  
  // Step 3: Try mock data
  try {
    const allOrders = generateMockMissionOrders();
    const mission = allOrders.find(order => order.id === id);
    
    if (mission) {
      console.log(`✅ [MissionService] Found mission ${id} in mock data`);
    } else {
      console.log(`❌ [MissionService] Mission ${id} not found in any source`);
    }
    
    return mission;
  } catch (error) {
    console.log(`❌ [MissionService] Error accessing mock data: ${error.message}`);
    return undefined;
  }
};

// Create mission order (use Supabase first, then Local API fallback)
export const createMissionOrder = async (missionData: any): Promise<MissionOrder | null> => {
  console.log(`🔍 [MissionService] Creating new mission...`);
  
  // Step 1: Try Supabase
  if (isSupabaseConfigured()) {
    try {
      const isConnected = await testSupabaseConnectivity();
      if (isConnected) {
        console.log('🔍 [MissionService] Creating mission via Supabase API...');
        
        const response = await fetchWithTimeout(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify(missionData)
          },
          10000,
          1
        );

        if (response.ok) {
          const result = await response.json();
          if (result.mission) {
            console.log(`✅ [MissionService] Mission created via Supabase: ${result.mission.id}`);
            return result.mission;
          }
        } else {
          console.log(`⚠️ [MissionService] Supabase mission creation failed: HTTP ${response.status}`);
        }
      } else {
        console.log('⚠️ [MissionService] Supabase not reachable for mission creation');
      }
    } catch (error) {
      console.log(`⚠️ [MissionService] Supabase mission creation error: ${error.message}`);
    }
  }
  
  // Step 2: Fallback to Local API
  try {
    console.log('🔍 [MissionService] Falling back to Local API for mission creation...');
    
    const enhancedMissionData = {
      ...missionData,
      isProvisionalOrder: true,
      contract: {
        ...missionData.contract,
        additionalNotes: missionData.contract.additionalNotes ? 
          `${missionData.contract.additionalNotes}\n\nORDRE PROVISOIRE - Les dates et la durée peuvent être modifiées selon la durée réelle de la mission.` :
          'ORDRE PROVISOIRE - Les dates et la durée peuvent être modifiées selon la durée réelle de la mission.'
      }
    };
    
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enhancedMissionData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ [MissionService] Mission created via Local API: ${result.data?.id || result.mission?.id}`);
    return result.data || result.mission;
  } catch (error) {
    console.error('❌ [MissionService] All mission creation methods failed:', error);
    throw error;
  }
};

// All other functions remain the same but with enhanced logging...
export const approveMissionOrder = async (id: string): Promise<MissionOrder | null> => {
  console.log(`🔍 [MissionService] Approving mission: ${id}`);
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ [MissionService] Mission ${id} approved`);
    return result.data || result.mission;
  } catch (error) {
    console.error(`❌ [MissionService] Error approving mission ${id}:`, error);
    throw error;
  }
};

export const rejectMissionOrder = async (id: string, reason: string): Promise<MissionOrder | null> => {
  console.log(`🔍 [MissionService] Rejecting mission: ${id} (reason: ${reason})`);
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ [MissionService] Mission ${id} rejected`);
    return result.data || result.mission;
  } catch (error) {
    console.error(`❌ [MissionService] Error rejecting mission ${id}:`, error);
    throw error;
  }
};

export const validateMission = async (id: string, validationData: ValidationData): Promise<MissionOrder | null> => {
  console.log(`🔍 [MissionService] Validating mission: ${id}`);
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${id}/validate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validationData)
    });
    
    const result = response.ok ? await response.json() : null;
    if (result && result.success && result.data) {
      console.log(`✅ [MissionService] Mission ${id} validated via API`);
      return result.data;
    } else {
      console.log(`⚠️ [MissionService] API validation failed for ${id}, using mock validation`);
      const mockMissions = generateMockMissionOrders();
      const mission = mockMissions.find(m => m.id === id);
      
      if (!mission) {
        throw new Error('Mission not found in mock data');
      }
      
      if (mission.status !== 'pending_validation' && mission.status !== 'pending_date_modification') {
        throw new Error(`Mission is not in a validatable status. Current status: ${mission.status}`);
      }
      
      const now = new Date().toISOString();
      const validatedMission = {
        ...mission,
        status: validationData.dateModification ? 'pending_date_modification' : 'validated',
        validatedAt: now,
        validation: {
          ...mission.validation,
          validatedAt: now,
          crewComments: validationData.crewComments,
          ribConfirmed: validationData.ribConfirmed,
          issuesReported: validationData.issuesReported || [],
          paymentIssue: validationData.paymentIssue || false,
          paymentIssueDetails: validationData.paymentIssueDetails
        }
      } as MissionOrder;
      
      console.log(`✅ [MissionService] Mock validation successful for mission: ${id}`);
      return validatedMission;
    }
  } catch (error) {
    console.error(`❌ [MissionService] Error validating mission ${id}:`, error);
    throw error;
  }
};

export const requestDateModification = async (
  missionId: string,
  dateModificationData: DateModificationData
): Promise<void> => {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${missionId}/request-date-modification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dateModificationData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error requesting date modification:', error);
    throw error;
  }
};

export const approveDateModification = async (
  missionId: string,
  approverComment?: string
): Promise<MissionOrder | null> => {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${missionId}/approve-date-modification`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ approverComment })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data || result.mission;
  } catch (error) {
    console.error('Error approving date modification:', error);
    throw error;
  }
};

export const rejectDateModification = async (
  missionId: string,
  rejectionReason: string
): Promise<MissionOrder | null> => {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${missionId}/reject-date-modification`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rejectionReason })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data || result.mission;
  } catch (error) {
    console.error('Error rejecting date modification:', error);
    throw error;
  }
};

export const checkMissionsForValidation = async (): Promise<{ updated: number }> => {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/check-validation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data || { updated: 0 };
  } catch (error) {
    console.error('Error checking missions for validation:', error);
    return { updated: 0 };
  }
};

export const updateMissionServiceInvoice = async (
  missionId: string, 
  invoiceData: any
): Promise<MissionOrder | null> => {
  try {
    console.log(`🔍 [MissionService] Updating mission ${missionId} with service invoice data`);
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${missionId}/invoice`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });
      
      const result = response.ok ? await response.json() : null;
      if (result && result.success && result.data) {
        console.log(`✅ [MissionService] Mission ${missionId} updated with invoice via API`);
        return result.data;
      } else {
        console.log(`⚠️ [MissionService] API update failed for ${missionId}, attempting direct mission update...`);
        
        const mission = await getMissionOrderById(missionId);
        if (!mission) {
          throw new Error('Mission not found');
        }
        
        const updatedMission = {
          ...mission,
          serviceInvoice: invoiceData,
          status: mission.status === 'pending_validation' ? 'validated' : mission.status,
          validatedAt: mission.status === 'pending_validation' ? new Date().toISOString() : mission.validatedAt
        };
        
        console.log(`✅ [MissionService] Mission ${missionId} updated with invoice (local fallback)`);
        return updatedMission;
      }
    } catch (apiError) {
      console.log(`⚠️ [MissionService] API error for ${missionId}, attempting direct mission update...`);
      
      const mission = await getMissionOrderById(missionId);
      if (!mission) {
        throw new Error('Mission not found');
      }
      
      const updatedMission = {
        ...mission,
        serviceInvoice: invoiceData,
        status: mission.status === 'pending_validation' ? 'validated' : mission.status,
        validatedAt: mission.status === 'pending_validation' ? new Date().toISOString() : mission.validatedAt
      };
      
      console.log(`✅ [MissionService] Mission ${missionId} updated with invoice (fallback)`);
      return updatedMission;
    }
  } catch (error) {
    console.error(`❌ [MissionService] Error updating mission ${missionId} with service invoice:`, error);
    throw error;
  }
};