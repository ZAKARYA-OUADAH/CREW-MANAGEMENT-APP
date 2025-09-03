import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CalendarDays, Plane, Users, Clock, Hash } from 'lucide-react';
import { getAircraftById, getStatusColor } from './AdminDashboardData';

interface AdminDashboardFlightListProps {
  filteredFlights: any[];
  selectedFlights: string[];
  startDate: string;
  endDate: string;
  onFlightSelect: (flightId: string) => void;
}

export default function AdminDashboardFlightList({
  filteredFlights,
  selectedFlights,
  startDate,
  endDate,
  onFlightSelect
}: AdminDashboardFlightListProps) {
  // Safety check for filteredFlights
  const safeFilteredFlights = filteredFlights || [];

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Scheduled Flights</CardTitle>
        <p className="text-sm text-gray-600">
          {safeFilteredFlights.length} flights {(startDate || endDate) && `in selected date range`}
          {(startDate || endDate) && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Filter: {startDate || 'all'} to {endDate || 'all'}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0 max-h-96 overflow-y-auto">
          {safeFilteredFlights.map((flight) => {
            const aircraft = getAircraftById(flight.aircraftId);
            const assignedCrew = flight.assignedCrew || [];
            const safeSelectedFlights = selectedFlights || [];
            
            return (
              <div
                key={flight.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  safeSelectedFlights.includes(flight.id) ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => onFlightSelect(flight.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={safeSelectedFlights.includes(flight.id)}
                      onChange={() => onFlightSelect(flight.id)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <Plane className="h-4 w-4 text-gray-500" />
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{aircraft?.immat || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">({aircraft?.type || 'Unknown'})</span>
                          <div className="flex items-center space-x-1">
                            <Hash className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{aircraft?.id || 'Unknown'}</span>
                          </div>
                        </div>
                        <Badge variant="outline">{flight.flight || 'Unknown'}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm">{flight.departure || 'Unknown'} → {flight.arrival || 'Unknown'}</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{flight.time || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CalendarDays className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {flight.date ? new Date(flight.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            }) : 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{assignedCrew.length}</span>
                    </div>
                    <Badge className={getStatusColor(flight.status || 'unknown')}>
                      {flight.status || 'unknown'}
                    </Badge>
                  </div>
                </div>
                {assignedCrew.length > 0 && (
                  <div className="ml-8 mt-2">
                    <div className="flex flex-wrap gap-1">
                      {assignedCrew.map((member, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {typeof member === 'string' ? member : member.name || 'Unknown'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {safeFilteredFlights.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No flights found</p>
              <p className="text-sm">
                {(startDate || endDate) 
                  ? 'Try adjusting your date range or other filters' 
                  : 'Try adjusting your search criteria'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}