import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import FreelancerLayout from './FreelancerLayout';
import AdminDashboard from './AdminDashboard';
import MissionRequest from './MissionRequest';
import MissionRequestDetail from './MissionRequestDetail';
import ManageMissions from './ManageMissions';
import ManageCrew from './ManageCrew';
import EnhancedManageCrew from './EnhancedManageCrew';
import CrewManagementComparison from './CrewManagementComparison';
import InviteUser from './InviteUser';
import InviteUserDirect from './InviteUserDirect';
import SupabaseDirectDiagnostic from './SupabaseDirectDiagnostic';
import FinanceExport from './FinanceExport';
import CostSimulation from './CostSimulation';
import Settings from './Settings';
import MissionOrderDocument from './MissionOrderDocument';
import ServiceInvoiceDocument from './ServiceInvoiceDocument';
import FreelancerDashboard from './FreelancerDashboard';
import FreelancerProfile from './FreelancerProfile';
import FreelancerMissions from './FreelancerMissions';
import MissionValidation from './MissionValidation';
import FinalMissionOrder from './FinalMissionOrder';
import CompleteMissionWorkflow from './CompleteMissionWorkflow';
import ClientApprovalPage from './ClientApprovalPage';
import CrewAvailabilityPredictor from './CrewAvailabilityPredictor';
import CrewQualificationTest from './CrewQualificationTest';
import DocumentReminderTest from './DocumentReminderTest';
import DataManagement from './DataManagement';
import CrewPickerTest from './CrewPickerTest';
import SimpleCrewPickerTest from './SimpleCrewPickerTest';
import SimpleCrewPickerDiagnostic from './SimpleCrewPickerDiagnostic';
import RLSPolicyDiagnostic from './RLSPolicyDiagnostic';
import AppHealthCheck from './AppHealthCheck';

interface AppRoutesProps {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'admin' | 'freelancer';
    user_metadata?: any;
    access_token?: string;
  };
  onLogout: () => Promise<void>;
}

export default function AppRoutes({ user, onLogout }: AppRoutesProps) {
  return (
    <Routes>
      {/* Public routes (no auth required) */}
      <Route path="/client-approval" element={<ClientApprovalPage />} />
      <Route path="/health-check" element={<AppHealthCheck />} />
      
      {user.role === 'admin' ? (
        <Route path="/" element={<AdminLayout user={user} onLogout={onLogout} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="mission-request" element={<MissionRequest />} />
          <Route path="mission-request/new" element={<MissionRequestDetail />} />
          <Route path="manage-missions" element={<ManageMissions />} />
          <Route path="manage-crew" element={<ManageCrew />} />
          <Route path="enhanced-crew" element={<EnhancedManageCrew />} />
          <Route path="crew-comparison" element={<CrewManagementComparison />} />
          <Route path="invite-user" element={<InviteUser />} />
          <Route path="invite-user-direct" element={<InviteUserDirect />} />
          <Route path="supabase-direct-diagnostic" element={<SupabaseDirectDiagnostic />} />
          <Route path="finance-export" element={<FinanceExport />} />
          <Route path="cost-simulation" element={<CostSimulation />} />
          <Route path="crew-availability-predictor" element={<CrewAvailabilityPredictor />} />
          <Route path="crew-qualification-test" element={<CrewQualificationTest />} />
          <Route path="document-reminder-test" element={<DocumentReminderTest />} />
          <Route path="crew-picker-test" element={<CrewPickerTest />} />
          <Route path="simple-crew-picker-test" element={<SimpleCrewPickerTest />} />
          <Route path="simple-crew-picker-diagnostic" element={<SimpleCrewPickerDiagnostic />} />
          <Route path="rls-diagnostic" element={<RLSPolicyDiagnostic />} />
          <Route path="data-management" element={<DataManagement />} />
          <Route path="settings" element={<Settings />} />
          <Route path="missions/:missionId" element={<MissionOrderDocument />} />
          <Route path="missions/:missionId/workflow" element={<CompleteMissionWorkflow />} />
          <Route path="missions/:missionId/invoice" element={<ServiceInvoiceDocument />} />
        </Route>
      ) : (
        <Route path="/" element={<FreelancerLayout user={user} onLogout={onLogout} />}>
          <Route index element={<FreelancerDashboard />} />
          <Route path="profile" element={<FreelancerProfile />} />
          <Route path="missions" element={<FreelancerMissions />} />
          <Route path="missions/:missionId" element={<MissionOrderDocument />} />
          <Route path="missions/:missionId/validate" element={<MissionValidation />} />
          <Route path="missions/:missionId/final" element={<FinalMissionOrder />} />
          <Route path="missions/:missionId/invoice" element={<ServiceInvoiceDocument />} />
        </Route>
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}