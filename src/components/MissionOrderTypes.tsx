// Types and interfaces for mission orders
export interface MissionOrder {
  id: string;
  type: 'extra_day' | 'freelance' | 'service';
  status: 'pending_finance_review' | 'finance_approved' | 'pending_approval' | 'waiting_owner_approval' | 'owner_rejected' | 'pending_client_approval' | 'approved' | 'rejected' | 'client_rejected' | 'pending_execution' | 'in_progress' | 'completed' | 'cancelled' | 'pending_validation' | 'validated' | 'pending_date_modification';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  validatedAt?: string;
  validationRequestedAt?: string;
  dateModificationRequestedAt?: string;
  dateModificationApprovedAt?: string;
  clientApprovedAt?: string;
  clientRejectedAt?: string;
  assignedToCrewAt?: string; // When mission was assigned to crew member
  executionStartedAt?: string; // When crew member started execution
  isProvisionalOrder?: boolean; // Indicates if this is a provisional order that may change
  
  // Owner approval workflow
  ownerApprovedAt?: string;
  financeApprovedAt?: string;
  
  // Email and billing data for enhanced workflow
  emailData?: {
    ownerEmail: string;
    subject: string;
    message: string;
    fees: {
      dailyRate: number;
      perDiem: number;
      duration: number;
      totalSalary: number;
      totalPerDiem: number;
      totalFees: number;
      margin: number;
      totalWithMargin: number;
      currency: string;
      additionalFees?: Array<{
        name: string;
        amount: number;
      }>;
    };
    marginType?: 'percentage' | 'fixed';
    marginPercent: number;
    marginAmount?: number;
    billingNotes?: string;
    invoiceTerms?: string;
    paymentTerms?: string;
    sentAt?: string; // When the email was sent to client
  };
  
  // Client response data
  clientResponse?: {
    approved: boolean;
    respondedAt: string;
    comments?: string;
    rejectionReason?: string;
  };
  
  crew: {
    id: string;
    name: string;
    position: string;
    type: string;
    ggid: string;
    email: string;
    phone?: string;
  };
  
  aircraft: {
    id: string;
    immat: string;
    type: string;
  };
  
  flights: Array<{
    id: string;
    flight: string;
    departure: string;
    arrival: string;
    date: string;
    time: string;
  }>;
  
  contract: {
    startDate: string;
    endDate: string;
    salaryAmount: number;
    salaryCurrency: string;
    salaryType: 'daily' | 'monthly';
    hasPerDiem: boolean;
    perDiemAmount?: number;
    perDiemCurrency?: string;
    additionalNotes?: string;
    // Extra day specific fields (admin only, not visible to crew)
    ownerApproval?: boolean;
    ownerApprovalComment?: string;
  };
  
  approver?: {
    name: string;
    email: string;
    date: string;
  };
  
  rejectionReason?: string;
  autoApproved?: boolean;
  
  // Validation fields
  validation?: {
    requestedAt: string;
    validatedAt?: string;
    crewComments?: string;
    ribConfirmed?: boolean;
    issuesReported?: string[];
    paymentIssue?: boolean;
    paymentIssueDetails?: string;
  };
  
  // Date modification fields
  dateModification?: {
    requestedAt: string;
    approvedAt?: string;
    originalStartDate: string;
    originalEndDate: string;
    newStartDate: string;
    newEndDate: string;
    reason: string;
    approverComment?: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  
  // Service invoice fields - only for service type missions
  serviceInvoice?: {
    lines: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      category: string;
    }>;
    contractSubtotal: number; // Total du contrat de base (salaire + per diem)
    expensesSubtotal: number; // Total des dépenses annexes ajoutées
    subtotal: number; // Total général avant taxes
    taxRate: number;
    taxAmount: number;
    total: number; // Total final incluant contrat + dépenses + taxes
    currency: string;
    notes: string;
    invoiceNumber: string;
    invoiceDate: string;
    companyName: string; // Nom de l'entreprise du freelancer
    vatNumber: string; // Numéro de TVA
    externalInvoiceFile?: {
      name: string;
      size: number;
      type: string;
      uploadedAt: string;
    };
  };
}

export interface ValidationData {
  crewComments?: string;
  ribConfirmed: boolean;
  issuesReported?: string[];
  paymentIssue?: boolean;
  paymentIssueDetails?: string;
  dateModification?: {
    originalStartDate: string;
    originalEndDate: string;
    newStartDate: string;
    newEndDate: string;
    reason: string;
  };
  serviceInvoice?: {
    lines: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      category: string;
    }>;
    contractSubtotal: number; // Total du contrat de base (salaire + per diem)
    expensesSubtotal: number; // Total des dépenses annexes ajoutées
    subtotal: number; // Total général avant taxes
    taxRate: number;
    taxAmount: number;
    total: number; // Total final incluant contrat + dépenses + taxes
    currency: string;
    notes: string;
    invoiceNumber: string;
    invoiceDate: string;
    companyName: string; // Nom de l'entreprise du freelancer
    vatNumber: string; // Numéro de TVA
    externalInvoiceFile?: File;
  };
}

export interface DateModificationData {
  originalStartDate: string;
  originalEndDate: string;
  newStartDate: string;
  newEndDate: string;
  reason: string;
}

export interface APIConnectionDiagnostic {
  serverReachable: boolean;
  authValid: boolean;
  endpointWorking: boolean;
  error?: string;
}

// Mission assignment notification data
export interface MissionAssignmentNotification {
  missionId: string;
  crewId: string;
  crewName: string;
  assignedAt: string;
  missionDetails: {
    type: string;
    startDate: string;
    endDate: string;
    aircraft: string;
    clientName?: string;
    location?: string;
    totalAmount?: number;
    currency?: string;
  };
}