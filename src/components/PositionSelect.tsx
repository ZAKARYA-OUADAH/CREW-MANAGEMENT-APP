import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { AlertCircle, Search, Loader2 } from 'lucide-react';
import { usePositionsREST } from './usePositionsREST';
import { 
  SENTINELS, 
  sanitizeSelectOptions, 
  createSafeSelectValue, 
  createSafeSelectHandler
} from './ui/select-utils';

interface PositionSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  error?: string;
  className?: string;
  allowAll?: boolean; // New prop to enable "All positions" option
}

export default function PositionSelect({
  value,
  onValueChange,
  placeholder = 'Select a position',
  required = false,
  disabled = false,
  label,
  error,
  className,
  allowAll = false
}: PositionSelectProps) {
  const { positionOptions, loading, error: fetchError, refreshPositions } = usePositionsREST();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Sanitize and filter positions based on search query
  const safeOptions = useMemo(() => sanitizeSelectOptions(positionOptions), [positionOptions]);
  
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return safeOptions;
    
    return safeOptions.filter(option => 
      option.position.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.position.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (option.position.description && option.position.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [safeOptions, searchQuery]);

  const selectedPosition = safeOptions.find(opt => opt.value === value);

  const handleValueChange = createSafeSelectHandler((actualValue) => {
    onValueChange?.(actualValue);
    setIsOpen(false);
    setSearchQuery('');
  }, SENTINELS.ALL);

  const displayError = error || fetchError;

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center space-x-2 mb-2">
          <Label>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
        </div>
      )}

      <Select 
        value={allowAll ? createSafeSelectValue(value, SENTINELS.ALL) : (value || "")} 
        onValueChange={handleValueChange}
        disabled={disabled || loading}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className={`${displayError ? 'border-red-500' : ''}`}>
          <SelectValue placeholder={loading ? 'Loading positions...' : placeholder}>
            {value === "" && allowAll ? "All positions" : (selectedPosition ? selectedPosition.label : placeholder)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Search input */}
          <div className="flex items-center space-x-2 p-2 border-b">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Loading positions...</span>
            </div>
          )}

          {/* Error state */}
          {fetchError && !loading && (
            <div className="p-4 space-y-2">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Error loading positions</span>
              </div>
              <p className="text-xs text-red-500">{fetchError}</p>
              <button
                onClick={refreshPositions}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Position options */}
          {!loading && !fetchError && (
            <>
              {/* "All positions" option */}
              {allowAll && (
                <SelectItem value={SENTINELS.ALL}>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-medium">All positions</div>
                      <div className="text-xs text-gray-500">No filter applied</div>
                    </div>
                  </div>
                </SelectItem>
              )}

              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <SelectItem key={`position-${option.position.id}`} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{option.position.name}</div>
                        <div className="text-xs text-gray-500 flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {option.position.code}
                          </Badge>
                          {option.position.description && (
                            <span>{option.position.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? (
                    <div>
                      <p className="text-sm">No positions found for "{searchQuery}"</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm">No positions available</p>
                      <button
                        onClick={refreshPositions}
                        className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </SelectContent>
      </Select>

      {/* Error message */}
      {displayError && (
        <div className="flex items-center space-x-1 mt-1">
          <AlertCircle className="h-3 w-3 text-red-500" />
          <span className="text-xs text-red-500">{displayError}</span>
        </div>
      )}

      {/* Required field indicator */}
      {required && !value && (
        <div className="text-xs text-gray-500 mt-1">
          This field is required
        </div>
      )}
    </div>
  );
}