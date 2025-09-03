// Types and interfaces for mission orders
export interface MissionOrder {
  id: string;
  type: 'extra_day' | 'freelance' | 'service';
  status: 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'pending_validation' | 'validated' | 'pending_date_modification';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  validatedAt?: string;
  validationRequestedAt?: string;
  dateModificationRequestedAt?: string;
  dateModificationApprovedAt?: string;
  isProvisionalOrder?: boolean; // Indicates if this is a provisional order that may change
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
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    currency: string;
    notes: string;
    invoiceNumber: string;
    invoiceDate: string;
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
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    currency: string;
    notes: string;
    invoiceNumber: string;
    invoiceDate: string;
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