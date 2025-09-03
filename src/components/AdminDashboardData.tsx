// Mock data for admin dashboard - includes flights, aircraft, and crew information
export interface Flight {
  id: string;
  flight: string;
  departure: string;
  arrival: string;
  date: string;
  time: string;
  duration: string;
  aircraftId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  requiredCrew: {
    captains: number;
    firstOfficers: number;
    flightAttendants: number;
  };
  assignedCrew: Array<{
    id: string;
    name: string;
    position: string;
    type: 'internal' | 'freelancer';
  }>;
}

export interface Aircraft {
  id: string;
  immat: string;
  type: string;
  homeBase: string;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  lastMaintenance: string;
  nextMaintenance: string;
  flightHours: number;
  maxPassengers: number;
  range: number;
}

// Aircraft types for filtering
export const aircraftTypes = [
  'Citation CJ3',
  'King Air 350',
  'Phenom 300',
  'Falcon 7X',
  'Hawker 900XP'
];

// Status color helper function
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'delayed': return 'bg-orange-100 text-orange-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'available': return 'bg-green-100 text-green-800';
    case 'in_use': return 'bg-blue-100 text-blue-800';
    case 'maintenance': return 'bg-yellow-100 text-yellow-800';
    case 'offline': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Aircraft data including test aircraft for Lisa Anderson
const aircraftData: Aircraft[] = [
  {
    id: 'AC001',
    immat: 'F-HBCD',
    type: 'Citation CJ3',
    homeBase: 'LFPB',
    status: 'available',
    lastMaintenance: '2024-07-15',
    nextMaintenance: '2024-10-15',
    flightHours: 2450,
    maxPassengers: 8,
    range: 3500
  },
  {
    id: 'AC002',
    immat: 'F-GXYZ',
    type: 'King Air 350',
    homeBase: 'LFMD',
    status: 'available',
    lastMaintenance: '2024-06-20',
    nextMaintenance: '2024-09-20',
    flightHours: 3200,
    maxPassengers: 11,
    range: 2800
  },
  {
    id: 'AC003',
    immat: 'F-HABC',
    type: 'Phenom 300',
    homeBase: 'LFPB',
    status: 'in_use',
    lastMaintenance: '2024-08-01',
    nextMaintenance: '2024-11-01',
    flightHours: 1850,
    maxPassengers: 9,
    range: 3900
  },
  {
    id: 'AC004',
    immat: 'F-HTST',
    type: 'Falcon 7X',
    homeBase: 'LFPB',
    status: 'available',
    lastMaintenance: '2024-07-30',
    nextMaintenance: '2024-10-30',
    flightHours: 1200,
    maxPassengers: 14,
    range: 5950
  },
  {
    id: 'AC005',
    immat: 'F-GDEF',
    type: 'Hawker 900XP',
    homeBase: 'LFMD',
    status: 'maintenance',
    lastMaintenance: '2024-08-10',
    nextMaintenance: '2024-11-10',
    flightHours: 4100,
    maxPassengers: 9,
    range: 4600
  }
];

