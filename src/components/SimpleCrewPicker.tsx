import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { useCrewManagement } from './useCrewManagement';
import { 
  Search, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  MapPin,
  Calendar,
  Star,
  Euro,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Types
interface CrewMember {
  id: string;
  name: string;
  email: string;
  role: 'internal' | 'freelancer' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  position: 'captain' | 'first_officer' | 'cabin_crew' | 'engineer';
  validation_status: 'approved' | 'pending' | 'rejected';
  preferred_bases: string[];
  currency: string;
  experience_years: number;
  last_active: string;
  profile_complete: boolean;
  created_at: string;
}

interface SelectedCrew {
  id: string;
  name: string;
  position: string;
  role: string;
  currency: string;
}

interface SimpleCrewPickerProps {
  selectedCrewIds?: string[];
  selectedCrew?: SelectedCrew[];
  onChange?: (selected: SelectedCrew[]) => void;
  onConfirm?: (selectedCrew: SelectedCrew[]) => void;
  requiredPosition?: string;
  maxSelections?: number;
  allowMultiple?: boolean;
  presetFilters?: {
    position?: string;
    roles?: string[];
    status?: string;
    validation_status?: string;
    preferred_bases?: string[];
    currency?: string;
  };
}

const POSITIONS = [
  { value: 'captain', label: 'Capitaine' },
  { value: 'first_officer', label: 'Copilote' },
  { value: 'cabin_crew', label: 'Personnel de Cabine' },
  { value: 'engineer', label: 'Ingénieur de Vol' }
];

// Mock data
const mockCrewMembers: CrewMember[] = [
  {
    id: 'crew-001',
    name: 'Sophie Laurent',
    email: 'sophie.laurent@crewtech.fr',
    role: 'internal',
    status: 'active',
    position: 'captain',
    validation_status: 'approved',
    preferred_bases: ['LFPB', 'LFPO', 'LFPG'],
    currency: 'EUR',
    experience_years: 12,
    last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    profile_complete: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'crew-002',
    name: 'Pierre Dubois',
    email: 'pierre.dubois@crewtech.fr',
    role: 'internal',
    status: 'active',
    position: 'first_officer',
    validation_status: 'approved',
    preferred_bases: ['LFPB', 'LFMN'],
    currency: 'EUR',
    experience_years: 8,
    last_active: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    profile_complete: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'crew-003',
    name: 'Lisa Anderson',
    email: 'lisa@aviation.com',
    role: 'freelancer',
    status: 'active',
    position: 'cabin_crew',
    validation_status: 'approved',
    preferred_bases: ['LFPB', 'EGLL', 'EBBR'],
    currency: 'EUR',
    experience_years: 6,
    last_active: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    profile_complete: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'crew-004',
    name: 'Marco Rossi',
    email: 'marco@freelance.eu',
    role: 'freelancer',
    status: 'active',
    position: 'captain',
    validation_status: 'approved',
    preferred_bases: ['LIMC', 'LFPB', 'LOWW'],
    currency: 'EUR',
    experience_years: 15,
    last_active: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    profile_complete: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'crew-005',
    name: 'Sarah Mitchell',
    email: 'sarah@crewaviation.com',
    role: 'freelancer',
    status: 'active',
    position: 'first_officer',
    validation_status: 'approved',
    preferred_bases: ['EGLL', 'LFPB'],
    currency: 'EUR',
    experience_years: 4,
    last_active: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    profile_complete: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'crew-006',
    name: 'Jean-Baptiste Martin',
    email: 'jb.martin@crewtech.fr',
    role: 'internal',
    status: 'active',
    position: 'engineer',
    validation_status: 'approved',
    preferred_bases: ['LFPB', 'LFMN', 'LFML'],
    currency: 'EUR',
    experience_years: 10,
    last_active: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    profile_complete: true,
    created_at: new Date().toISOString()
  }
];

export default function SimpleCrewPicker({
  selectedCrewIds = [],
  selectedCrew = [],
  onChange,
  onConfirm,
  requiredPosition = '',
  maxSelections,
  allowMultiple = true,
  presetFilters = {}
}: SimpleCrewPickerProps) {
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  
  // Use crew management hook with filters
  const {
    crewMembers: supabaseCrewMembers,
    loading,
    error,
    refresh
  } = useCrewManagement({
    positionFilter: requiredPosition || presetFilters.position,
    searchQuery: searchTerm
  });
  
  // Selection state
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set(selectedCrewIds)
  );
  
  // Transform Supabase crew members to local format, or use mock data if error
  const crewMembers = useMemo(() => {
    // If there's an error or no Supabase data, use mock data filtered by position
    if (error || !supabaseCrewMembers || supabaseCrewMembers.length === 0) {
      console.log('🔄 [SimpleCrewPicker] Using mock crew data due to error or empty data');
      
      // Filter mock data by position if specified
      let mockData = mockCrewMembers;
      const requiredPos = requiredPosition || presetFilters.position;
      if (requiredPos) {
        mockData = mockCrewMembers.filter(crew => crew.position === requiredPos);
      }
      
      return mockData;
    }

    // Transform Supabase data
    return supabaseCrewMembers.map(member => {
      // Safe position transformation
      let normalizedPosition = 'crew';
      if (member.position) {
        const pos = member.position.toLowerCase();
        if (pos.includes('captain') || pos.includes('commandant')) {
          normalizedPosition = 'captain';
        } else if (pos.includes('first officer') || pos.includes('copilote')) {
          normalizedPosition = 'first_officer';
        } else if (pos.includes('flight attendant') || pos.includes('cabin')) {
          normalizedPosition = 'cabin_crew';
        } else if (pos.includes('engineer') || pos.includes('mécanicien')) {
          normalizedPosition = 'engineer';
        }
      }

      return {
        id: member.id || 'unknown',
        name: member.name || 'Unknown',
        email: member.email || '',
        role: (member.roleLabel === 'Internal' ? 'internal' : 'freelancer') as const,
        status: 'active' as const,
        position: normalizedPosition as any,
        validation_status: (member.qualified ? 'approved' : 'pending') as const,
        preferred_bases: ['LFPB', 'LFPO'], // Default for now
        currency: 'EUR',
        experience_years: 5, // Default for now
        last_active: new Date().toISOString(),
        profile_complete: true,
        created_at: new Date().toISOString()
      };
    });
  }, [supabaseCrewMembers, error, requiredPosition, presetFilters.position]);

  // Computed values
  const selectedCrewData = useMemo(() => {
    return crewMembers
      .filter(crew => internalSelectedIds.has(crew.id))
      .map(crew => ({
        id: crew.id,
        name: crew.name,
        position: crew.position,
        role: crew.role,
        currency: crew.currency
      }));
  }, [crewMembers, internalSelectedIds]);

  // Debounced search
  const debouncedSearch = useCallback((searchValue: string) => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      setSearchTerm(searchValue);
    }, 300);
    
    setSearchDebounce(timeout);
  }, [searchDebounce]);

  // Filter crew based on preset filters (search is handled by the hook)
  const filteredCrewMembers = useMemo(() => {
    let filtered = crewMembers;
    
    if (presetFilters.roles && presetFilters.roles.length > 0) {
      filtered = filtered.filter(crew => presetFilters.roles!.includes(crew.role));
    } else {
      // Default: show internal and freelancer
      filtered = filtered.filter(crew => ['internal', 'freelancer'].includes(crew.role));
    }
    
    if (presetFilters.status) {
      filtered = filtered.filter(crew => crew.status === presetFilters.status);
    } else {
      // Default: only active users
      filtered = filtered.filter(crew => crew.status === 'active');
    }
    
    if (presetFilters.validation_status) {
      filtered = filtered.filter(crew => crew.validation_status === presetFilters.validation_status);
    }
    
    if (presetFilters.preferred_bases && presetFilters.preferred_bases.length > 0) {
      filtered = filtered.filter(crew => 
        crew.preferred_bases.some(base => presetFilters.preferred_bases!.includes(base))
      );
    }
    
    if (presetFilters.currency && presetFilters.currency !== 'ALL_CURRENCIES') {
      filtered = filtered.filter(crew => crew.currency === presetFilters.currency);
    }

    return filtered;
  }, [crewMembers, presetFilters]);

  // Use filtered crew members for display
  const displayCrewMembers = filteredCrewMembers;

  // Handle refresh function
  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
      toast.success('Données actualisées');
    } catch (error) {
      console.error('Error refreshing crew data:', error);
      toast.error('Erreur lors de l\'actualisation');
    }
  }, [refresh]);

  // Selection handlers
  const handleSelectCrew = (crewId: string, checked: boolean) => {
    const newSelection = new Set(internalSelectedIds);
    
    if (checked) {
      if (!allowMultiple) {
        newSelection.clear();
      }
      
      if (!maxSelections || newSelection.size < maxSelections) {
        newSelection.add(crewId);
      } else {
        toast.warning('Limite atteinte', {
          description: `Vous ne pouvez sélectionner que ${maxSelections} membre(s).`
        });
        return;
      }
    } else {
      newSelection.delete(crewId);
    }
    
    setInternalSelectedIds(newSelection);
    
    // Notify parent component
    const selectedData = displayCrewMembers
      .filter(crew => newSelection.has(crew.id))
      .map(crew => ({
        id: crew.id,
        name: crew.name,
        position: crew.position,
        role: crew.role,
        currency: crew.currency
      }));
    
    onChange?.(selectedData);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableIds = displayCrewMembers
        .slice(0, maxSelections || displayCrewMembers.length)
        .map(crew => crew.id);
      
      const newSelection = allowMultiple 
        ? new Set([...internalSelectedIds, ...selectableIds])
        : new Set(selectableIds.slice(0, 1));
      
      setInternalSelectedIds(newSelection);
    } else {
      const currentPageIds = new Set(displayCrewMembers.map(crew => crew.id));
      const newSelection = new Set(
        Array.from(internalSelectedIds).filter(id => !currentPageIds.has(id))
      );
      setInternalSelectedIds(newSelection);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    onConfirm?.(selectedCrewData);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays}j`;
    }
  };

  // Current page selected count
  const currentPageSelectedCount = displayCrewMembers.filter(crew => 
    internalSelectedIds.has(crew.id)
  ).length;
  
  const currentPageSelectableCount = displayCrewMembers.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Équipage disponible</span>
            {displayCrewMembers.length > 0 && (
              <Badge variant="secondary">
                {displayCrewMembers.length} membre{displayCrewMembers.length > 1 ? 's' : ''}
              </Badge>
            )}
            {error && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Mode démo
              </Badge>
            )}
          </div>
          
          {selectedCrewData.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-800">
                {selectedCrewData.length} sélectionné{selectedCrewData.length > 1 ? 's' : ''}
              </Badge>
              {onConfirm && (
                <Button 
                  size="sm" 
                  onClick={handleConfirm}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Ajouter à la Mission
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Simple Search */}
        <div className="space-y-2">
          <Label>Rechercher un membre d'équipage</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Nom du crew..."
              className="pl-10"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Applied Filters Info */}
        {(requiredPosition || presetFilters.position) && (
          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              Position: {POSITIONS.find(p => p.value === (requiredPosition || presetFilters.position))?.label}
            </Badge>
            {presetFilters.roles && presetFilters.roles.length > 0 && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                Rôles: {presetFilters.roles.join(', ')}
              </Badge>
            )}
            {presetFilters.status && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                Statut: {presetFilters.status}
              </Badge>
            )}
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={handleRefresh}
                >
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!requiredPosition && !presetFilters.position && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Veuillez sélectionner une position dans les détails de mission pour afficher les membres d'équipage.
              </AlertDescription>
            </Alert>
          )}

          {(requiredPosition || presetFilters.position) && !error && (
            <>
              {/* Select All */}
              {displayCrewMembers.length > 0 && allowMultiple && (
                <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
                  <Checkbox
                    checked={currentPageSelectedCount === currentPageSelectableCount && currentPageSelectableCount > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm">
                    Sélectionner tout sur cette page ({currentPageSelectedCount}/{currentPageSelectableCount})
                  </Label>
                </div>
              )}

              {/* Loading skeletons */}
              {loading && displayCrewMembers.length === 0 && (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Crew list */}
              {displayCrewMembers.length > 0 && (
                <div className="space-y-3">
                  {displayCrewMembers.map((crew) => (
                    <Card 
                      key={crew.id} 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        internalSelectedIds.has(crew.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectCrew(crew.id, !internalSelectedIds.has(crew.id))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Checkbox
                            checked={internalSelectedIds.has(crew.id)}
                            onCheckedChange={(checked) => handleSelectCrew(crew.id, !!checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Main info */}
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{crew.name}</p>
                                {crew.validation_status === 'approved' && (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{crew.email}</p>
                              <div className="flex items-center space-x-2">
                                <Badge variant={crew.role === 'internal' ? 'default' : 'secondary'}>
                                  {crew.role === 'internal' ? 'Interne' : 'Freelance'}
                                </Badge>
                                <Badge variant="outline">
                                  {POSITIONS.find(p => p.value === crew.position)?.label}
                                </Badge>
                              </div>
                            </div>

                            {/* Experience & Currency */}
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-sm">{crew.experience_years} ans</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Euro className="h-3 w-3 text-green-500" />
                                <span className="text-sm">{crew.currency}</span>
                              </div>
                            </div>

                            {/* Preferred bases */}
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 text-blue-500" />
                                <span className="text-xs text-muted-foreground">Bases:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {crew.preferred_bases?.slice(0, 3).map((base, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {base}
                                  </Badge>
                                ))}
                                {crew.preferred_bases?.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{crew.preferred_bases.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Last active */}
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3 text-purple-500" />
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(crew.last_active)}
                                </span>
                              </div>
                              <Badge 
                                variant={crew.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {crew.status === 'active' ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && displayCrewMembers.length === 0 && (requiredPosition || presetFilters.position) && (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucun membre d'équipage trouvé</h3>
                    <p className="text-muted-foreground mb-4">
                      Aucun crew ne correspond aux critères sélectionnés dans les filtres de mission.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Modifiez les filtres dans les détails de mission ou ajustez votre recherche.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}