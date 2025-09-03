// Local client to replace Supabase API calls for offline/local development

interface LocalApiResponse<T> {
  data?: T;
  error?: Error | null;
  success: boolean;
}

class LocalApiClient {
  private accessToken: string = '';
  private missions: any[] = []; // In-memory mission storage

  setAccessToken(token: string) {
    this.accessToken = token;
    console.log('Local API token set:', token ? '***' : 'cleared');
  }

  async healthCheck(): Promise<LocalApiResponse<{ status: string }>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      data: { status: 'healthy' },
      error: null,
      success: true
    };
  }

  async logout(): Promise<void> {
    console.log('Local API logout called');
    this.setAccessToken('');
    // Clear any local storage
    localStorage.removeItem('crewtech_auth_user');
  }

  // Database status methods
  async getDatabaseStatus(): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const status = {
      users: this.mockUsers.length,
      crew: this.mockCrewData.length,
      missions: this.missions.length,
      notifications: 0,
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
    
    return {
      data: status,
      error: null,
      success: true
    };
  }

  async getPublicDatabaseStatus(): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const status = {
      database_status: {
        users: this.mockUsers.length,
        crew: this.mockCrewData.length,
        missions: this.missions.length,
        notifications: 0
      },
      server_status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return {
      data: status,
      error: null,
      success: true
    };
  }

  // Mock users data
  private mockUsers = [
    {
      id: 'admin-001',
      name: 'Admin User',
      email: 'admin@crewtech.fr',
      role: 'admin'
    },
    {
      id: 'internal-001',
      name: 'Pierre Dubois',
      email: 'internal@crewtech.fr',
      role: 'internal'
    },
    {
      id: 'freelancer-001',
      name: 'Lisa Anderson',
      email: 'freelancer@aviation.com',
      role: 'freelancer'
    },
    {
      id: 'freelancer-002',
      name: 'Marco Rossi',
      email: 'captain@freelance.eu',
      role: 'freelancer'
    }
  ];

  // Users methods
  async getUsers(): Promise<LocalApiResponse<any[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      data: this.mockUsers,
      error: null,
      success: true
    };
  }

  // Mock crew data storage
  private mockCrewData = [
    {
      id: 'internal-001',
      name: 'Pierre Dubois',
      email: 'internal@crewtech.fr',
      position: 'Captain',
      type: 'internal',
      role: 'internal',
      ggid: 'EMP-001',
      qualifications: ['F-HCTA', 'F-HCTB'], // Citation CJ3+ and King Air 350
      availability: 'available',
      missing_docs: [],
      phone: '+33 1 45 67 89 13',
      address: '456 Pilot Avenue, Paris, France',
      emergencyContact: { name: 'Marie Dubois', phone: '+33 1 45 67 89 14' },
      licenseNumber: 'ATPL-FR-11111',
      medicalExpiry: '2025-06-15',
      passportNumber: 'FR111111111'
    },
    {
      id: 'internal-002',
      name: 'Marie Martin',
      email: 'marie.martin@crewtech.fr',
      position: 'First Officer',
      type: 'internal',
      role: 'internal',
      ggid: 'EMP-002',
      qualifications: ['F-HCTA', 'F-HCTC'], // Citation CJ3+ and Phenom 300
      availability: 'available',
      missing_docs: ['medical'], // Expired medical
      phone: '+33 1 45 67 89 14',
      address: '789 Copilot Street, Lyon, France',
      emergencyContact: { name: 'Jean Martin', phone: '+33 1 45 67 89 15' },
      licenseNumber: 'CPL-FR-22222',
      medicalExpiry: '2024-12-01',
      passportNumber: 'FR222222222'
    },
    {
      id: 'freelancer-001',
      name: 'Lisa Anderson',
      email: 'freelancer@aviation.com',
      position: 'Flight Attendant',
      type: 'freelancer',
      role: 'freelancer',
      ggid: 'CREW-001',
      qualifications: ['F-HCTA', 'F-HCTB'], // Citation CJ3+ and King Air 350
      availability: 'available',
      missing_docs: [],
      phone: '+33 6 12 34 56 78',
      address: '123 Aviation Street, Nice, France',
      emergencyContact: { name: 'John Anderson', phone: '+33 6 12 34 56 79' },
      licenseNumber: 'CCAF-FR-12345',
      medicalExpiry: '2025-08-15',
      passportNumber: 'FR123456789'
    },
    {
      id: 'freelancer-002',
      name: 'Marco Rossi',
      email: 'captain@freelance.eu',
      position: 'Captain',
      type: 'freelancer',
      role: 'freelancer',
      ggid: 'CREW-002',
      qualifications: ['F-HCTA', 'F-HCTB'], // Citation CJ3+ and King Air 350
      availability: 'available',
      missing_docs: [],
      phone: '+33 6 23 45 67 89',
      address: '456 Captain Street, Marseille, France',
      emergencyContact: { name: 'Sofia Rossi', phone: '+33 6 23 45 67 90' },
      licenseNumber: 'ATPL-FR-12345',
      medicalExpiry: '2025-08-15',
      passportNumber: 'IT123456789'
    },
    {
      id: 'freelancer-003',
      name: 'Sarah Mitchell',
      email: 'sarah@crewaviation.com',
      position: 'First Officer',
      type: 'freelancer',
      role: 'freelancer',
      ggid: 'CREW-003',
      qualifications: ['F-HCTC'], // Phenom 300 only
      availability: 'available',
      missing_docs: [],
      phone: '+33 6 34 56 78 90',
      address: '789 Copilot Avenue, Nice, France',
      emergencyContact: { name: 'David Mitchell', phone: '+33 6 34 56 78 91' },
      licenseNumber: 'CPL-FR-34567',
      medicalExpiry: '2025-06-15',
      passportNumber: 'GB123456789'
    },
    {
      id: 'internal-003',
      name: 'Claire Bernard',
      email: 'claire.bernard@crewtech.fr',
      position: 'Senior Flight Attendant',
      type: 'internal',
      role: 'internal',
      ggid: 'EMP-003',
      qualifications: ['F-HCTA', 'F-HCTB', 'F-HCTC'], // All aircraft
      availability: 'available',
      missing_docs: [],
      phone: '+33 1 45 67 89 15',
      address: '456 Cabin Crew Avenue, Lyon, France',
      emergencyContact: { name: 'Paul Bernard', phone: '+33 1 45 67 89 16' },
      licenseNumber: 'CCAF-FR-67890',
      medicalExpiry: '2025-12-01',
      passportNumber: 'FR987654321'
    },
    {
      id: 'freelancer-004',
      name: 'Thomas Dupont',
      email: 'thomas.dupont@aviation.fr',
      position: 'Flight Attendant',
      type: 'freelancer',
      role: 'freelancer',
      ggid: 'CREW-004',
      qualifications: ['F-HCTA'], // Citation CJ3+ only
      availability: 'available',
      missing_docs: ['phone', 'address', 'emergency_contact', 'license', 'passport'], // Missing several documents
      phone: '',
      address: '',
      emergencyContact: null,
      licenseNumber: '',
      medicalExpiry: '2025-03-15',
      passportNumber: ''
    }
  ];

  // Crew data methods (placeholder for local development)
  async getCrewData(): Promise<LocalApiResponse<any[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('LocalClient returning crew data with correct qualifications:', this.mockCrewData.map(c => ({ 
      id: c.id, 
      name: c.name, 
      position: c.position,
      qualifications: c.qualifications 
    })));

    return {
      data: this.mockCrewData,
      error: null,
      success: true
    };
  }

  // Get crew method for compatibility
  async getCrew(): Promise<LocalApiResponse<{ crew: any[] }>> {
    const result = await this.getCrewData();
    return {
      data: { crew: result.data || [] },
      error: result.error,
      success: result.success
    };
  }

  // Auto seed database method
  async autoSeedDatabase(): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Auto seeding database with local data...');
    
    // Simulate seeding by ensuring we have data
    const seedResult = {
      users_created: this.mockUsers.length,
      crew_created: this.mockCrewData.length,
      missions_created: this.missions.length,
      status: 'success'
    };
    
    return {
      data: seedResult,
      error: null,
      success: true
    };
  }

  // Crew status update method
  async updateCrewStatus(crewId: string, newStatus: string): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update crew status in mock data
    const crewIndex = this.mockCrewData.findIndex(c => c.id === crewId);
    if (crewIndex !== -1) {
      this.mockCrewData[crewIndex].availability = newStatus;
      return {
        data: this.mockCrewData[crewIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: null,
      error: new Error(`Crew member ${crewId} not found`),
      success: false
    };
  }

  // Mission data methods with persistent storage
  async getMissionData(): Promise<LocalApiResponse<any[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('LocalClient getMissionData called, returning', this.missions.length, 'missions');
    console.log('Current missions in storage:', this.missions.map(m => ({ id: m.id, status: m.status, crew: m.crew?.name })));
    
    return {
      data: [...this.missions], // Return a copy to avoid mutation
      error: null,
      success: true
    };
  }

  async createMission(missionData: any): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockMission = {
      id: `mission-${Date.now()}`,
      ...missionData,
      status: missionData.status || 'pending_finance_review', // Default to finance review
      createdAt: new Date().toISOString()
    };

    // Store the mission in memory
    this.missions.push(mockMission);
    
    console.log('Local mission created and stored:', mockMission);
    console.log('Total missions in storage:', this.missions.length);

    return {
      data: mockMission,
      error: null,
      success: true
    };
  }

  // Additional mission methods for compatibility
  async getMissions(): Promise<LocalApiResponse<any[]>> {
    return this.getMissionData();
  }

  async getMission(id: string): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Look for the mission in our storage first
    const storedMission = this.missions.find(m => m.id === id);
    if (storedMission) {
      console.log('Found mission in storage:', id);
      return {
        data: storedMission,
        error: null,
        success: true
      };
    }
    
    // Fallback to mock data
    return {
      data: {
        id,
        status: 'pending_validation',
        crew: { id: 'crew-1', name: 'Local User' },
        type: 'freelance'
      },
      error: null,
      success: true
    };
  }

  async approveMission(id: string, emailData?: any): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === id);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'approved',
        approvedAt: new Date().toISOString(),
        ...(emailData && { emailData })
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: {
        id,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        ...(emailData && { emailData })
      },
      error: null,
      success: true
    };
  }

  async rejectMission(id: string, reason: string): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === id);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: {
        id,
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
      },
      error: null,
      success: true
    };
  }

  async validateMission(id: string, validationData: any): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === id);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'validated',
        validatedAt: new Date().toISOString(),
        validation: validationData
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: {
        id,
        status: 'validated',
        validatedAt: new Date().toISOString(),
        validation: validationData
      },
      error: null,
      success: true
    };
  }

  async requestDateModification(missionId: string, dateModificationData: any): Promise<LocalApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Date modification requested for mission ${missionId}:`, dateModificationData);
    
    return {
      error: null,
      success: true
    };
  }

  async approveDateModification(missionId: string, approverComment?: string): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === missionId);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'validated',
        approverComment
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: {
        id: missionId,
        status: 'validated',
        approverComment
      },
      error: null,
      success: true
    };
  }

  async rejectDateModification(missionId: string, rejectionReason: string): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === missionId);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'pending_validation',
        rejectionReason
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: {
        id: missionId,
        status: 'pending_validation',
        rejectionReason
      },
      error: null,
      success: true
    };
  }

  async checkMissionsForValidation(): Promise<LocalApiResponse<{ updated: number }>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      data: { updated: 0 },
      error: null,
      success: true
    };
  }

  async updateMissionInvoice(missionId: string, invoiceData: any): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.log(`Invoice updated for mission ${missionId}:`, invoiceData);

    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === missionId);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'validated',
        serviceInvoice: invoiceData,
        updatedAt: new Date().toISOString()
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }

    return {
      data: {
        id: missionId,
        status: 'validated',
        serviceInvoice: invoiceData,
        updatedAt: new Date().toISOString()
      },
      error: null,
      success: true
    };
  }

  async approveOwnerAction(missionId: string, comments?: string): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Owner approved mission ${missionId} with comments:`, comments);
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === missionId);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'pending_client_approval',
        ownerApprovedAt: new Date().toISOString(),
        ownerComments: comments,
        // Generate client approval email template but don't send it
        clientApprovalEmailTemplate: this.generateClientApprovalEmailTemplate(this.missions[missionIndex])
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: {
        id: missionId,
        status: 'pending_client_approval',
        ownerApprovedAt: new Date().toISOString(),
        ownerComments: comments,
        clientApprovalEmailTemplate: this.generateClientApprovalEmailTemplate({ id: missionId })
      },
      error: null,
      success: true
    };
  }

  async rejectOwnerAction(missionId: string, reason: string): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Owner rejected mission ${missionId} with reason:`, reason);
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === missionId);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'owner_rejected',
        ownerRejectedAt: new Date().toISOString(),
        ownerRejectionReason: reason
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: {
        id: missionId,
        status: 'owner_rejected',
        ownerRejectedAt: new Date().toISOString(),
        ownerRejectionReason: reason
      },
      error: null,
      success: true
    };
  }

  async approveClientResponse(missionId: string, comments?: string): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === missionId);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'approved',
        clientApprovedAt: new Date().toISOString(),
        clientComments: comments,
        ownerApprovalDecision: 'approved' // Track owner approval decision
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: {
        id: missionId,
        status: 'approved',
        clientApprovedAt: new Date().toISOString(),
        clientComments: comments,
        ownerApprovalDecision: 'approved'
      },
      error: null,
      success: true
    };
  }

  async rejectClientResponse(missionId: string, reason: string): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === missionId);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'client_rejected',
        clientRejectedAt: new Date().toISOString(),
        clientRejectionReason: reason,
        ownerApprovalDecision: 'rejected' // Track owner approval decision
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: {
        id: missionId,
        status: 'client_rejected',
        clientRejectedAt: new Date().toISOString(),
        clientRejectionReason: reason,
        ownerApprovalDecision: 'rejected'
      },
      error: null,
      success: true
    };
  }

  // New method for finance approval - updated to set status to waiting_owner_approval
  async approveFinanceReview(missionId: string, enhancedEmailData: any): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Finance approved mission ${missionId} with enhanced email data:`, enhancedEmailData);
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === missionId);
    if (missionIndex !== -1) {
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: 'waiting_owner_approval', // Changed from pending_client_approval to waiting_owner_approval
        emailData: enhancedEmailData,
        financeApprovedAt: new Date().toISOString()
      };
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    return {
      data: {
        id: missionId,
        status: 'waiting_owner_approval', // Changed from pending_client_approval to waiting_owner_approval
        emailData: enhancedEmailData,
        financeApprovedAt: new Date().toISOString()
      },
      error: null,
      success: true
    };
  }

  // Helper method to generate client approval email template
  private generateClientApprovalEmailTemplate(mission: any): any {
    const template = {
      to: mission.emailData?.ownerEmail || 'client@example.com',
      subject: `Mission Order Approval Required - ${mission.id}`,
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Mission Order Approval Required</h2>
          
          <p>Dear Client,</p>
          
          <p>Please find below the mission order details for your approval:</p>
          
          <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Mission Details</h3>
            <p><strong>Mission ID:</strong> ${mission.id}</p>
            <p><strong>Crew:</strong> ${mission.crew?.name || 'TBD'} (${mission.crew?.position || 'TBD'})</p>
            <p><strong>Aircraft:</strong> ${mission.aircraft?.immat || 'TBD'} (${mission.aircraft?.type || 'TBD'})</p>
            <p><strong>Duration:</strong> ${mission.emailData?.fees?.duration || 0} days</p>
            <p><strong>Total Amount:</strong> ${mission.emailData?.fees?.totalWithMargin?.toFixed(2) || 0} ${mission.emailData?.fees?.currency || 'EUR'}</p>
          </div>
          
          <p>Please review and confirm your approval of this mission order.</p>
          
          <p>Best regards,<br/>CrewTech Team</p>
        </div>
      `,
      bodyText: `
Mission Order Approval Required - ${mission.id}

Dear Client,

Please find below the mission order details for your approval:

Mission ID: ${mission.id}
Crew: ${mission.crew?.name || 'TBD'} (${mission.crew?.position || 'TBD'})
Aircraft: ${mission.aircraft?.immat || 'TBD'} (${mission.aircraft?.type || 'TBD'})
Duration: ${mission.emailData?.fees?.duration || 0} days
Total Amount: ${mission.emailData?.fees?.totalWithMargin?.toFixed(2) || 0} ${mission.emailData?.fees?.currency || 'EUR'}

Please review and confirm your approval of this mission order.

Best regards,
CrewTech Team
      `,
      generatedAt: new Date().toISOString()
    };

    return template;
  }

  async updateMissionStatus(missionId: string, newStatus: string): Promise<LocalApiResponse<any>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`[LocalClient] Updating mission ${missionId} status to: ${newStatus}`);
    
    // Update mission in storage if it exists
    const missionIndex = this.missions.findIndex(m => m.id === missionId);
    if (missionIndex !== -1) {
      const now = new Date().toISOString();
      this.missions[missionIndex] = {
        ...this.missions[missionIndex],
        status: newStatus,
        ...(newStatus === 'pending_execution' && { assignedToCrewAt: now }),
        updatedAt: now
      };
      
      console.log(`[LocalClient] Mission ${missionId} status updated to ${newStatus}`);
      
      return {
        data: this.missions[missionIndex],
        error: null,
        success: true
      };
    }
    
    console.warn(`[LocalClient] Mission ${missionId} not found for status update`);
    
    return {
      data: null,
      error: new Error(`Mission ${missionId} not found`),
      success: false
    };
  }

  async pingServer(): Promise<LocalApiResponse<{ status: string }>> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      data: { status: 'pong' },
      error: null,
      success: true
    };
  }

  // Flight data methods (placeholder for local development)
  async getFlightData(): Promise<LocalApiResponse<any[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock flight data with correct aircraft immatriculations
    const mockFlightData = [
      {
        id: 'flight-1',
        flight: 'CT001',
        aircraftId: 'aircraft-001',
        aircraftImmat: 'F-HCTA',
        departure: 'LFPB',
        arrival: 'EGGW',
        date: '2024-01-15',
        time: '08:00',
        status: 'scheduled'
      },
      {
        id: 'flight-2',
        flight: 'CT002',
        aircraftId: 'aircraft-002',
        aircraftImmat: 'F-HCTB',
        departure: 'EGGW',
        arrival: 'LFMD',
        date: '2024-01-16',
        time: '14:00',
        status: 'scheduled'
      },
      {
        id: 'flight-3',
        flight: 'CT003',
        aircraftId: 'aircraft-003',
        aircraftImmat: 'F-HCTC',
        departure: 'LFMD',
        arrival: 'LFPB',
        date: '2024-01-17',
        time: '11:15',
        status: 'scheduled'
      }
    ];

    return {
      data: mockFlightData,
      error: null,
      success: true
    };
  }
}

// Create and export singleton instance
export const localApiClient = new LocalApiClient();

// Export as default for compatibility
export default localApiClient;