// Flight data
const flightData: Flight[] = [
  {
    id: '1',
    flight: 'CRW001',
    departure: 'LFPB',
    arrival: 'EGGW',
    date: '2024-08-15',
    time: '09:00',
    duration: '1h 30m',
    aircraftId: 'AC002',
    status: 'completed',
    requiredCrew: {
      captains: 1,
      firstOfficers: 1,
      flightAttendants: 1
    },
    assignedCrew: [
      {
        id: '3',
        name: 'Mike Wilson',
        position: 'Captain',
        type: 'freelancer'
      }
    ]
  },
  {
    id: '2',
    flight: 'CRW002',
    departure: 'EGGW',
    arrival: 'LFMD',
    date: '2024-08-16',
    time: '14:30',
    duration: '1h 45m',
    aircraftId: 'AC002',
    status: 'completed',
    requiredCrew: {
      captains: 1,
      firstOfficers: 1,
      flightAttendants: 1
    },
    assignedCrew: [
      {
        id: '3',
        name: 'Mike Wilson',
        position: 'Captain',
        type: 'freelancer'
      }
    ]
  },
  {
    id: '3',
    flight: 'CRW003',
    departure: 'LFMD',
    arrival: 'LFPB',
    date: '2024-08-20',
    time: '16:00',
    duration: '1h 15m',
    aircraftId: 'AC001',
    status: 'completed',
    requiredCrew: {
      captains: 1,
      firstOfficers: 0,
      flightAttendants: 1
    },
    assignedCrew: [
      {
        id: '3',
        name: 'Mike Wilson',
        position: 'Captain',
        type: 'freelancer'
      }
    ]
  },
  {
    id: '4',
    flight: 'CRW004',
    departure: 'LFPB',
    arrival: 'EGLL',
    date: '2024-08-18',
    time: '12:00',
    duration: '1h 20m',
    aircraftId: 'AC003',
    status: 'scheduled',
    requiredCrew: {
      captains: 1,
      firstOfficers: 0,
      flightAttendants: 1
    },
    assignedCrew: [
      {
        id: '5',
        name: 'Paul Martin',
        position: 'Flight Attendant',
        type: 'freelancer'
      }
    ]
  },
  {
    id: '5',
    flight: 'CRW005',
    departure: 'LFPO',
    arrival: 'LFMN',
    date: '2024-08-22',
    time: '10:30',
    duration: '1h 25m',
    aircraftId: 'AC001',
    status: 'completed',
    requiredCrew: {
      captains: 1,
      firstOfficers: 1,
      flightAttendants: 0
    },
    assignedCrew: [
      {
        id: '2',
        name: 'Sarah Johnson',
        position: 'First Officer',
        type: 'internal'
      }
    ]
  },
  // Test flights for Lisa Anderson
  {
    id: 'test-flight-1',
    flight: 'TST001',
    departure: 'LFPB',
    arrival: 'EGKK',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    time: '08:00',
    duration: '1h 10m',
    aircraftId: 'AC004',
    status: 'completed',
    requiredCrew: {
      captains: 1,
      firstOfficers: 1,
      flightAttendants: 1
    },
    assignedCrew: [
      {
        id: '4',
        name: 'Lisa Anderson',
        position: 'Flight Attendant',
        type: 'freelancer'
      }
    ]
  },
  {
    id: 'test-flight-2',
    flight: 'TST002',
    departure: 'EGKK',
    arrival: 'LFPB',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
    time: '16:30',
    duration: '1h 10m',
    aircraftId: 'AC004',
    status: 'completed',
    requiredCrew: {
      captains: 1,
      firstOfficers: 1,
      flightAttendants: 1
    },
    assignedCrew: [
      {
        id: '4',
        name: 'Lisa Anderson',
        position: 'Flight Attendant',
        type: 'freelancer'
      }
    ]
  },
  // Upcoming flights
  {
    id: '6',
    flight: 'CRW006',
    departure: 'LFPB',
    arrival: 'LSZH',
    date: '2024-08-25',
    time: '11:00',
    duration: '1h 30m',
    aircraftId: 'AC001',
    status: 'scheduled',
    requiredCrew: {
      captains: 1,
      firstOfficers: 1,
      flightAttendants: 1
    },
    assignedCrew: []
  },
  {
    id: '7',
    flight: 'CRW007',
    departure: 'LSZH',
    arrival: 'LFPB',
    date: '2024-08-25',
    time: '16:30',
    duration: '1h 30m',
    aircraftId: 'AC001',
    status: 'scheduled',
    requiredCrew: {
      captains: 1,
      firstOfficers: 1,
      flightAttendants: 1
    },
    assignedCrew: []
  },
  {
    id: '8',
    flight: 'CRW008',
    departure: 'LFMD',
    arrival: 'LIRF',
    date: '2024-08-26',
    time: '09:15',
    duration: '2h 10m',
    aircraftId: 'AC002',
    status: 'scheduled',
    requiredCrew: {
      captains: 1,
      firstOfficers: 1,
      flightAttendants: 1
    },
    assignedCrew: []
  }
];

