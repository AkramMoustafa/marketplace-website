/**
 * useVehicleProcessing
 *
 * Reusable React hook for streaming vehicle-processing events over WebSocket.
 * Manages connection lifecycle, auto-reconnect, step state, and cleanup.
 *
 * Usage:
 *   const { steps, result, error, isRunning, run, reset } = useVehicleProcessing();
 *
 *   // Start Phase A
 *   await run({ phase: 'A', vin: '1HGCM82633A004352' });
 *
 *   // Start Phase B
 *   await run({ phase: 'B', vin: '...', make: 'Honda', ... });
 *
 *   // Start Phase C
 *   await run({ phase: 'C', vehicle_id: '<uuid>', ... });
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgentResult, AgentStepId } from '@/lib/types';

export type StepStatus = 'pending' | 'running' | 'done' | 'error';

export interface ProcessingStep {
  id: AgentStepId;
  label: string;
  status: StepStatus;
}

interface UseVehicleProcessingReturn {
  /** Live step list — grows as the server emits step_start events. */
  steps: ProcessingStep[];
  /** Final AgentResult from the server once processing completes. */
  result: AgentResult | null;
  /** Human-readable error string, set on connection loss or server error. */
  error: string | null;
  /** True while a WebSocket pipeline is active. */
  isRunning: boolean;
  /**
   * Connect to /ws/vehicle-processing, send `payload`, and stream events.
   * Resolves when the server sends `status: completed`.
   * Rejects on unrecoverable error or max reconnect attempts reached.
   * Automatically includes `x_admin_auth` from localStorage.
   */
  run: (payload: Record<string, unknown>) => Promise<void>;
  /** Reset steps, result, and error to initial state and close any open socket. */
  reset: () => void;
  /** Close the WebSocket immediately (e.g. on user cancel). */
  close: () => void;
}

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/^https?/, p => p === 'https' ? 'wss' : 'ws');

const MAX_RECONNECTS = 3;
const RECONNECT_BASE_MS = 500;

export function useVehicleProcessing(): UseVehicleProcessingReturn {
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      wsRef.current?.close(1000, 'unmounted');
      wsRef.current = null;
    };
  }, []);

  const close = useCallback(() => {
    wsRef.current?.close(1000, 'user-cancelled');
    wsRef.current = null;
    if (mountedRef.current) setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    close();
    if (mountedRef.current) {
      setSteps([]);
      setResult(null);
      setError(null);
    }
  }, [close]);

  const run = useCallback((payload: Record<string, unknown>): Promise<void> => {
    const adminAuth =
      typeof window !== 'undefined' ? localStorage.getItem('adminAuthenticated') ?? 'true' : 'true';
    const fullPayload = { ...payload, x_admin_auth: adminAuth };

    if (mountedRef.current) {
      setIsRunning(true);
      setError(null);
      setResult(null);
    }

    return new Promise<void>((resolve, reject) => {
      let reconnects = 0;
      let settled = false;

      function settle(ok: true): void;
      function settle(ok: false, reason: Error): void;
      function settle(ok: boolean, reason?: Error): void {
        if (settled) return;
        settled = true;
        if (mountedRef.current) setIsRunning(false);
        ok ? resolve() : reject(reason);
      }

      function connect() {
        const socket = new WebSocket(`${WS_BASE}/ws/vehicle-processing`);
        wsRef.current = socket;

        socket.onopen = () => {
          reconnects = 0;
          socket.send(JSON.stringify(fullPayload));
        };

        socket.onmessage = (evt) => {
          if (!mountedRef.current) {
            socket.close(1000, 'unmounted');
            return;
          }
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = JSON.parse(evt.data as string) as any;

            if (data.type === 'step_start') {
              const id = data.step as AgentStepId;
              const label = data.message as string;
              setSteps(prev => {
                const exists = prev.some(s => s.id === id);
                if (exists) return prev.map(s => s.id === id ? { ...s, status: 'running' } : s);
                return [...prev, { id, label, status: 'running' }];
              });
            } else if (data.type === 'step_done') {
              const id = data.step as AgentStepId;
              setSteps(prev => prev.map(s => s.id === id ? { ...s, status: 'done' } : s));
            } else if (data.status === 'completed' || data.type === 'complete') {
              setResult(data.result as AgentResult);
              // Mark any still-running step as done
              setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'done' } : s));
              socket.close(1000, 'completed');
              settle(true);
            } else if (data.type === 'error' || data.status === 'error') {
              const msg = data.message as string;
              setError(msg);
              socket.close(1000, 'error');
              settle(false, new Error(msg));
            }
          } catch { /* skip malformed frames */ }
        };

        socket.onclose = (evt) => {
          if (evt.code === 1000) return; // clean close handled above
          if (!mountedRef.current) return;
          if (reconnects < MAX_RECONNECTS) {
            reconnects++;
            setTimeout(connect, RECONNECT_BASE_MS * reconnects);
          } else {
            const msg = `WebSocket disconnected (code ${evt.code}) after ${MAX_RECONNECTS} reconnect attempts`;
            if (mountedRef.current) setError(msg);
            settle(false, new Error(msg));
          }
        };

        socket.onerror = () => { /* always followed by onclose */ };
      }

      connect();
    });
  }, []);

  return { steps, result, error, isRunning, run, reset, close };
}
