import * as kv from "./kv_store.tsx";

// Helper function to create sample missions
export function createSampleMissions(createdUsers: any[]) {
  return [
    {
      id: 'MO-20241212001',
      type: 'freelance',
      crew: createdUsers.find(u => u.email === 'freelancer@aviation.com'),
      aircraft: { id: 'AC001', immat: 'F-HBCD', type: 'Citation CJ3' },
      flights: [
        {
          id: '1',
          aircraftId: 'AC001',
          flight: 'CRW001',
          departure: 'LFPB',
          arrival: 'EGGW',
          date: '2024-12-15',
          time: '09:00'
        }
      ],
      contract: {
        startDate: '2024-12-15',
        endDate: '2024-12-15',
        salaryAmount: 450,
        salaryCurrency: 'EUR',
        salaryType: 'daily',
        hasPerDiem: true,
        perDiemAmount: 80,
        perDiemCurrency: 'EUR'
      },
      status: 'approved',
      createdAt: '2024-12-10T10:00:00Z',
      approvedAt: '2024-12-11T14:30:00Z',
      approver: {
        id: createdUsers.find(u => u.email === 'admin@crewtech.fr')?.id,
        name: 'Sophie Laurent',
        email: 'admin@crewtech.fr',
        date: '2024-12-11T14:30:00Z'
      }
    },
    {
      id: 'MO-20241212002',
      type: 'extra_day',
      crew: createdUsers.find(u => u.email === 'internal@crewtech.fr'),
      aircraft: { id: 'AC002', immat: 'F-GXYZ', type: 'King Air 350' },
      flights: [
        {
          id: '2',
          aircraftId: 'AC002',
          flight: 'CRW002',
          departure: 'LFMD',
          arrival: 'EGLL',
          date: '2024-12-18',
          time: '14:30'
        }
      ],
      contract: {
        startDate: '2024-12-18',
        endDate: '2024-12-18',
        salaryAmount: 750,
        salaryCurrency: 'EUR',
        salaryType: 'daily',
        hasPerDiem: false,
        ownerApproval: true,
        ownerApprovalComment: 'Owner approval obtained via phone call on 2024-12-10. Confirmed rates and availability for extra day assignment.'
      },
      status: 'pending_approval',
      createdAt: '2024-12-11T08:00:00Z'
    },
    {
      id: 'MO-20241212003',
      type: 'freelance',
      crew: createdUsers.find(u => u.email === 'captain@freelance.eu'),
      aircraft: { id: 'AC003', immat: 'F-HABC', type: 'Phenom 300' },
      flights: [
        {
          id: '3',
          aircraftId: 'AC003',
          flight: 'CRW003',
          departure: 'EGLL',
          arrival: 'LFMD',
          date: '2024-12-20',
          time: '16:45'
        },
        {
          id: '4',
          aircraftId: 'AC003',
          flight: 'CRW004',
          departure: 'LFMD',
          arrival: 'EGLL',
          date: '2024-12-22',
          time: '10:30'
        }
      ],
      contract: {
        startDate: '2024-12-20',
        endDate: '2024-12-22',
        salaryAmount: 900,
        salaryCurrency: 'EUR',
        salaryType: 'daily',
        hasPerDiem: true,
        perDiemAmount: 120,
        perDiemCurrency: 'EUR'
      },
      status: 'rejected',
      createdAt: '2024-12-09T16:20:00Z',
      rejectedAt: '2024-12-10T11:15:00Z',
      rejectionReason: 'Captain not available for the requested dates',
      rejectedBy: {
        id: createdUsers.find(u => u.email === 'admin@crewtech.fr')?.id,
        name: 'Sophie Laurent',
        email: 'admin@crewtech.fr'
      }
    },
    {
      id: 'MO-2024-005',
      type: 'freelance',
      crew: createdUsers.find(u => u.email === 'sarah@crewaviation.com'),
      aircraft: { id: 'AC004', immat: 'F-HDEF', type: 'Mustang' },
      flights: [
        {
          id: '5',
          aircraftId: 'AC004',
          flight: 'CRW005',
          departure: 'LFPG',
          arrival: 'EGKK',
          date: '2024-12-25',
          time: '11:00'
        }
      ],
      contract: {
        startDate: '2024-12-25',
        endDate: '2024-12-26',
        salaryAmount: 600,
        salaryCurrency: 'EUR',
        salaryType: 'daily',
        hasPerDiem: true,
        perDiemAmount: 90,
        perDiemCurrency: 'EUR',
        additionalNotes: 'ORDRE PROVISOIRE - Les dates et la durée peuvent être modifiées selon la durée réelle de la mission.'
      },
      status: 'pending_date_modification',
      createdAt: '2024-12-10T15:30:00Z',
      approvedAt: '2024-12-10T15:30:00Z',
      completedAt: '2024-12-26T18:00:00Z',
      validatedAt: '2024-12-27T09:15:00Z',
      dateModificationRequestedAt: '2024-12-27T09:30:00Z',
      dateModificationRequestedBy: createdUsers.find(u => u.email === 'sarah@crewaviation.com')?.id,
      approver: {
        id: createdUsers.find(u => u.email === 'admin@crewtech.fr')?.id,
        name: 'Sophie Laurent', 
        email: 'admin@crewtech.fr',
        date: '2024-12-10T15:30:00Z'
      },
      dateModification: {
        requestedAt: '2024-12-27T09:30:00Z',
        originalStartDate: '2024-12-25',
        originalEndDate: '2024-12-26',
        newStartDate: '2024-12-24',
        newEndDate: '2024-12-27',
        reason: 'Mission s\'est étendue sur 3 jours supplémentaires à cause des conditions météorologiques. Avons été bloqués à EGKK pendant 2 jours.',
        status: 'pending'
      },
      validation: {
        validatedAt: '2024-12-27T09:15:00Z',
        crewComments: 'Mission completed successfully but extended due to weather delays.',
        ribConfirmed: true,
        issuesReported: [],
        paymentIssue: false
      }
    },
    {
      id: 'MO-2024-007',
      type: 'service',
      crew: createdUsers.find(u => u.email === 'captain@freelance.eu'), // Marco Rossi
      aircraft: { id: 'AC001', immat: 'F-HBCD', type: 'Citation CJ3' },
      flights: [
        {
          id: '8',
          aircraftId: 'AC001',
          flight: 'SRV001',
          departure: 'LFPG',
          arrival: 'EGLL',
          date: '2024-12-10',
          time: '14:00'
        }
      ],
      contract: {
        startDate: '2024-12-10',
        endDate: '2024-12-10',
        salaryAmount: 900,
        salaryCurrency: 'EUR',
        salaryType: 'daily',
        hasPerDiem: false,
        additionalNotes: 'Mission de service - Maintenance technique et formation équipage'
      },
      serviceInvoice: {
        invoiceNumber: 'INV-SRV-2024-007',
        invoiceDate: '2024-12-10',
        currency: 'EUR',
        lines: [
          {
            id: 'line-1',
            description: 'Transport aéroport - hôtel',
            quantity: 2,
            unitPrice: 45.00,
            category: 'transport',
            total: 90.00
          },
          {
            id: 'line-2',
            description: 'Repas équipage - restaurant',
            quantity: 3,
            unitPrice: 28.50,
            category: 'meals',
            total: 85.50
          },
          {
            id: 'line-3',
            description: 'Hébergement - hôtel 1 nuit',
            quantity: 1,
            unitPrice: 120.00,
            category: 'accommodation',
            total: 120.00
          },
          {
            id: 'line-4',
            description: 'Communication - téléphone/internet',
            quantity: 1,
            unitPrice: 25.00,
            category: 'communication',
            total: 25.00
          }
        ],
        subtotal: 320.50,
        taxRate: 20.0,
        taxAmount: 64.10,
        total: 384.60,
        notes: 'Frais engagés pour la mission de maintenance technique et formation équipage sur Citation CJ3.'
      },
      status: 'approved',
      createdAt: '2024-12-08T10:00:00Z',
      approvedAt: '2024-12-08T14:30:00Z',
      completedAt: '2024-12-10T20:00:00Z',
      approver: {
        id: createdUsers.find(u => u.email === 'admin@crewtech.fr')?.id,
        name: 'Sophie Laurent',
        email: 'admin@crewtech.fr',
        date: '2024-12-08T14:30:00Z'
      }
    },
    {
      id: 'MO-2025-006',
      type: 'freelance',
      crew: createdUsers.find(u => u.email === 'freelancer@aviation.com'), // Lisa Anderson
      aircraft: { id: 'AC002', immat: 'F-GXYZ', type: 'King Air 350' },
      flights: [
        {
          id: '6',
          aircraftId: 'AC002',
          flight: 'CRW006',
          departure: 'LFPG',
          arrival: 'LSGG',
          date: '2025-02-15',
          time: '10:30'
        },
        {
          id: '7',
          aircraftId: 'AC002', 
          flight: 'CRW007',
          departure: 'LSGG',
          arrival: 'LFMD',
          date: '2025-02-16',
          time: '15:45'
        }
      ],
      contract: {
        startDate: '2025-02-15',
        endDate: '2025-02-16',
        salaryAmount: 500,
        salaryCurrency: 'EUR',
        salaryType: 'daily',
        hasPerDiem: true,
        perDiemAmount: 85,
        perDiemCurrency: 'EUR',
        additionalNotes: 'Mission VIP - Service haut de gamme requis. Briefing prévu 30 minutes avant embarquement.'
      },
      status: 'approved',
      createdAt: '2025-01-10T14:20:00Z',
      approvedAt: '2025-01-10T16:45:00Z',
      approver: {
        id: createdUsers.find(u => u.email === 'admin@crewtech.fr')?.id,
        name: 'Sophie Laurent',
        email: 'admin@crewtech.fr',
        date: '2025-01-10T16:45:00Z'
      }
    },
    {
      id: 'MO-2024-008',
      type: 'service',
      crew: createdUsers.find(u => u.email === 'freelancer@aviation.com'), // Lisa Anderson
      aircraft: { id: 'AC002', immat: 'F-GXYZ', type: 'King Air 350' },
      flights: [
        {
          id: '9',
          aircraftId: 'AC002',
          flight: 'SRV002',
          departure: 'LFMD',
          arrival: 'LSGG',
          date: '2024-12-05',
          time: '09:30'
        }
      ],
      contract: {
        startDate: '2024-12-05',
        endDate: '2024-12-06',
        salaryAmount: 600,
        salaryCurrency: 'EUR',
        salaryType: 'daily',
        hasPerDiem: true,
        perDiemAmount: 75,
        perDiemCurrency: 'EUR',
        additionalNotes: 'Mission de service - Formation sécurité et mise à jour certifications'
      },
      serviceInvoice: {
        invoiceNumber: 'INV-SRV-2024-008',
        invoiceDate: '2024-12-06',
        currency: 'EUR',
        lines: [
          {
            id: 'line-1',
            description: 'Transport taxi aéroport - centre formation',
            quantity: 4,
            unitPrice: 35.00,
            category: 'transport',
            total: 140.00
          },
          {
            id: 'line-2',
            description: 'Repas formation jour 1',
            quantity: 1,
            unitPrice: 32.00,
            category: 'meals',
            total: 32.00
          },
          {
            id: 'line-3',
            description: 'Repas formation jour 2',
            quantity: 1,
            unitPrice: 28.00,
            category: 'meals',
            total: 28.00
          },
          {
            id: 'line-4',
            description: 'Hébergement - hôtel 2 nuits',
            quantity: 2,
            unitPrice: 95.00,
            category: 'accommodation',
            total: 190.00
          },
          {
            id: 'line-5',
            description: 'Matériel formation - documents',
            quantity: 1,
            unitPrice: 45.00,
            category: 'equipment',
            total: 45.00
          }
        ],
        subtotal: 435.00,
        taxRate: 20.0,
        taxAmount: 87.00,
        total: 522.00,
        notes: 'Frais engagés pour mission de formation sécurité et mise à jour des certifications sur King Air 350.',
        externalInvoiceFile: {
          name: 'facture-hotel-geneve.pdf',
          type: 'application/pdf',
          size: 248576,
          uploadedAt: '2024-12-06T18:30:00Z'
        }
      },
      status: 'validated',
      createdAt: '2024-12-03T08:00:00Z',
      approvedAt: '2024-12-03T10:15:00Z',
      completedAt: '2024-12-06T17:00:00Z',
      validatedAt: '2024-12-07T09:00:00Z',
      approver: {
        id: createdUsers.find(u => u.email === 'admin@crewtech.fr')?.id,
        name: 'Sophie Laurent',
        email: 'admin@crewtech.fr',
        date: '2024-12-03T10:15:00Z'
      },
      validation: {
        validatedAt: '2024-12-07T09:00:00Z',
        crewComments: 'Formation completed successfully. All certifications updated.',
        ribConfirmed: true,
        issuesReported: [],
        paymentIssue: false
      }
    }
  ];
}

