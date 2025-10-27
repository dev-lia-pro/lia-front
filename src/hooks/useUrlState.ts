import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseValue, serializeValue, shouldOmitDefault, serializeDate } from '@/utils/urlParams';

export interface UseUrlStateOptions<T> {
  /**
   * Default value to use if param is not present in URL
   */
  defaultValue: T;

  /**
   * Name of the URL query parameter
   */
  paramName: string;

  /**
   * Debounce delay in milliseconds (for search inputs)
   * Default: 0 (no debounce)
   */
  debounce?: number;

  /**
   * If true, omits the param from URL when value equals defaultValue
   * Default: true
   */
  omitDefault?: boolean;
}

/**
 * Custom hook to synchronize state with URL query parameters
 * Simple approach: state is the source of truth, URL follows state
 *
 * When debounce is enabled:
 * - The first returned value is the immediate state (for input binding)
 * - Use the debouncedValue separately for queries
 */
export function useUrlState<T>(options: UseUrlStateOptions<T>): [T, (value: T) => void, T] {
  const { defaultValue, paramName, debounce = 0, omitDefault = true } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL only once
  const [state, setState] = useState<T>(() => {
    return parseValue(searchParams.get(paramName), defaultValue);
  });

  // Debounced state for triggering effects
  const [debouncedState, setDebouncedState] = useState<T>(state);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stateDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce the state itself when debounce is enabled
  useEffect(() => {
    if (debounce > 0) {
      // Clear any existing state debounce timer
      if (stateDebounceTimerRef.current) {
        clearTimeout(stateDebounceTimerRef.current);
      }

      // Set new timer
      stateDebounceTimerRef.current = setTimeout(() => {
        setDebouncedState(state);
      }, debounce);

      // Cleanup
      return () => {
        if (stateDebounceTimerRef.current) {
          clearTimeout(stateDebounceTimerRef.current);
        }
      };
    } else {
      // No debounce: update immediately
      setDebouncedState(state);
    }
  }, [state, debounce]);

  // Update URL when debounced state changes (state → URL)
  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const updateUrl = () => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);

        // Check if we should omit this param (matches default)
        if (omitDefault && shouldOmitDefault(debouncedState, defaultValue)) {
          newParams.delete(paramName);
        } else {
          const serialized = serializeValue(debouncedState);
          if (serialized !== null) {
            newParams.set(paramName, serialized);
          } else {
            newParams.delete(paramName);
          }
        }

        return newParams;
      }, { replace: true }); // Use replace to avoid polluting history
    };

    updateUrl();

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedState, paramName, defaultValue, omitDefault, setSearchParams]);

  // Listen to browser back/forward navigation (URL → state)
  useEffect(() => {
    const handlePopState = () => {
      const urlValue = parseValue(searchParams.get(paramName), defaultValue);
      setState(urlValue);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [searchParams, paramName, defaultValue]);

  // Custom setter
  const setUrlState = useCallback((value: T) => {
    setState(value);
  }, []);

  // Return: [immediateValue, setter, debouncedValue]
  return [state, setUrlState, debouncedState];
}
