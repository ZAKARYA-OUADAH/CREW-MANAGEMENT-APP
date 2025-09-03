import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Calendar, ChevronLeft, ChevronRight, Filter, Search, Plus, Eye } from 'lucide-react';
import { MissionOrder, getStatusColor, getStatusText, getMissionTypeText } from './MissionOrderService';
import { getTypeColor, formatDate } from './MissionManagementHelpers';
import { apiClient } from '../utils/supabase/client';

interface MissionCalendarProps {
  onCreateMission?: () => void;
  showHeader?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  missions: MissionOrder[];
}

interface CalendarWeek {
  days: CalendarDay[];
}

export default function MissionCalendar({ onCreateMission, showHeader = true }: MissionCalendarProps) {
  const [missions, setMissions] = useState<MissionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCrewMember, setSelectedCrewMember] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');



  // Load missions
  const loadMissions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMissions();
      setMissions(response.missions || []);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  // Filter missions based on search and filters
  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      // Status filter
      if (selectedStatus !== 'all' && mission.status !== selectedStatus) {
        return false;
      }

      // Crew member filter
      if (selectedCrewMember !== 'all' && mission.crew?.id !== selectedCrewMember) {
        return false;
      }

      // Search query
      if (searchQuery && !mission.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !mission.crew?.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !mission.aircraft?.immat?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [missions, selectedStatus, selectedCrewMember, searchQuery]);

  // Get unique crew members for filter
  const crewMembers = useMemo(() => {
    const unique = new Map();
    missions.forEach(mission => {
      if (mission.crew?.id && mission.crew?.name) {
        unique.set(mission.crew.id, mission.crew.name);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [missions]);

  // Calendar generation functions
  const generateCalendar = (date: Date, mode: 'month' | 'week'): CalendarWeek[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    if (mode === 'week') {
      return generateWeekCalendar(date);
    }
    
    // Month view
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get first day of the week for the first day of month (Monday = 1, Sunday = 0)
    const startDay = new Date(firstDay);
    const firstDayOfWeek = firstDay.getDay();
    const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDay.setDate(firstDay.getDate() - daysToSubtract);
    
    const weeks: CalendarWeek[] = [];
    const currentDay = new Date(startDay);
    
    while (currentDay <= lastDay || weeks.length < 6) {
      const week: CalendarDay[] = [];
      
      for (let i = 0; i < 7; i++) {
        const dayMissions = getMissionsForDate(currentDay);
        
        week.push({
          date: new Date(currentDay),
          isCurrentMonth: currentDay.getMonth() === month,
          missions: dayMissions
        });
        
        currentDay.setDate(currentDay.getDate() + 1);
      }
      
      weeks.push({ days: week });
      
      if (currentDay > lastDay && weeks.length >= 5) break;
    }
    
    return weeks;
  };

  const generateWeekCalendar = (date: Date): CalendarWeek[] => {
    const startOfWeek = new Date(date);
    const dayOfWeek = date.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(date.getDate() - daysToSubtract);
    
    const week: CalendarDay[] = [];
    const currentDay = new Date(startOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const dayMissions = getMissionsForDate(currentDay);
      
      week.push({
        date: new Date(currentDay),
        isCurrentMonth: true,
        missions: dayMissions
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return [{ days: week }];
  };

  const getMissionsForDate = (date: Date): MissionOrder[] => {
    const dateStr = date.toISOString().split('T')[0];
    
    return filteredMissions.filter(mission => {
      const startDate = mission.contract?.startDate ? new Date(mission.contract.startDate).toISOString().split('T')[0] : null;
      const endDate = mission.contract?.endDate ? new Date(mission.contract.endDate).toISOString().split('T')[0] : null;
      
      if (startDate && endDate) {
        return dateStr >= startDate && dateStr <= endDate;
      } else if (startDate) {
        return dateStr === startDate;
      }
      
      return false;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const calendar = generateCalendar(currentDate, viewMode);
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1>Calendrier des Missions</h1>
              <p className="text-muted-foreground">
                Visualisation et gestion des missions par calendrier
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
                  >
                    {viewMode === 'month' ? 'Vue semaine' : 'Vue mois'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Basculer entre l'affichage mensuel et hebdomadaire du calendrier</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onCreateMission}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Mission
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Créer une nouvelle mission de vol</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID, équipage, immatriculation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending_approval">En attente d'approbation</SelectItem>
                <SelectItem value="pending_client_approval">En attente client</SelectItem>
                <SelectItem value="approved">Approuvée</SelectItem>
                <SelectItem value="client_rejected">Rejetée client</SelectItem>
                <SelectItem value="pending_validation">En attente validation</SelectItem>
                <SelectItem value="validated">Validée</SelectItem>
                <SelectItem value="rejected">Rejetée</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCrewMember} onValueChange={setSelectedCrewMember}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par équipage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les équipages</SelectItem>
                {crewMembers.map(crew => (
                  <SelectItem key={crew.id} value={crew.id}>
                    {crew.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{viewMode === 'month' ? 'Mois précédent' : 'Semaine précédente'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <CardTitle className="text-xl">
                {viewMode === 'month' 
                  ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  : `Semaine du ${formatDate(calendar[0]?.days[0]?.date?.toISOString())}`
                }
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{viewMode === 'month' ? 'Mois suivant' : 'Semaine suivante'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Aujourd'hui
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Revenir à la date d'aujourd'hui dans le calendrier</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm text-muted-foreground border-b">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar weeks */}
              {calendar.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.days.map((day, dayIndex) => {
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`
                          min-h-28 p-1 border rounded transition-colors hover:bg-muted/50
                          ${!day.isCurrentMonth ? 'opacity-40' : ''}
                          ${isToday ? 'bg-primary/10 border-primary' : 'border-border'}
                        `}
                      >
                        <div className={`text-sm mb-1 ${isToday ? 'font-medium text-primary' : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {day.date.getDate()}
                        </div>
                        
                        <div className="space-y-1">
                          {day.missions.slice(0, 2).map(mission => (
                            <div
                              key={mission.id}
                              className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                              onClick={() => window.open(`/missions/${mission.id}`, '_blank')}
                              title={`${mission.id} - ${mission.aircraft?.immat || 'Appareil non défini'} - ${mission.crew?.name || 'Équipage non assigné'} - ${getMissionTypeText(mission.type)}`}
                            >
                              <div className="flex items-center space-x-1">
                                <Badge 
                                  className={`text-xs px-1 py-0 ${getStatusColor(mission.status)}`}
                                  style={{ fontSize: '10px' }}
                                >
                                  {mission.id.split('-')[1]}
                                </Badge>
                              </div>
                              <div className="truncate text-muted-foreground" style={{ fontSize: '10px' }}>
                                {mission.aircraft?.immat || 'N/A'}
                              </div>
                              <div className="truncate text-muted-foreground" style={{ fontSize: '9px' }}>
                                {mission.crew?.name?.split(' ')[0] || 'N/A'}
                              </div>
                            </div>
                          ))}
                          
                          {day.missions.length > 2 && (
                            <div className="text-xs text-muted-foreground text-center py-1">
                              +{day.missions.length - 2} autres
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mission Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Résumé des missions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-primary">{filteredMissions.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-blue-600">
                {filteredMissions.filter(m => m.status === 'approved').length}
              </div>
              <div className="text-sm text-muted-foreground">Approuvées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-yellow-600">
                {filteredMissions.filter(m => m.status === 'pending_client_approval').length}
              </div>
              <div className="text-sm text-muted-foreground">En attente client</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-green-600">
                {filteredMissions.filter(m => m.status === 'validated').length}
              </div>
              <div className="text-sm text-muted-foreground">Validées</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}