// Helper function to create sample notifications  
export async function createSampleNotifications(createdUsers: any[]): Promise<number> {
  const notifications = [
    {
      userId: createdUsers.find(u => u.email === 'freelancer@aviation.com')?.id,
      notifications: [
        {
          id: 'notif-001',
          type: 'success',
          title: 'Mission Approved',
          message: 'Your mission CRW001 has been approved',
          category: 'mission',
          createdAt: '2024-12-11T14:30:00Z',
          read: false,
          metadata: { missionId: 'MO-20241212001' }
        },
        {
          id: 'notif-002',
          type: 'info',
          title: 'Profile Update',
          message: 'Please review your emergency contact information',
          category: 'document',
          createdAt: '2024-12-10T09:00:00Z',
          read: true
        },
        {
          id: 'notif-007',
          type: 'success',
          title: 'Nouvelle mission approuvée',
          message: 'Votre mission MO-2025-006 (CRW006/007) du 15-16 février 2025 a été approuvée. Mission VIP Paris-Genève-Cannes.',
          category: 'mission',
          createdAt: '2025-01-10T16:45:00Z',
          read: false,
          metadata: { 
            missionId: 'MO-2025-006',
            flightInfo: 'LFPG → LSGG → LFMD',
            missionType: 'VIP'
          }
        }
      ]
    },
    {
      userId: createdUsers.find(u => u.email === 'internal@crewtech.fr')?.id,
      notifications: [
        {
          id: 'notif-003',
          type: 'mission',
          title: 'New Mission Request',
          message: 'You have been assigned to mission MO-20241212002',
          category: 'mission',
          createdAt: '2024-12-11T08:00:00Z',
          read: false,
          metadata: { missionId: 'MO-20241212002' }
        }
      ]
    },
    {
      userId: createdUsers.find(u => u.email === 'captain@freelance.eu')?.id,
      notifications: [
        {
          id: 'notif-004',
          type: 'error',
          title: 'Mission Rejected',
          message: 'Mission MO-20241212003 has been rejected: Captain not available for the requested dates',
          category: 'mission',
          createdAt: '2024-12-10T11:15:00Z',
          read: false,
          metadata: { missionId: 'MO-20241212003' }
        }
      ]
    },
    {
      userId: createdUsers.find(u => u.email === 'admin@crewtech.fr')?.id,
      notifications: [
        {
          id: 'notif-005',
          type: 'warning',
          title: 'Demande de modification de dates',
          message: 'Sarah Mitchell demande une modification des dates pour la mission MO-2024-005. Dates originales: 2024-12-25 - 2024-12-26, nouvelles dates demandées: 2024-12-24 - 2024-12-27. Motif: Mission s\'est étendue sur 3 jours supplémentaires à cause des conditions météorologiques.',
          category: 'date_modification',
          createdAt: '2024-12-27T09:30:00Z',
          read: false,
          metadata: {
            missionId: 'MO-2024-005',
            crewId: createdUsers.find(u => u.email === 'sarah@crewaviation.com')?.id,
            originalDates: {
              startDate: '2024-12-25',
              endDate: '2024-12-26'
            },
            newDates: {
              startDate: '2024-12-24', 
              endDate: '2024-12-27'
            },
            reason: 'Mission s\'est étendue sur 3 jours supplémentaires à cause des conditions météorologiques. Avons été bloqués à EGKK pendant 2 jours.',
            action: 'date_modification_request'
          }
        },
        {
          id: 'notif-008',
          type: 'info',
          title: 'Mission future créée',
          message: 'Mission MO-2025-006 créée et approuvée pour Lisa Anderson. Vols CRW006/007 prévus les 15-16 février 2025 (LFPG-LSGG-LFMD).',
          category: 'mission',
          createdAt: '2025-01-10T16:45:00Z',
          read: false,
          metadata: { 
            missionId: 'MO-2025-006',
            crewId: createdUsers.find(u => u.email === 'freelancer@aviation.com')?.id,
            missionType: 'VIP',
            status: 'future_mission'
          }
        }
      ]
    },
    {
      userId: createdUsers.find(u => u.email === 'sarah@crewaviation.com')?.id,
      notifications: [
        {
          id: 'notif-006',
          type: 'info',
          title: 'Demande de modification envoyée',
          message: 'Votre demande de modification des dates pour la mission MO-2024-005 a été envoyée à l\'administration pour approbation.',
          category: 'mission',
          createdAt: '2024-12-27T09:30:00Z',
          read: false,
          metadata: { missionId: 'MO-2024-005' }
        }
      ]
    }
  ];

  let totalNotifications = 0;
  for (const userNotifs of notifications) {
    if (userNotifs.userId) {
      for (const notif of userNotifs.notifications) {
        await kv.set(`notification:${userNotifs.userId}:${notif.id}`, notif);
        totalNotifications++;
      }
      console.log(`Created ${userNotifs.notifications.length} notifications for user: ${userNotifs.userId}`);
    }
  }
  
  return totalNotifications;
}

// Helper function to handle existing user updates
export async function handleExistingUser(supabase: any, user: any, existingUser: any) {
  console.log(`Found existing user: ${existingUser.id}`);
  
  // Test if we can authenticate with this user  
  const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password
  });
  
  if (testError) {
    console.log(`User exists but password doesn't match, attempting to update password`);
    
    // Try to update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: user.password }
    );
    
    if (updateError) {
      console.error(`Failed to update password for ${user.email}:`, updateError);
    } else {
      console.log(`Updated password for ${user.email}`);
    }
  } else {
    console.log(`User ${user.email} authentication test successful`);
    // Sign out the test session
    await supabase.auth.signOut();
  }
  
  // Store additional user data in KV store for existing user
  const userData = {
    id: existingUser.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type: user.type,
    ...user.data,
    created_at: existingUser.created_at,
    updated_at: new Date().toISOString(),
    profile_complete: true,
    last_active: new Date()
  };
  
  await kv.set(`user:${existingUser.id}`, userData);
  console.log(`Updated existing user data: ${user.name}`);
  
  return userData;
}