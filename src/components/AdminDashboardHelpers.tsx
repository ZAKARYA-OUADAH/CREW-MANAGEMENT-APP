// Helper functions for AdminDashboard component

export const isDateInRange = (flightDate: string, startDate: string, endDate: string) => {
  // If no filters are set, include all flights
  if (!startDate && !endDate) return true;
  
  // Use simple string comparison for ISO dates (YYYY-MM-DD format)
  // This avoids timezone issues entirely
  try {
    if (startDate && endDate) {
      return flightDate >= startDate && flightDate <= endDate;
    } else if (startDate) {
      return flightDate >= startDate;
    } else if (endDate) {
      return flightDate <= endDate;
    }
    
    return true;
  } catch (error) {
    console.warn('Date comparison error:', error);
    return true;
  }
};

export const formatDateRange = (startDate: string, endDate: string) => {
  try {
    if (!startDate && !endDate) return 'All dates';
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid date range';
      }
      
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
    
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return 'Invalid start date';
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `From ${startStr}`;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) return 'Invalid end date';
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `Until ${endStr}`;
    }
    
    return 'All dates';
  } catch (error) {
    console.warn('Error formatting date range:', error);
    return 'Date range error';
  }
};

export const filterFlights = (
  flights: any[], 
  aircraft: any[], 
  selectedAircraft: string, 
  searchTerm: string, 
  startDate: string, 
  endDate: string
) => {
  return flights.filter(flight => {
    try {
      const aircraftData = aircraft.find(ac => ac.id === flight.aircraftId);
      
      // Aircraft filter
      const matchesAircraft = selectedAircraft === 'all' || aircraftData?.immat === selectedAircraft;
      
      // Search filter - make sure all properties exist before searching
      const matchesSearch = !searchTerm || [
        flight.flight,
        flight.departure,
        flight.arrival,
        aircraftData?.immat,
        aircraftData?.type,
        aircraftData?.id
      ].some(field => 
        field && field.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Date range filter
      const matchesDateRange = isDateInRange(flight.date, startDate, endDate);
      
      // Debug logging for flight on 2024-08-20 (can be removed in production)
      if ((startDate || endDate) && flight.date === '2024-08-20') {
        console.log('DEBUG Flight 2024-08-20:', {
          flightDate: flight.date,
          startDate,
          endDate,
          matchesDateRange,
          matchesAircraft,
          matchesSearch,
          finalResult: matchesAircraft && matchesSearch && matchesDateRange
        });
      }
      
      return matchesAircraft && matchesSearch && matchesDateRange;
    } catch (error) {
      console.warn('Error filtering flight:', flight.id, error);
      return false;
    }
  });
};