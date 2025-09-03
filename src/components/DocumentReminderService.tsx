import React, { useEffect, useRef } from 'react';
import { useSupabaseData } from './SupabaseDataProvider';
import { useNotifications } from './NotificationContext';
import { useDocumentNotifications } from './DocumentNotificationService';
import { useAuth } from './AuthProvider';

interface MissingDocuments {
  crewId: string;
  crewName: string;
  email: string;
  missingFields: string[];
  lastNotificationSent?: string;
  role: string;
}

const DocumentReminderService: React.FC = () => {
  const { crewMembers } = useSupabaseData();
  const { addNotification } = useNotifications();
  const { canSendNotification, recordNotification } = useDocumentNotifications();
  const { user } = useAuth();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check for missing documents
  const checkMissingDocuments = (crewMember: any): string[] => {
    const missingFields: string[] = [];

    // Check required profile fields
    if (!crewMember.phone) missingFields.push('Téléphone');
    if (!crewMember.address) missingFields.push('Adresse');
    if (!crewMember.emergency_contact) missingFields.push('Contact d\'urgence');
    if (!crewMember.iban) missingFields.push('RIB/IBAN');
    
    // Check passport
    if (!crewMember.passport_number) missingFields.push('Numéro de passeport');
    if (!crewMember.passport_expiry) missingFields.push('Date d\'expiration passeport');
    if (!crewMember.passport_country) missingFields.push('Pays du passeport');
    
    // Check certificates
    if (!crewMember.medical_certificate_expiry) missingFields.push('Certificat médical');
    if (!crewMember.license_expiry) missingFields.push('Licence de vol');
    
    // Check qualifications based on role
    if (crewMember.role === 'pilot') {
      if (!crewMember.qualifications?.includes('ATP')) missingFields.push('Qualification ATP');
    }
    if (crewMember.role === 'cabin_crew') {
      if (!crewMember.qualifications?.includes('Safety')) missingFields.push('Qualification Safety');
    }

    return missingFields;
  };

  // Function to send notification to crew member
  const sendDocumentReminder = async (crewMember: any, missingFields: string[]) => {
    try {
      console.log(`📧 Sending document reminder to ${crewMember.name} for missing: ${missingFields.join(', ')}`);
      
      // Create urgent notification for the crew member
      addNotification({
        type: 'warning',
        title: '📋 Documents Manquants - Action Requise',
        message: `Votre profil est incomplet. Documents manquants : ${missingFields.join(', ')}. Veuillez compléter votre profil dans les plus brefs délais.`,
        category: 'profile',
        userId: crewMember.id, // Target specific user
        metadata: {
          crewId: crewMember.id,
          missingFields: missingFields,
          action: 'complete_profile',
          actionUrl: '/profile',
          urgencyLevel: 'urgent',
          reminderType: 'document_completion'
        }
      });

      // Also create a system notification for admin tracking
      addNotification({
        type: 'info',
        title: '📧 Rappel Envoyé',
        message: `Rappel de documents envoyé à ${crewMember.name} (${missingFields.length} docs manquants)`,
        category: 'admin',
        metadata: {
          crewId: crewMember.id,
          crewName: crewMember.name,
          missingFieldsCount: missingFields.length,
          sentAt: new Date().toISOString()
        }
      });

      // Record the notification in DocumentNotificationService
      recordNotification(
        crewMember.id,
        crewMember.name,
        user?.id || 'system',
        user?.name || 'Système automatique',
        missingFields
      );

      console.log(`✅ Document reminder sent successfully to ${crewMember.name}`);
    } catch (error) {
      console.error('❌ Error sending document reminder:', error);
    }
  };

  // Function to check all crew members for missing documents
  const performDocumentCheck = async () => {
    console.log('🔍 Starting automated document check...');
    
    if (!crewMembers || crewMembers.length === 0) {
      console.log('⚠️ No crew members found for document check');
      return;
    }

    const crewMembersWithMissingDocs: MissingDocuments[] = [];

    // Check each crew member
    crewMembers.forEach(crewMember => {
      // Skip admin users and inactive crew
      if (crewMember.role === 'admin' || crewMember.status !== 'active') {
        return;
      }

      const missingFields = checkMissingDocuments(crewMember);
      
      if (missingFields.length > 0) {
        crewMembersWithMissingDocs.push({
          crewId: crewMember.id,
          crewName: crewMember.name,
          email: crewMember.email,
          missingFields,
          role: crewMember.role
        });
      }
    });

    console.log(`📊 Found ${crewMembersWithMissingDocs.length} crew members with missing documents`);

    // Send notifications for each crew member with missing documents
    for (const crewWithMissingDocs of crewMembersWithMissingDocs) {
      // Check if we can send notification (24h cooldown)
      if (canSendNotification(crewWithMissingDocs.crewId)) {
        const crewMember = crewMembers.find(c => c.id === crewWithMissingDocs.crewId);
        if (crewMember) {
          await sendDocumentReminder(crewMember, crewWithMissingDocs.missingFields);
          
          // Wait a bit between notifications to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        console.log(`⏳ Skipping ${crewWithMissingDocs.crewName} - notification already sent within 24h`);
      }
    }

    // Send summary notification to admin
    if (user?.role === 'admin' && crewMembersWithMissingDocs.length > 0) {
      const totalMissingDocs = crewMembersWithMissingDocs.reduce((total, crew) => total + crew.missingFields.length, 0);
      
      addNotification({
        type: 'info',
        title: '📋 Rapport Documents Manquants',
        message: `${crewMembersWithMissingDocs.length} membres d'équipage ont ${totalMissingDocs} documents manquants au total. Vérification automatique effectuée.`,
        category: 'admin',
        metadata: {
          action: 'view_crew_status',
          actionUrl: '/enhanced-crew'
        }
      });
    }

    console.log('✅ Automated document check completed');
  };

  useEffect(() => {
    // Only run for admin users
    if (user?.role !== 'admin') {
      return;
    }

    console.log('🚀 DocumentReminderService initialized for admin user');

    // Perform initial check after a short delay
    const initialTimeout = setTimeout(() => {
      performDocumentCheck();
    }, 5000); // 5 seconds after startup

    // Set up interval for every 24 hours (86400000 ms)
    // For testing, you can use shorter intervals like 60000 (1 minute)
    // Use environment variable for testing or default to 24 hours
    const testMode = window.location.hostname === 'localhost' || window.location.hostname.includes('figma');
    const interval = testMode ? 2 * 60 * 1000 : 24 * 60 * 60 * 1000; // 2 minutes in test mode, 24 hours in production
    
    checkIntervalRef.current = setInterval(() => {
      performDocumentCheck();
    }, interval);

    console.log(`⏰ Document reminder scheduled every ${testMode ? `${interval / 1000 / 60} minutes (TEST MODE)` : `${interval / 1000 / 60 / 60} hours`}`);

    // Cleanup
    return () => {
      if (initialTimeout) clearTimeout(initialTimeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        console.log('🛑 DocumentReminderService cleanup completed');
      }
    };
  }, [user, crewMembers]); // Re-run when user or crew data changes

  // Manual trigger function (for testing)
  const triggerManualCheck = () => {
    console.log('🔧 Manual document check triggered');
    performDocumentCheck();
  };

  // Add event listener for manual triggers (useful for testing)
  useEffect(() => {
    const handleManualTrigger = () => {
      triggerManualCheck();
    };

    window.addEventListener('triggerDocumentCheck', handleManualTrigger);
    
    return () => {
      window.removeEventListener('triggerDocumentCheck', handleManualTrigger);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default DocumentReminderService;

// Helper function to manually trigger document check (for testing in console)
declare global {
  interface Window {
    triggerDocumentCheck: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.triggerDocumentCheck = () => {
    window.dispatchEvent(new CustomEvent('triggerDocumentCheck'));
  };
}