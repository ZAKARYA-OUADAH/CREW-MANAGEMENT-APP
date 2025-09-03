import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Search, 
  Filter, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  UserCheck,
  MapPin,
  Calendar,
  Star,
  Euro,
  ChevronDown,
  X
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

interface CrewPickerProps {
  selectedCrewIds?: string[];
  selectedCrew?: SelectedCrew[];
  onChange?: (selected: SelectedCrew[]) => void;
  onConfirm?: (selectedCrew: SelectedCrew[]) => void;
  requiredPosition?: string;
  maxSelections?: number;
  allowMultiple?: boolean;
}

interface Filters {
  position: string;
  roles: string[];
  status: string;
  validation_status: string;
  preferred_bases: string[];
  currency: string;
  search: string;
  sort_field: 'name' | 'experience_years' | 'last_active';
  sort_direction: 'asc' | 'desc';
}

const DEFAULT_FILTERS: Filters = {
  position: '',
  roles: ['internal', 'freelancer'],
  status: 'active',
  validation_status: 'approved',
  preferred_bases: [],
  currency: 'ALL_CURRENCIES',
  search: '',
  sort_field: 'last_active',
  sort_direction: 'desc'
};

const POSITIONS = [
  { value: 'captain', label: 'Capitaine' },
  { value: 'first_officer', label: 'Copilote' },
  { value: 'cabin_crew', label: 'Personnel de Cabine' },
  { value: 'engineer', label: 'Ingénieur de Vol' }
];

const ROLES = [
  { value: 'internal', label: 'Interne' },
  { value: 'freelancer', label: 'Freelance' }
];

const STATUSES = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'pending', label: 'En attente' }
];

const VALIDATION_STATUSES = [
  { value: 'approved', label: 'Approuvé' },
  { value: 'pending', label: 'En attente' },
  { value: 'rejected', label: 'Rejeté' }
];

const SORT_OPTIONS = [
  { value: 'last_active:desc', label: 'Dernière activité (récent)' },
  { value: 'last_active:asc', label: 'Dernière activité (ancien)' },
  { value: 'name:asc', label: 'Nom (A-Z)' },
  { value: 'name:desc', label: 'Nom (Z-A)' },
  { value: 'experience_years:desc', label: 'Expérience (+ → -)' },
  { value: 'experience_years:asc', label: 'Expérience (- → +)' }
];

const COMMON_BASES = ['LFPB', 'LFPO', 'LFPG', 'EGLL', 'EGGW', 'KJFK', 'KLAX', 'EDDF', 'LEMD'];

