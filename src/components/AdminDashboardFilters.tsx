import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CalendarDays, X } from 'lucide-react';
import { mockAircraft } from './AdminDashboardData';
import { formatDateRange } from './AdminDashboardHelpers';
import { 
  SENTINELS, 
  createSafeSelectValue, 
  createSafeSelectHandler
} from './ui/select-utils';

interface AdminDashboardFiltersProps {
  searchTerm: string;
  selectedAircraft: string;
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onAircraftChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearDateRange: () => void;
  onClearAllFilters: () => void;
}

export default function AdminDashboardFilters({
  searchTerm,
  selectedAircraft,
  startDate,
  endDate,
  onSearchChange,
  onAircraftChange,
  onStartDateChange,
  onEndDateChange,
  onClearDateRange,
  onClearAllFilters
}: AdminDashboardFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search flights, airports, immat, AC ID..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="aircraft">Aircraft</Label>
              <Select 
                value={createSafeSelectValue(selectedAircraft === "all" ? "" : selectedAircraft, SENTINELS.ALL)} 
                onValueChange={createSafeSelectHandler((value) => onAircraftChange(value === "" ? "all" : value), SENTINELS.ALL)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Aircraft" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SENTINELS.ALL}>All Aircraft</SelectItem>
                  {mockAircraft
                    .filter(aircraft => aircraft && aircraft.immat && String(aircraft.immat).trim() !== "")
                    .map(aircraft => (
                      <SelectItem key={`aircraft-${aircraft.id}`} value={String(aircraft.immat).trim()}>
                        {aircraft.immat} ({aircraft.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  const value = e.target.value;
                  onStartDateChange(value);
                  // If end date is before start date, clear end date
                  if (value && endDate && new Date(value) > new Date(endDate)) {
                    onEndDateChange('');
                  }
                }}
              />
            </div>
            <div className="w-40">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only set if it's after start date or if no start date
                  if (!startDate || !value || new Date(value) >= new Date(startDate)) {
                    onEndDateChange(value);
                  }
                }}
              />
            </div>
            {(startDate || endDate || selectedAircraft !== 'all' || searchTerm) ? (
              <div className="flex space-x-2">
                {(startDate || endDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearDateRange}
                    className="h-10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Dates
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAllFilters}
                  className="h-10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            ) : null}
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-gray-500" />
              <span className={`text-sm ${
                (startDate && endDate && new Date(startDate) > new Date(endDate)) ||
                formatDateRange(startDate, endDate).includes('Invalid') || 
                formatDateRange(startDate, endDate).includes('error')
                  ? 'text-red-600' 
                  : 'text-gray-600'
              }`}>
                {formatDateRange(startDate, endDate)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}