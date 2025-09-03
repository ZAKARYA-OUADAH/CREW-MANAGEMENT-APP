import { type MissionOrder } from './MissionOrderService';

export const calculateMissionDuration = (startDate?: string, endDate?: string): number => {
  if (!startDate || !endDate) return 1;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  } catch (error) {
    console.warn('Error calculating mission duration:', error);
    return 1;
  }
};

export const calculateTotalCompensation = (mission: MissionOrder) => {
  if (!mission.contract) {
    return { salary: 0, perDiem: 0, total: 0, currency: 'EUR' };
  }
  
  const days = calculateMissionDuration(mission.contract.startDate, mission.contract.endDate);
  const salaryAmount = mission.contract.salaryAmount || 0;
  const salary = mission.contract.salaryType === 'daily' 
    ? salaryAmount * days 
    : salaryAmount;
  
  const perDiem = mission.contract.hasPerDiem 
    ? (mission.contract.perDiemAmount || 0) * days 
    : 0;
  
  return {
    salary,
    perDiem,
    total: salary + perDiem,
    currency: mission.contract.salaryCurrency || 'EUR'
  };
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'No date';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const isAutoApproved = (mission: MissionOrder): boolean => {
  // Check if mission was auto-approved (created and approved at the same time or within seconds)
  if (!mission.createdAt || !mission.approvedAt) return false;
  const createdTime = new Date(mission.createdAt).getTime();
  const approvedTime = new Date(mission.approvedAt).getTime();
  const timeDiffInSeconds = Math.abs(approvedTime - createdTime) / 1000;
  return timeDiffInSeconds < 5; // Auto-approved if less than 5 seconds difference
};

export const getTypeColor = (type: MissionOrder['type']): string => {
  switch (type) {
    case 'freelance': return 'bg-purple-100 text-purple-800';
    case 'extra_day': return 'bg-blue-100 text-blue-800';
    case 'service': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const filterMissions = (
  missionOrders: MissionOrder[], 
  searchTerm: string, 
  statusFilter: string, 
  typeFilter: string
): MissionOrder[] => {
  return missionOrders.filter(mission => {
    try {
      const missionId = mission?.id || '';
      const crewName = mission?.crew?.name || '';
      const aircraftType = mission?.aircraft?.type || '';
      const aircraftImmat = mission?.aircraft?.immat || '';
      
      const matchesSearch = missionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           crewName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           aircraftType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           aircraftImmat.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || mission?.status === statusFilter;
      const matchesType = typeFilter === 'all' || mission?.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    } catch (error) {
      console.warn('Error filtering mission:', error);
      return false;
    }
  });
};