import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useCrewData } from './CrewDataService';
import { Search, User, MapPin, Phone, Mail, CheckCircle, AlertTriangle, X, AlertCircle } from 'lucide-react';

interface CrewSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrewSelected: (crew: any) => void;
  aircraftRegistration?: string;
  requiredPosition?: string;
  missionDates?: {
    startDate: string;
    endDate: string;
  };
}

export default function CrewSelectionModal({
  isOpen,
  onClose,
  onCrewSelected,
  aircraftRegistration,
  requiredPosition,
  missionDates
}: CrewSelectionModalProps) {
  const { allCrew, loading, apiConnected, refreshCrewData } = useCrewData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [filteredCrew, setFilteredCrew] = useState([]);

  // Reset filters when modal opens and optionally set required position
  useEffect(() => {
    if (isOpen) {
      console.log('[CrewSelectionModal] Modal opened, crew data available:', allCrew.length);
      if (allCrew.length > 0 && requiredPosition && selectedPosition === 'all') {
        console.log('[CrewSelectionModal] Setting required position:', requiredPosition);
        setSelectedPosition(requiredPosition);
      }
    } else {
      setSearchTerm('');
      setSelectedPosition('all');
      setSelectedType('all');
    }
  }, [isOpen, allCrew.length, requiredPosition, selectedPosition]);

  // Filter crew based on criteria
  useEffect(() => {
    let filtered = [...allCrew];
    console.log('[CrewSelectionModal] Starting with crew count:', filtered.length);

    // Text search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const beforeFilter = filtered.length;
      filtered = filtered.filter(crew => 
        crew.name.toLowerCase().includes(search) ||
        crew.position.toLowerCase().includes(search) ||
        crew.email.toLowerCase().includes(search) ||
        crew.ggid.toLowerCase().includes(search)
      );
      console.log(`[CrewSelectionModal] After search filter (${search}):`, beforeFilter, '->', filtered.length);
    }

    // Position filter
    if (selectedPosition && selectedPosition !== 'all') {
      const beforeFilter = filtered.length;
      const positionFiltered = filtered.filter(crew => {
        const crewPosition = crew.position || '';
        const selectedPos = selectedPosition || '';
        return crewPosition === selectedPos || crewPosition.toLowerCase().includes(selectedPos.toLowerCase());
      });
      console.log(`[CrewSelectionModal] Position filter (${selectedPosition}):`, beforeFilter, '->', positionFiltered.length);
      filtered = positionFiltered;
    }

    // Type filter
    if (selectedType && selectedType !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(crew => crew.type === selectedType);
      console.log(`[CrewSelectionModal] After type filter (${selectedType}):`, beforeFilter, '->', filtered.length);
    }

    // Aircraft qualification filter
    if (aircraftRegistration && aircraftRegistration.trim()) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(crew => {
        const qualifications = crew.qualifications || [];
        const hasQualification = qualifications.includes(aircraftRegistration);
        return hasQualification;
      });
      console.log(`[CrewSelectionModal] After aircraft qualification filter (${aircraftRegistration}):`, beforeFilter, '->', filtered.length);
    }

    // Availability filter
    const beforeAvailabilityFilter = filtered.length;
    filtered = filtered.filter(crew => crew.availability === 'available');
    console.log(`[CrewSelectionModal] After availability filter:`, beforeAvailabilityFilter, '->', filtered.length);

    // Sort by priority: internal staff first, then by name
    filtered.sort((a, b) => {
      if (a.type === 'internal' && b.type !== 'internal') return -1;
      if (b.type === 'internal' && a.type !== 'internal') return 1;
      return a.name.localeCompare(b.name);
    });

    setFilteredCrew(filtered);
  }, [allCrew, searchTerm, selectedPosition, selectedType, aircraftRegistration]);

  const handleCrewSelect = (crew: any) => {
    console.log('[CrewSelectionModal] Crew selected:', crew);
    onCrewSelected(crew);
    onClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPosition('all');
    setSelectedType('all');
  };

  const getStatusIcon = (crew: any) => {
    if (crew.missing_docs && crew.missing_docs.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getQualificationsBadges = (qualifications: string[], required?: string) => {
    if (!qualifications || qualifications.length === 0) return '-';
    
    return (
      <div className="flex flex-wrap gap-1">
        {qualifications.slice(0, 3).map((qual, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className={`text-xs ${
              qual === required 
                ? 'bg-green-100 text-green-800 border-green-400 font-medium' 
                : 'bg-gray-50 text-gray-700 border-gray-300'
            }`}
          >
            {qual}
          </Badge>
        ))}
        {qualifications.length > 3 && (
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">
            +{qualifications.length - 3}
          </Badge>
        )}
      </div>
    );
  };

  // Only show loading if we truly have no data and are still loading
  if (loading && allCrew.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Crew Member</DialogTitle>
            <DialogDescription>
              Loading crew members...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading crew data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Select Crew Member</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Choose a qualified crew member for this mission. {!apiConnected && '(Using offline data)'}
          </DialogDescription>
        </DialogHeader>

        {/* Mission context info */}
        {(aircraftRegistration || requiredPosition || missionDates) && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Mission Requirements</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {aircraftRegistration && (
                <div>
                  <span className="text-blue-600 font-medium">Aircraft:</span>
                  <span className="ml-2 text-blue-800">{aircraftRegistration}</span>
                </div>
              )}
              {requiredPosition && (
                <div>
                  <span className="text-blue-600 font-medium">Position:</span>
                  <span className="ml-2 text-blue-800">{requiredPosition}</span>
                </div>
              )}
              {missionDates && missionDates.startDate && missionDates.endDate && (
                <div>
                  <span className="text-blue-600 font-medium">Dates:</span>
                  <span className="ml-2 text-blue-800">
                    {new Date(missionDates.startDate).toLocaleDateString()} - {new Date(missionDates.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, position, email, or GGID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear Filters
            </Button>
          </div>

          <div className="flex space-x-4">
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="Captain">Captain</SelectItem>
                <SelectItem value="First Officer">First Officer</SelectItem>
                <SelectItem value="Flight Attendant">Flight Attendant</SelectItem>
                <SelectItem value="Senior Flight Attendant">Senior Flight Attendant</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internal">Internal Staff</SelectItem>
                <SelectItem value="freelancer">Freelancers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results summary */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {filteredCrew.length} crew member{filteredCrew.length !== 1 ? 's' : ''} found
              {aircraftRegistration && (
                <span className="ml-2 text-blue-600">
                  (qualified for {aircraftRegistration})
                </span>
              )}
            </span>
          </div>
        </div>

        <Separator />

        {/* No data warning */}
        {allCrew.length === 0 && !loading && (
          <div className="text-center py-12 text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Crew Data Available</h3>
            <p className="text-sm">
              Unable to load crew members. Please check your connection or contact support.
            </p>
          </div>
        )}

        {/* Crew table */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {allCrew.length > 0 && filteredCrew.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 bg-white border-b z-10">
                <TableRow>
                  <TableHead className="w-12">Avatar</TableHead>
                  <TableHead className="min-w-36">Name</TableHead>
                  <TableHead className="min-w-32">Position</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="min-w-24">GGID</TableHead>
                  <TableHead className="min-w-48">Email</TableHead>
                  <TableHead className="min-w-32">Phone</TableHead>
                  <TableHead className="min-w-40">Qualifications</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCrew.map((crew) => (
                  <TableRow 
                    key={crew.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleCrewSelect(crew)}
                  >
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-xs">
                          {crew.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    
                    <TableCell className="font-medium">
                      <div className="truncate" title={crew.name}>
                        {crew.name}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="truncate" title={crew.position}>
                        {crew.position}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={crew.type === 'internal' 
                          ? 'bg-blue-100 text-blue-800 border-blue-300' 
                          : 'bg-purple-100 text-purple-800 border-purple-300'
                        }
                      >
                        {crew.type === 'internal' ? 'INT' : 'FREEL'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-sm text-gray-600">
                      {crew.ggid}
                    </TableCell>
                    
                    <TableCell className="text-sm">
                      <div className="truncate max-w-48" title={crew.email || ''}>
                        {crew.email || '-'}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-sm">
                      {crew.phone || '-'}
                    </TableCell>
                    
                    <TableCell>
                      {getQualificationsBadges(crew.qualifications, aircraftRegistration)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(crew)}
                        {crew.missing_docs && crew.missing_docs.length > 0 && (
                          <span className="text-xs text-amber-600">
                            {crew.missing_docs.length}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCrewSelect(crew);
                        }}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : allCrew.length > 0 && filteredCrew.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="font-medium mb-2">No crew members match filters</h3>
              <p className="text-sm mb-4">
                {aircraftRegistration 
                  ? `No crew members are qualified for aircraft ${aircraftRegistration} with the current filters.`
                  : 'No crew members match the current search and filter criteria.'
                }
              </p>
              <div className="space-y-2">
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
                <div className="text-xs text-gray-400">
                  Total crew available: {allCrew.length}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}