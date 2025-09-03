// Helper functions for mission orders
import type { MissionOrder } from './MissionOrderTypes';

// Status text helpers
export const getStatusText = (status: MissionOrder['status']) => {
  switch (status) {
    case 'pending_approval': return 'En attente d\'approbation';
    case 'approved': return 'Approuvé';
    case 'rejected': return 'Rejeté';
    case 'completed': return 'Terminé';
    case 'cancelled': return 'Annulé';
    case 'pending_validation': return 'En attente de validation';
    case 'validated': return 'Validé';
    case 'pending_date_modification': return 'Modification de dates en attente';
    default: return status;
  }
};

export const getStatusColor = (status: MissionOrder['status']) => {
  switch (status) {
    case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    case 'pending_validation': return 'bg-orange-100 text-orange-800';
    case 'validated': return 'bg-green-100 text-green-800';
    case 'pending_date_modification': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getMissionTypeText = (type: MissionOrder['type']) => {
  switch (type) {
    case 'extra_day': return 'Jour supplémentaire';
    case 'freelance': return 'Mission freelance';
    case 'service': return 'Prestation de service';
    default: return type;
  }
};