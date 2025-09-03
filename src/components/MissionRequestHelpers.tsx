// Helper functions for MissionRequestDetail component

export const getMissingFields = (crew: any) => {
  const missing = [];
  
  // Safety check for crew object
  if (!crew) {
    return missing;
  }
  
  if (!crew.phone || crew.phone === '') {
    missing.push({ field: 'phone', label: 'Phone Number', required: true });
  }
  
  if (!crew.address || crew.address === '') {
    missing.push({ field: 'address', label: 'Current Address', required: true });
  }
  
  if (!crew.emergencyContact || !crew.emergencyContact.name) {
    missing.push({ field: 'emergency_contact', label: 'Emergency Contact', required: true });
  }
  
  // Check for missing medical certificate
  if (!crew.medicalExpiry || crew.medicalExpiry === '') {
    missing.push({ field: 'medical', label: 'Medical Certificate', required: true });
  } else {
    // Check for expired medical
    const medicalExpiry = new Date(crew.medicalExpiry);
    const now = new Date();
    if (medicalExpiry <= now) {
      missing.push({ field: 'medical', label: 'Medical Certificate (Expired)', required: true });
    }
  }
  
  if (!crew.licenseNumber || crew.licenseNumber === 'Not provided' || crew.licenseNumber === '') {
    missing.push({ field: 'license', label: 'License Number', required: true });
  }
  
  if (!crew.passportNumber || crew.passportNumber === 'Not provided' || crew.passportNumber === '') {
    missing.push({ field: 'passport', label: 'Passport Number', required: true });
  }
  
  return missing;
};

export const validateForm = (contractData: any, requestType: string) => {
  console.log('Validating form with data:', contractData);
  
  // Check individual validation criteria
  const hasStartDate = !!contractData.startDate;
  const hasEndDate = !!contractData.endDate;
  
  // Salary validation: if locked (matrix rate), no comment needed. If unlocked (manual override), comment required
  const salaryValidation = contractData.salaryLocked || (!contractData.salaryLocked && contractData.salaryComment);
  
  // Per diem validation: if no per diem or if locked (matrix rate), no comment needed. If unlocked, comment required
  const perDiemValidation = !contractData.hasPerDiem || contractData.perDiemLocked || (!contractData.perDiemLocked && contractData.perDiemComment);
  
  console.log('Validation breakdown:', {
    hasStartDate,
    hasEndDate,
    salaryValidation,
    perDiemValidation,
    salaryLocked: contractData.salaryLocked,
    salaryComment: contractData.salaryComment,
    hasPerDiem: contractData.hasPerDiem,
    perDiemLocked: contractData.perDiemLocked,
    perDiemComment: contractData.perDiemComment
  });
  
  const baseValidation = hasStartDate && hasEndDate && salaryValidation && perDiemValidation;
         
  // For extra day requests, owner approval comment is required if approval is granted
  if (requestType === 'extra_day') {
    const ownerApprovalValidation = !contractData.ownerApproval || (contractData.ownerApproval && contractData.ownerApprovalComment);
    console.log('Extra day validation:', {
      ownerApproval: contractData.ownerApproval,
      ownerApprovalComment: contractData.ownerApprovalComment,
      ownerApprovalValidation
    });
    return baseValidation && ownerApprovalValidation;
  }
  
  console.log('Final validation result:', baseValidation);
  return baseValidation;
};

export const createMissionData = (requestType: string, crew: any, aircraft: any, selectedFlights: any[], contractData: any) => {
  console.log('Creating mission data with crew:', crew);
  
  return {
    type: requestType,
    crew: {
      id: crew.id || '',
      name: crew.name || 'Unknown',
      position: crew.position || 'Unknown',
      type: crew.type || 'freelancer',
      ggid: crew.ggid || 'N/A',
      email: crew.email || '',
      phone: crew.phone || '',
      // Include additional fields for completeness
      address: crew.address || '',
      qualifications: crew.qualifications || [],
      emergencyContact: crew.emergencyContact || null,
      licenseNumber: crew.licenseNumber || '',
      medicalExpiry: crew.medicalExpiry || '',
      passportNumber: crew.passportNumber || ''
    },
    aircraft: aircraft ? {
      id: aircraft.id,
      immat: aircraft.immat,
      type: aircraft.type
    } : null,
    flights: selectedFlights || [],
    contract: contractData
  };
};