// Helper functions
export const getFlights = (filters?: any) => {
  let filteredFlights = [...flightData];
  
  if (filters?.status && filters.status !== 'all') {
    filteredFlights = filteredFlights.filter(flight => flight.status === filters.status);
  }
  
  if (filters?.aircraft && filters.aircraft !== 'all') {
    filteredFlights = filteredFlights.filter(flight => flight.aircraftId === filters.aircraft);
  }
  
  if (filters?.date) {
    filteredFlights = filteredFlights.filter(flight => flight.date === filters.date);
  }
  
  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredFlights = filteredFlights.filter(flight => 
      flight.flight.toLowerCase().includes(searchTerm) ||
      flight.departure.toLowerCase().includes(searchTerm) ||
      flight.arrival.toLowerCase().includes(searchTerm) ||
      flight.assignedCrew.some(crew => 
        crew.name.toLowerCase().includes(searchTerm)
      )
    );
  }
  
  return filteredFlights;
};

export const getAircraft = () => aircraftData;

export const getAircraftById = (id: string) => {
  return aircraftData.find(aircraft => aircraft.id === id);
};

export const getFlightById = (id: string) => {
  return flightData.find(flight => flight.id === id);
};

export const getFlightsByAircraft = (aircraftId: string) => {
  return flightData.filter(flight => flight.aircraftId === aircraftId);
};

export const getFlightsByDateRange = (startDate: string, endDate: string) => {
  return flightData.filter(flight => {
    const flightDate = new Date(flight.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return flightDate >= start && flightDate <= end;
  });
};

export const getAvailableAircraftForDate = (date: string) => {
  const flightsOnDate = flightData.filter(flight => flight.date === date);
  const busyAircraftIds = flightsOnDate.map(flight => flight.aircraftId);
  
  return aircraftData.filter(aircraft => 
    !busyAircraftIds.includes(aircraft.id) && 
    aircraft.status === 'available'
  );
};

// Statistics helpers
export const getTotalFlights = () => flightData.length;

export const getCompletedFlights = () => {
  return flightData.filter(flight => flight.status === 'completed').length;
};

export const getScheduledFlights = () => {
  return flightData.filter(flight => flight.status === 'scheduled').length;
};

export const getDelayedFlights = () => {
  return flightData.filter(flight => flight.status === 'delayed').length;
};

export const getAircraftUtilization = () => {
  const totalAircraft = aircraftData.length;
  const inUseAircraft = aircraftData.filter(aircraft => aircraft.status === 'in_use').length;
  const maintenanceAircraft = aircraftData.filter(aircraft => aircraft.status === 'maintenance').length;
  
  return {
    total: totalAircraft,
    inUse: inUseAircraft,
    available: totalAircraft - inUseAircraft - maintenanceAircraft,
    maintenance: maintenanceAircraft,
    utilizationRate: totalAircraft > 0 ? (inUseAircraft / totalAircraft) * 100 : 0
  };
};

export const getCrewWorkload = () => {
  const assignedCrewIds = new Set<string>();
  
  flightData.forEach(flight => {
    if (flight.status === 'scheduled' || flight.status === 'in_progress') {
      flight.assignedCrew.forEach(crew => {
        assignedCrewIds.add(crew.id);
      });
    }
  });
  
  return {
    activeCrew: assignedCrewIds.size,
    totalAssignments: flightData.reduce((sum, flight) => {
      if (flight.status === 'scheduled' || flight.status === 'in_progress') {
        return sum + flight.assignedCrew.length;
      }
      return sum;
    }, 0)
  };
};

// Mock data exports with legacy names for compatibility
export const mockFlights = flightData;
export const mockAircraft = aircraftData;
export { flightData, aircraftData };