export default function CrewPicker({
  selectedCrewIds = [],
  selectedCrew = [],
  onChange,
  onConfirm,
  requiredPosition = '',
  maxSelections,
  allowMultiple = true
}: CrewPickerProps) {
  const [supabase] = useState(() => createClient());
  
  // State
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    position: requiredPosition || '',
    currency: 'ALL_CURRENCIES' // Start with sentinel value
  });
  
  // Selection state
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set(selectedCrewIds)
  );
  
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
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setCurrentPage(0);
    }, 300);
    
    setSearchDebounce(timeout);
  }, [searchDebounce]);

  // Fetch crew members
  const fetchCrewMembers = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      // Cancel previous request
      if (abortController) {
        abortController.abort();
      }
      
      const newAbortController = new AbortController();
      setAbortController(newAbortController);

      const pageSize = 20;
      const from = reset ? 0 : currentPage * pageSize;
      const to = from + pageSize - 1;

      // Build query
      let query = supabase
        .from('users')
        .select(`
          id, name, email, role, status, position, validation_status, 
          preferred_bases, currency, experience_years, last_active, 
          profile_complete, created_at
        `)
        .eq('profile_complete', true)
        .not('name', 'is', null);

      // Apply filters
      if (filters.position) {
        query = query.eq('position', filters.position);
      }
      
      if (filters.roles.length > 0) {
        query = query.in('role', filters.roles);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.validation_status) {
        query = query.eq('validation_status', filters.validation_status);
      }
      
      if (filters.preferred_bases.length > 0) {
        query = query.contains('preferred_bases', filters.preferred_bases);
      }
      
      if (filters.currency && filters.currency !== 'ALL_CURRENCIES') {
        query = query.eq('currency', filters.currency);
      }
      
      if (filters.search.trim()) {
        query = query.ilike('name', `%${filters.search.trim()}%`);
      }

      // Apply sorting
      query = query.order(filters.sort_field, { 
        ascending: filters.sort_direction === 'asc' 
      });
      
      // Add secondary sort for consistency
      if (filters.sort_field !== 'name') {
        query = query.order('name', { ascending: true });
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (newAbortController.signal.aborted) {
        return;
      }

      if (queryError) {
        throw queryError;
      }

      const newMembers = data || [];
      
      if (reset) {
        setCrewMembers(newMembers);
        setCurrentPage(0);
      } else {
        setCrewMembers(prev => [...prev, ...newMembers]);
      }
      
      setHasMore(newMembers.length === pageSize);
      setTotalCount(count || 0);
      
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching crew members:', err);
        setError('Impossible de charger les crews. Vérifiez votre connexion ou réessayez.');
        toast.error('Erreur de chargement', {
          description: 'Impossible de charger les profils crew.'
        });
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }, [supabase, filters, currentPage, abortController]);

  // Initial fetch and filter changes
  useEffect(() => {
    fetchCrewMembers(true);
  }, [filters.position, filters.roles, filters.status, filters.validation_status, 
      filters.preferred_bases, filters.currency, filters.search, 
      filters.sort_field, filters.sort_direction]);

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
    const selectedData = crewMembers
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
      const selectableIds = crewMembers
        .slice(0, maxSelections || crewMembers.length)
        .map(crew => crew.id);
      
      const newSelection = allowMultiple 
        ? new Set([...internalSelectedIds, ...selectableIds])
        : new Set(selectableIds.slice(0, 1));
      
      setInternalSelectedIds(newSelection);
    } else {
      const currentPageIds = new Set(crewMembers.map(crew => crew.id));
      const newSelection = new Set(
        Array.from(internalSelectedIds).filter(id => !currentPageIds.has(id))
      );
      setInternalSelectedIds(newSelection);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      position: requiredPosition || '',
      currency: 'ALL_CURRENCIES'
    });
    setCurrentPage(0);
  };

  // Load more
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchCrewMembers(false);
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
  const currentPageSelectedCount = crewMembers.filter(crew => 
    internalSelectedIds.has(crew.id)
  ).length;
  
  const currentPageSelectableCount = crewMembers.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Sélection d'équipage</span>
            {totalCount > 0 && (
              <Badge variant="secondary">
                {totalCount} résultat{totalCount > 1 ? 's' : ''}
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
      
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
            </Label>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Position (Required) */}
            <div className="space-y-2">
              <Label>Position *</Label>
              <Select
                value={filters.position}
                onValueChange={(value) => setFilters(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(position => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Validation Status */}
            <div className="space-y-2">
              <Label>Validation</Label>
              <Select
                value={filters.validation_status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, validation_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALIDATION_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select
                value={filters.currency}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  currency: value === 'ALL_CURRENCIES' ? '' : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_CURRENCIES">Toutes</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label>Tri</Label>
              <Select
                value={`${filters.sort_field}:${filters.sort_direction}`}
                onValueChange={(value) => {
                  const [field, direction] = value.split(':') as [typeof filters.sort_field, typeof filters.sort_direction];
                  setFilters(prev => ({ 
                    ...prev, 
                    sort_field: field, 
                    sort_direction: direction 
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Nom du crew..."
                  className="pl-10"
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

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
                  onClick={() => fetchCrewMembers(true)}
                >
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!filters.position && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Veuillez sélectionner une position pour afficher les membres d'équipage.
              </AlertDescription>
            </Alert>
          )}

          {filters.position && !error && (
            <>
              {/* Select All */}
              {crewMembers.length > 0 && allowMultiple && (
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
              {loading && crewMembers.length === 0 && (
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
              {crewMembers.length > 0 && (
                <div className="space-y-3">
                  {crewMembers.map((crew) => (
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
              {!loading && crewMembers.length === 0 && filters.position && (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucun crew trouvé</h3>
                    <p className="text-muted-foreground mb-4">
                      Modifiez les filtres (position, base, rôle...) pour élargir votre recherche.
                    </p>
                    <Button variant="outline" onClick={resetFilters}>
                      Réinitialiser les filtres
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Load more */}
              {hasMore && crewMembers.length > 0 && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Charger plus
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}