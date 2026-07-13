import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

interface UseRealtimeAvailabilityOptions {
  tenantId: string;
  date: string | null;
  serviceIds: string[];
  employeeId?: string;
  enabled?: boolean;
}

interface AvailabilitySlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface RealtimeAvailabilityState {
  slots: AvailabilitySlot[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isConnected: boolean;
}

/**
 * Advanced hook for real-time availability with Server-Sent Events (SSE)
 * Falls back to polling if SSE is not available
 */
export function useRealtimeAvailability({
  tenantId,
  date,
  serviceIds,
  employeeId,
  enabled = true,
}: UseRealtimeAvailabilityOptions) {
  const [state, setState] = useState<RealtimeAvailabilityState>({
    slots: [],
    loading: false,
    error: null,
    lastUpdated: null,
    isConnected: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Backend is located in saas/Backend/ and runs on port 5000 by default
  const API_BASE_URL = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
    : 'http://localhost:5000/api';

  const fetchAvailability = useCallback(async () => {
    if (!enabled || !date || !tenantId || serviceIds.length === 0) {
      setState(prev => ({ ...prev, loading: false, slots: [] }));
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.getAvailableSlots(
        tenantId,
        date,
        serviceIds,
        employeeId
      );

      const slots: AvailabilitySlot[] = (response.slots || []).map((time: string) => ({
        time,
        available: true,
      }));

      setState({
        slots,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isConnected: true,
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }

      console.error('Error fetching availability:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch availability',
        isConnected: false,
      }));
    }
  }, [tenantId, date, serviceIds, employeeId, enabled]);

  // Try to establish SSE connection, fallback to polling
  useEffect(() => {
    if (!enabled || !date || !tenantId || serviceIds.length === 0) {
      // Cleanup
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setState(prev => ({ ...prev, isConnected: false }));
      return;
    }

    // Check if SSE is supported and enabled
    const enableRealtime = typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_ENABLE_REALTIME_UPDATES !== 'false'
      : true;

    if (enableRealtime && typeof EventSource !== 'undefined') {
      // Try SSE connection
      try {
        const params = new URLSearchParams({
          tenantId,
          date,
          serviceIds: serviceIds.join(','),
        });
        if (employeeId) {
          params.append('employeeId', employeeId);
        }

        const eventSource = new EventSource(
          `${API_BASE_URL.replace('/api', '')}/api/public/availability/stream?${params.toString()}`
        );

        eventSource.onopen = () => {
          setState(prev => ({ ...prev, isConnected: true }));
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.slots) {
              const slots: AvailabilitySlot[] = data.slots.map((time: string) => ({
                time,
                available: true,
              }));
              setState(prev => ({
                ...prev,
                slots,
                lastUpdated: new Date(),
                error: null,
              }));
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        };

        eventSource.onerror = (error) => {
          console.warn('SSE connection error, falling back to polling:', error);
          eventSource.close();
          eventSourceRef.current = null;
          
          // Fallback to polling
          const pollInterval = parseInt(
            process.env.NEXT_PUBLIC_AVAILABILITY_POLL_INTERVAL || '30000',
            10
          );
          pollIntervalRef.current = setInterval(fetchAvailability, pollInterval);
          setState(prev => ({ ...prev, isConnected: false }));
        };

        eventSourceRef.current = eventSource;

        // Initial fetch
        fetchAvailability();
      } catch (error) {
        console.warn('SSE not available, using polling:', error);
        // Fallback to polling
        const pollInterval = parseInt(
          process.env.NEXT_PUBLIC_AVAILABILITY_POLL_INTERVAL || '30000',
          10
        );
        pollIntervalRef.current = setInterval(fetchAvailability, pollInterval);
        fetchAvailability();
      }
    } else {
      // Use polling
      const pollInterval = parseInt(
        process.env.NEXT_PUBLIC_AVAILABILITY_POLL_INTERVAL || '30000',
        10
      );
      pollIntervalRef.current = setInterval(fetchAvailability, pollInterval);
      fetchAvailability();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setState(prev => ({ ...prev, isConnected: false }));
    };
  }, [tenantId, date, serviceIds, employeeId, enabled, fetchAvailability, API_BASE_URL]);

  const refresh = useCallback(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    ...state,
    refresh,
  };
}
