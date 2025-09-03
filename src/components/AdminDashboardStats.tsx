import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatDateRange } from './AdminDashboardHelpers';
import { getAircraftById, aircraftTypes } from './AdminDashboardData';

interface AdminDashboardStatsProps {
  startDate: string;
  endDate: string;
  filteredFlights: any[];
  selectedFlights: string[];
}

export default function AdminDashboardStats({
  startDate,
  endDate,
  filteredFlights,
  selectedFlights
}: AdminDashboardStatsProps) {
  // Safety checks for props
  const safeFilteredFlights = filteredFlights || [];
  const safeSelectedFlights = selectedFlights || [];
  const safeAircraftTypes = aircraftTypes || [];

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Flight Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700">Date Range</span>
            </div>
            <p className="text-sm text-blue-800">
              {formatDateRange(startDate, endDate)}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Total Flights</span>
              <Badge variant="secondary">{safeFilteredFlights.length}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Scheduled</span>
              <Badge className="bg-blue-100 text-blue-800">
                {safeFilteredFlights.filter(f => f?.status === 'scheduled').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Completed</span>
              <Badge className="bg-green-100 text-green-800">
                {safeFilteredFlights.filter(f => f?.status === 'completed').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>In Progress</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                {safeFilteredFlights.filter(f => f?.status === 'in_progress').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Selected</span>
              <Badge className="bg-blue-100 text-blue-800">
                {safeSelectedFlights.length}
              </Badge>
            </div>
          </div>

          {safeFilteredFlights.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm text-gray-700 mb-2">Aircraft Distribution</h4>
              <div className="space-y-1">
                {safeAircraftTypes.map(type => {
                  const count = safeFilteredFlights.filter(f => {
                    try {
                      const aircraft = getAircraftById(f?.aircraftId);
                      return aircraft?.type === type;
                    } catch (error) {
                      console.warn('Error getting aircraft for flight:', f?.id, error);
                      return false;
                    }
                  }).length;
                  
                  if (count === 0) return null;
                  
                  return (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{type}</span>
                      <span className="text-gray-800">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}