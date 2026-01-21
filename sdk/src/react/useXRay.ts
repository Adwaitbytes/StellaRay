/**
 * useXRay Hook
 *
 * Hook for X-Ray Protocol metrics and status.
 */

import { useState, useEffect, useCallback } from 'react';
import { useZkLoginContext } from './Provider';
import type { XRayMetrics, XRayStatus, GasEstimate, XRayEvent } from '../xray';

/**
 * Return type for useXRay hook
 */
export interface UseXRayReturn {
  /** X-Ray protocol metrics */
  metrics: XRayMetrics | null;
  /** X-Ray protocol status */
  status: XRayStatus | null;
  /** Live events */
  events: XRayEvent[];
  /** Transactions per second */
  tps: number;
  /** Whether metrics are loading */
  loading: boolean;
  /** Last error */
  error: Error | null;
  /** Refresh metrics */
  refresh: () => Promise<void>;
  /** Estimate gas for an operation */
  estimateGas: (operation: string) => GasEstimate;
  /** Calculate Groth16 verification savings */
  calculateGroth16Savings: () => {
    wasmTotal: number;
    xrayTotal: number;
    savings: number;
    savingsPercent: number;
  };
  /** Check if X-Ray is supported */
  isSupported: boolean;
  /** Protocol version */
  protocolVersion: number;
}

/**
 * Hook for X-Ray Protocol integration
 *
 * @param options - Hook options
 * @param options.autoRefresh - Auto-refresh interval in ms (default: 5000)
 *
 * @example
 * ```tsx
 * function XRayDashboard() {
 *   const { metrics, status, tps, calculateGroth16Savings } = useXRay();
 *
 *   const savings = calculateGroth16Savings();
 *
 *   return (
 *     <div>
 *       <p>Protocol: {status?.protocolName} v{status?.protocolVersion}</p>
 *       <p>TPS: {tps}</p>
 *       <p>Proofs Verified: {metrics?.proofsVerified}</p>
 *       <p>Gas Savings: {savings.savingsPercent}%</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useXRay(options?: { autoRefresh?: number }): UseXRayReturn {
  const { xray } = useZkLoginContext();
  const autoRefresh = options?.autoRefresh ?? 5000;

  const [metrics, setMetrics] = useState<XRayMetrics | null>(null);
  const [status, setStatus] = useState<XRayStatus | null>(null);
  const [events, setEvents] = useState<XRayEvent[]>([]);
  const [tps, setTps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Refresh data
  const refresh = useCallback(async () => {
    try {
      const [metricsData, statusData, eventsData] = await Promise.all([
        xray.getMetrics(),
        xray.getStatus(),
        xray.getEvents(10),
      ]);

      setMetrics(metricsData);
      setStatus(statusData);
      setEvents(eventsData.events);
      setTps(eventsData.tps);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [xray]);

  // Auto-refresh
  useEffect(() => {
    refresh();

    if (autoRefresh > 0) {
      const interval = setInterval(refresh, autoRefresh);
      return () => clearInterval(interval);
    }
  }, [refresh, autoRefresh]);

  // Estimate gas
  const estimateGas = useCallback((operation: string): GasEstimate => {
    return xray.estimateGas(operation as any);
  }, [xray]);

  // Calculate Groth16 savings
  const calculateGroth16Savings = useCallback(() => {
    return xray.calculateGroth16Savings();
  }, [xray]);

  // Derived values
  const isSupported = status?.features.bn254.enabled && status?.features.poseidon.enabled;
  const protocolVersion = status?.protocolVersion ?? 25;

  return {
    metrics,
    status,
    events,
    tps,
    loading,
    error,
    refresh,
    estimateGas,
    calculateGroth16Savings,
    isSupported: !!isSupported,
    protocolVersion,
  };
}

export default useXRay;
