/**
 * Utility functions for parsing and serializing URL query parameters
 */

/**
 * Parse a string value to boolean
 * @param value - String value from URL param
 * @returns boolean or null if invalid
 */
export function parseBoolean(value: string | null): boolean | null {
  if (value === null || value === undefined) return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

/**
 * Parse a string value to number
 * @param value - String value from URL param
 * @returns number or null if invalid
 */
export function parseNumber(value: string | null): number | null {
  if (value === null || value === undefined) return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

/**
 * Parse a string value to Date
 * Supports ISO date format (YYYY-MM-DD)
 * @param value - String value from URL param
 * @returns Date or null if invalid
 */
export function parseDate(value: string | null): Date | null {
  if (value === null || value === undefined) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Serialize a Date to ISO date string (YYYY-MM-DD)
 * @param date - Date to serialize
 * @returns ISO date string (YYYY-MM-DD)
 */
export function serializeDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a value should be omitted from URL (matches default)
 * @param value - Current value
 * @param defaultValue - Default value to compare against
 * @returns true if value should be omitted
 */
export function shouldOmitDefault<T>(value: T, defaultValue: T): boolean {
  // For dates, compare the serialized values
  if (value instanceof Date && defaultValue instanceof Date) {
    return serializeDate(value) === serializeDate(defaultValue);
  }
  return value === defaultValue;
}

/**
 * Serialize a value to string for URL param
 * @param value - Value to serialize
 * @returns string representation or null to remove param
 */
export function serializeValue(value: any): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return serializeDate(value);
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value;
  return null;
}

/**
 * Parse a value from URL param with type inference
 * @param value - String value from URL
 * @param defaultValue - Default value to infer type from
 * @returns Parsed value with correct type
 */
export function parseValue<T>(value: string | null, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;

  if (typeof defaultValue === 'boolean') {
    const parsed = parseBoolean(value);
    return (parsed !== null ? parsed : defaultValue) as T;
  }

  if (typeof defaultValue === 'number') {
    const parsed = parseNumber(value);
    return (parsed !== null ? parsed : defaultValue) as T;
  }

  if (defaultValue instanceof Date) {
    const parsed = parseDate(value);
    return (parsed !== null ? parsed : defaultValue) as T;
  }

  // String or other types
  return (value || defaultValue) as T;
}
