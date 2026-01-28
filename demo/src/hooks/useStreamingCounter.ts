/**
 * useStreamingCounter Hook
 *
 * Provides real-time updates for streaming payment amounts.
 * Updates every 100ms for smooth animation, recalculates based on flow rate.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface StreamingCounterOptions {
  totalAmount: number;
  flowRatePerSecond: number;
  startTime: Date;
  endTime: Date;
  cliffTime?: Date;
  withdrawnAmount?: number;
  curveType?: 'linear' | 'cliff' | 'exponential' | 'steps';
  isPaused?: boolean;
  updateInterval?: number; // ms
}

interface StreamingCounterState {
  streamedAmount: number;
  withdrawableAmount: number;
  remainingAmount: number;
  percentComplete: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  isActive: boolean;
  isCompleted: boolean;
  isCliffPassed: boolean;
  formattedStreamed: string;
  formattedWithdrawable: string;
  formattedRemaining: string;
  formattedPercent: string;
}

/**
 * Calculate streamed amount based on curve type
 */
function calculateCurveAmount(
  totalAmount: number,
  elapsed: number,
  duration: number,
  cliffDuration: number,
  curveType: string
): number {
  if (elapsed <= 0) return 0;
  if (elapsed >= duration) return totalAmount;

  // Check cliff
  if (cliffDuration > 0 && elapsed < cliffDuration) {
    return 0;
  }

  const effectiveElapsed = cliffDuration > 0 ? elapsed - cliffDuration : elapsed;
  const effectiveDuration = cliffDuration > 0 ? duration - cliffDuration : duration;
  let progress = effectiveElapsed / effectiveDuration;

  switch (curveType) {
    case 'exponential':
      progress = progress * progress;
      break;
    case 'steps':
      progress = Math.floor(progress * 10) / 10;
      break;
    default:
      // linear
      break;
  }

  const cliffAmount = cliffDuration > 0 ? (totalAmount * cliffDuration) / duration : 0;
  const postCliffAmount = totalAmount - cliffAmount;

  if (cliffDuration > 0 && elapsed >= cliffDuration) {
    return cliffAmount + postCliffAmount * progress;
  }

  return totalAmount * progress;
}

/**
 * Format number with appropriate precision
 */
function formatAmount(amount: number): string {
  if (amount === 0) return '0.00';
  if (amount < 0.0001) return amount.toFixed(7);
  if (amount < 1) return amount.toFixed(4);
  if (amount < 1000) return amount.toFixed(2);
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Pure function to calculate streaming state at a given time
 */
function computeStreamState(
  now: Date,
  totalAmount: number,
  startTime: Date,
  endTime: Date,
  cliffTime: Date | undefined,
  withdrawnAmount: number,
  curveType: string,
  isPaused: boolean
): StreamingCounterState {
  const startMs = startTime.getTime();
  const endMs = endTime.getTime();
  const cliffMs = cliffTime?.getTime() || startMs;
  const nowMs = now.getTime();

  const durationSeconds = (endMs - startMs) / 1000;
  const cliffDuration = (cliffMs - startMs) / 1000;
  const elapsedSeconds = Math.max(0, (nowMs - startMs) / 1000);
  const remainingSeconds = Math.max(0, (endMs - nowMs) / 1000);

  const isActive = nowMs >= startMs && nowMs < endMs && !isPaused;
  const isCompleted = nowMs >= endMs;
  const isCliffPassed = !cliffTime || nowMs >= cliffMs;

  // Calculate streamed amount using curve
  const streamedAmount = calculateCurveAmount(
    totalAmount,
    elapsedSeconds,
    durationSeconds,
    cliffDuration,
    curveType
  );

  const withdrawableAmount = Math.max(0, streamedAmount - withdrawnAmount);
  const remainingAmount = totalAmount - streamedAmount;
  const percentComplete = totalAmount > 0 ? (streamedAmount / totalAmount) * 100 : 0;

  return {
    streamedAmount,
    withdrawableAmount,
    remainingAmount,
    percentComplete,
    elapsedSeconds,
    remainingSeconds,
    isActive,
    isCompleted,
    isCliffPassed,
    formattedStreamed: formatAmount(streamedAmount),
    formattedWithdrawable: formatAmount(withdrawableAmount),
    formattedRemaining: formatAmount(remainingAmount),
    formattedPercent: percentComplete.toFixed(2),
  };
}

export function useStreamingCounter(options: StreamingCounterOptions): StreamingCounterState {
  const {
    totalAmount,
    flowRatePerSecond,
    startTime,
    endTime,
    cliffTime,
    withdrawnAmount = 0,
    curveType = 'linear',
    isPaused = false,
    updateInterval = 100,
  } = options;

  // Initialize state using the pure function
  const [state, setState] = useState<StreamingCounterState>(() =>
    computeStreamState(
      new Date(),
      totalAmount,
      startTime,
      endTime,
      cliffTime,
      withdrawnAmount,
      curveType,
      isPaused
    )
  );

  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());

  // Memoized calculator for updates
  const calculateState = useCallback(
    (now: Date): StreamingCounterState => {
      return computeStreamState(
        now,
        totalAmount,
        startTime,
        endTime,
        cliffTime,
        withdrawnAmount,
        curveType,
        isPaused
      );
    },
    [totalAmount, startTime, endTime, cliffTime, withdrawnAmount, curveType, isPaused]
  );

  useEffect(() => {
    if (isPaused) return;

    const tick = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= updateInterval) {
        lastUpdateRef.current = now;
        setState(calculateState(new Date(now)));
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [calculateState, isPaused, updateInterval]);

  return state;
}

export default useStreamingCounter;
