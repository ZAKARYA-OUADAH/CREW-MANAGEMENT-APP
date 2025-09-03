/**
 * Select Utilities - Robust helpers for Radix Select components
 * 
 * These utilities prevent empty values in SelectItem which cause Radix errors
 * by sanitizing options and using sentinel values for "All" options.
 */

// Common sentinel values
export const SENTINELS = {
  ALL: "__ALL__",
  EMPTY: "__EMPTY__",
  NULL: "__NULL__",
  NONE: "__NONE__"
} as const;

export type SentinelValue = typeof SENTINELS[keyof typeof SENTINELS];

/**
 * Sanitize options to prevent empty values in SelectItem
 * Filters out null, undefined, empty string values and ensures all values are strings
 */
export function sanitizeSelectOptions<T extends { label: string; value: any }>(
  options?: T[]
): Array<T & { value: string }> {
  return (options ?? [])
    .filter(option => 
      option && 
      option.label && 
      option.value !== null && 
      option.value !== undefined && 
      String(option.value).trim() !== ""
    )
    .map(option => ({ 
      ...option, 
      value: String(option.value).trim() 
    }));
}

/**
 * Create a safe Select value that uses sentinel for empty states
 */
export function createSafeSelectValue(
  value: string | null | undefined,
  emptySentinel: string = SENTINELS.ALL
): string {
  if (!value || value.trim() === "") {
    return emptySentinel;
  }
  return String(value).trim();
}

/**
 * Extract actual value from potentially sentinel value
 */
export function extractSelectValue(
  value: string | null | undefined,
  emptySentinel: string = SENTINELS.ALL
): string {
  if (!value || value === emptySentinel) {
    return "";
  }
  return String(value).trim();
}

/**
 * Create a value change handler that converts sentinels back to empty strings
 */
export function createSafeSelectHandler(
  onChange: (value: string) => void,
  emptySentinel: string = SENTINELS.ALL
) {
  return (value: string) => {
    onChange(extractSelectValue(value, emptySentinel));
  };
}

/**
 * Check if a value is a sentinel
 */
export function isSentinelValue(value: string): boolean {
  return Object.values(SENTINELS).includes(value as SentinelValue);
}

/**
 * Common "All" option for Select components
 */
export function createAllOption(
  label: string = "All",
  sentinel: string = SENTINELS.ALL
) {
  return {
    value: sentinel,
    label
  };
}

/**
 * Utility to create position options from Supabase data
 */
export function createPositionOptions(positions: Array<{
  id: number;
  code: string;
  name: string;
  description?: string;
}>) {
  return sanitizeSelectOptions(
    positions.map(position => ({
      label: `${position.name} / ${position.code}`,
      value: position.code,
      position
    }))
  );
}

/**
 * Utility to create aircraft options from Supabase data
 */
export function createAircraftOptions(aircraft: Array<{
  id: string;
  registration: string;
  type: string;
  status?: string;
}>) {
  return sanitizeSelectOptions(
    aircraft.map(ac => ({
      label: `${ac.registration} (${ac.type})`,
      value: ac.registration,
      aircraft: ac
    }))
  );
}

/**
 * Common status options for missions
 */
export const MISSION_STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "crew_assigned", label: "Équipage assigné" },
  { value: "confirmed", label: "Confirmée" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminée" },
  { value: "cancelled", label: "Annulée" }
];

/**
 * Common position options
 */
export const POSITION_OPTIONS = [
  { value: "Captain", label: "Captain" },
  { value: "First Officer", label: "First Officer" },
  { value: "Flight Attendant", label: "Flight Attendant" },
  { value: "Senior Flight Attendant", label: "Senior Flight Attendant" }
];

/**
 * Higher-order component that creates a safe Select wrapper
 */
export interface SafeSelectProps {
  value?: string | null;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  emptySentinel?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Example usage:
 * 
 * // Basic usage with sentinel
 * const [statusFilter, setStatusFilter] = useState("");
 * 
 * <Select 
 *   value={createSafeSelectValue(statusFilter, SENTINELS.ALL)}
 *   onValueChange={createSafeSelectHandler(setStatusFilter, SENTINELS.ALL)}
 * >
 *   <SelectTrigger>
 *     <SelectValue placeholder="All statuses" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value={SENTINELS.ALL}>All statuses</SelectItem>
 *     {MISSION_STATUS_OPTIONS.map(option => (
 *       <SelectItem key={option.value} value={option.value}>
 *         {option.label}
 *       </SelectItem>
 *     ))}
 *   </SelectContent>
 * </Select>
 * 
 * // With options sanitization
 * const safeOptions = sanitizeSelectOptions(positionsFromSupabase);
 */