import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User, Search, Filter, AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { ProcessedCrewMember } from './useCrewManagement';
import { 
  SENTINELS, 
  POSITION_OPTIONS,
  createSafeSelectValue, 
  createSafeSelectHandler
} from './ui/select-utils';

interface EnhancedCrewListProps {
  crewMembers: ProcessedCrewMember[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  positionFilter: string;
  onPositionFilterChange: (position: string) => void;
  onRefresh: () => void;
  onRequestMission: (crewId: string, requestType: 'extra_day' | 'freelance' | 'service') => void;
  onNotifyToComplete: (crewId: string) => void;
  aircraft?: { registration: string; type: string } | null;
}

const StatusBadge: React.FC<{ status: ProcessedCrewMember['statusBadge'] }> = ({ status }) => {
  const colorMap = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const iconMap = {
    green: <CheckCircle className="h-3 w-3" />,
    yellow: <AlertTriangle className="h-3 w-3" />,
    red: <AlertCircle className="h-3 w-3" />,
    gray: <AlertCircle className="h-3 w-3" />
  };

  return (
    <Badge variant="outline" className={`text-xs ${colorMap[status.color]}`}>
      <div className="flex items-center space-x-1">
        {iconMap[status.color]}
        <span>{status.text}</span>
      </div>
    </Badge>
  );
};

const QualificationsBadges: React.FC<{ 
  member: ProcessedCrewMember; 
  aircraft?: { registration: string; type: string } | null;
}> = ({ member, aircraft }) => {
  const { qualificationDetails } = member;

  if (qualificationDetails.validQualifications.length === 0) {
    return <span className="text-gray-500 text-sm">No qualifications</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {/* Type Ratings */}
      {qualificationDetails.validQualifications
        .filter(q => q.type === 'TYPE_RATING')
        .slice(0, 2)
        .map((qual, index) => {
          const isRequiredForAircraft = aircraft && qual.aircraft_type && (
            qual.aircraft_type.toLowerCase().includes(aircraft.type.toLowerCase()) ||
            qual.aircraft_type.toLowerCase().includes(aircraft.registration.toLowerCase())
          );
          
          return (
            <Badge 
              key={`type-${index}`} 
              variant="outline" 
              className={`text-xs ${
                isRequiredForAircraft 
                  ? 'bg-green-100 text-green-800 border-green-400 font-medium' 
                  : 'bg-blue-50 text-blue-700 border-blue-300'
              }`}
            >
              {qual.aircraft_type || qual.code || 'Type Rating'}
            </Badge>
          );
        })}

      {/* Training Certifications */}
      {qualificationDetails.validQualifications
        .filter(q => q.type === 'TRAINING')
        .slice(0, 1)
        .map((qual, index) => (
          <Badge 
            key={`training-${index}`} 
            variant="outline" 
            className="text-xs bg-purple-50 text-purple-700 border-purple-300"
          >
            {qual.code || qual.name || 'Training'}
          </Badge>
        ))}

      {/* Licenses */}
      {qualificationDetails.validQualifications
        .filter(q => q.type === 'LICENSE')
        .slice(0, 1)
        .map((qual, index) => (
          <Badge 
            key={`license-${index}`} 
            variant="outline" 
            className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300"
          >
            {qual.level || qual.code || 'License'}
          </Badge>
        ))}

      {/* Show count if more qualifications */}
      {qualificationDetails.validQualifications.length > 4 && (
        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">
          +{qualificationDetails.validQualifications.length - 4}
        </Badge>
      )}
    </div>
  );
};

export default function EnhancedCrewList({
  crewMembers,
  loading,
  error,
  searchQuery,
  onSearchChange,
  positionFilter,
  onPositionFilterChange,
  onRefresh,
  onRequestMission,
  onNotifyToComplete,
  aircraft
}: EnhancedCrewListProps) {

  const getCrewListDescription = () => {
    const totalCount = crewMembers.length;
    const qualifiedCount = crewMembers.filter(m => m.qualified).length;
    
    if (aircraft && positionFilter) {
      return `${qualifiedCount}/${totalCount} crew members qualified for ${positionFilter} on ${aircraft.registration}`;
    }
    if (aircraft) {
      return `${qualifiedCount}/${totalCount} crew members qualified on ${aircraft.registration}`;
    }
    if (positionFilter) {
      return `${totalCount} crew members in ${positionFilter} position`;
    }
    return `${totalCount} crew members available`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Crew Members</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {getCrewListDescription()}
            </p>
            {aircraft && (
              <p className="text-xs text-blue-600 mt-1">
                Aircraft: {aircraft.registration} ({aircraft.type})
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search crew members..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select 
            value={createSafeSelectValue(positionFilter, SENTINELS.ALL)} 
            onValueChange={createSafeSelectHandler(onPositionFilterChange, SENTINELS.ALL)}
          >
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All positions" />
            </SelectTrigger>
            <SelectContent>
              {/* "All positions" option with sentinel */}
              <SelectItem value={SENTINELS.ALL}>All positions</SelectItem>
              
              {/* Position options */}
              {POSITION_OPTIONS.map(option => (
                <SelectItem key={`position-filter-${option.value}`} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Error loading crew data</span>
            </div>
            <p className="text-red-600 text-xs mt-1">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Loading crew members...</p>
          </div>
        )}

        {!loading && !error && crewMembers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No crew members match your criteria</p>
            <p className="text-sm mt-1">
              Try adjusting your search or position filter
            </p>
          </div>
        )}

        {!loading && !error && crewMembers.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crew Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Qualifications</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crewMembers.map((member) => (
                  <TableRow key={member.id} className={!member.qualified ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">
                            {member.position} • {member.roleLabel}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {member.ggid && (
                              <Badge variant="outline" className="text-xs">
                                {member.ggid}
                              </Badge>
                            )}
                            {member.qualified && (
                              <Badge className="text-xs bg-green-600 text-white">
                                Qualified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <StatusBadge status={member.statusBadge} />
                        
                        {member.docsMissing.length > 0 && (
                          <div className="text-xs text-amber-600">
                            Missing: {member.docsMissing.slice(0, 2).join(', ')}
                            {member.docsMissing.length > 2 && ` +${member.docsMissing.length - 2}`}
                          </div>
                        )}
                        
                        {member.docsMissing.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNotifyToComplete(member.id)}
                            className="text-xs h-6"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Notify
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <QualificationsBadges member={member} aircraft={aircraft} />
                    </TableCell>

                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          onClick={() => onRequestMission(member.id, 'extra_day')}
                          className={`text-xs h-8 ${
                            !member.qualified 
                              ? 'bg-orange-500 hover:bg-orange-600 border-orange-400 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          title={!member.qualified ? 'Warning: Missing documents or qualifications' : ''}
                        >
                          {!member.qualified && <AlertTriangle className="h-3 w-3 mr-1" />}
                          Extra Day
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRequestMission(member.id, 'freelance')}
                          className={`text-xs h-8 ${
                            !member.qualified 
                              ? 'border-orange-400 text-orange-600 hover:bg-orange-50' 
                              : ''
                          }`}
                          title={!member.qualified ? 'Warning: Missing documents or qualifications' : ''}
                        >
                          {!member.qualified && <AlertTriangle className="h-3 w-3 mr-1" />}
                          Freelance
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRequestMission(member.id, 'service')}
                          className={`text-xs h-8 ${
                            !member.qualified 
                              ? 'border-orange-400 text-orange-600 hover:bg-orange-50' 
                              : ''
                          }`}
                          title={!member.qualified ? 'Warning: Missing documents or qualifications' : ''}
                        >
                          {!member.qualified && <AlertTriangle className="h-3 w-3 mr-1" />}
                          Service
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}