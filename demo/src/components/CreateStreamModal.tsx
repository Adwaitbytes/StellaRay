/**
 * CreateStreamModal Component
 *
 * Modal for creating new payment streams with customizable curves.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  X,
  Zap,
  Clock,
  TrendingUp,
  ArrowRight,
  Info,
  Check,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { isValidAddress } from '@/lib/stellar';

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StreamFormData) => Promise<void>;
  senderAddress: string;
  senderBalance: number;
  network: string;
}

export interface StreamFormData {
  recipientAddress: string;
  recipientEmail?: string;
  totalAmount: string;
  durationValue: number;
  durationUnit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  cliffValue?: number;
  cliffUnit?: 'minutes' | 'hours' | 'days' | 'weeks';
  curveType: 'linear' | 'cliff' | 'exponential' | 'steps';
  title?: string;
  description?: string;
  memo?: string;
  startImmediately: boolean;
  scheduledStart?: string;
}

const durationMultipliers: Record<string, number> = {
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  months: 2592000,
};

export function CreateStreamModal({
  isOpen,
  onClose,
  onSubmit,
  senderAddress,
  senderBalance,
  network,
}: CreateStreamModalProps) {
  const [form, setForm] = useState<StreamFormData>({
    recipientAddress: '',
    totalAmount: '',
    durationValue: 1,
    durationUnit: 'hours',
    curveType: 'linear',
    startImmediately: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate derived values
  const calculations = useMemo(() => {
    const totalAmount = parseFloat(form.totalAmount) || 0;
    const durationSeconds = form.durationValue * (durationMultipliers[form.durationUnit] || 3600);
    const flowRatePerSecond = durationSeconds > 0 ? totalAmount / durationSeconds : 0;

    let flowRateDisplay = '';
    if (flowRatePerSecond < 0.000001) {
      flowRateDisplay = `${(flowRatePerSecond * 86400).toFixed(7)} XLM/day`;
    } else if (flowRatePerSecond < 0.001) {
      flowRateDisplay = `${(flowRatePerSecond * 3600).toFixed(7)} XLM/hr`;
    } else if (flowRatePerSecond < 1) {
      flowRateDisplay = `${(flowRatePerSecond * 60).toFixed(7)} XLM/min`;
    } else {
      flowRateDisplay = `${flowRatePerSecond.toFixed(7)} XLM/sec`;
    }

    const cliffSeconds = form.cliffValue
      ? form.cliffValue * (durationMultipliers[form.cliffUnit || 'hours'] || 3600)
      : 0;

    return {
      totalAmount,
      durationSeconds,
      flowRatePerSecond,
      flowRateDisplay,
      cliffSeconds,
      hasInsufficientBalance: totalAmount > senderBalance,
    };
  }, [form, senderBalance]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.recipientAddress) {
      newErrors.recipientAddress = 'Recipient address is required';
    } else if (!isValidAddress(form.recipientAddress)) {
      newErrors.recipientAddress = 'Invalid Stellar address';
    } else if (form.recipientAddress === senderAddress) {
      newErrors.recipientAddress = 'Cannot stream to yourself';
    }

    if (!form.totalAmount || parseFloat(form.totalAmount) <= 0) {
      newErrors.totalAmount = 'Amount must be greater than 0';
    } else if (calculations.hasInsufficientBalance) {
      newErrors.totalAmount = `Insufficient balance. Available: ${senderBalance.toFixed(2)} XLM`;
    }

    if (form.durationValue <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    if (calculations.durationSeconds < 60) {
      newErrors.duration = 'Minimum duration is 1 minute';
    }

    if (calculations.cliffSeconds >= calculations.durationSeconds) {
      newErrors.cliff = 'Cliff must be less than total duration';
    }

    if (form.memo && form.memo.length > 28) {
      newErrors.memo = 'Memo must be 28 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to create stream' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const curveDescriptions: Record<string, string> = {
    linear: 'Tokens stream at a constant rate over time',
    cliff: 'Nothing released until cliff, then linear streaming',
    exponential: 'Slow start, accelerating over time (quadratic)',
    steps: '10 discrete unlock periods (10% each)',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-4 border-white">
        {/* Header */}
        <div className="sticky top-0 bg-black border-b-4 border-white p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-black text-white">CREATE STREAM</h2>
            <p className="text-white/60 text-sm">Set up a continuous payment flow</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:border-white/60 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Recipient */}
          <div>
            <label className="block text-white/60 text-sm font-bold mb-2">
              RECIPIENT ADDRESS *
            </label>
            <input
              type="text"
              value={form.recipientAddress}
              onChange={(e) => setForm({ ...form, recipientAddress: e.target.value })}
              placeholder="G..."
              className={`w-full bg-black border-2 ${
                errors.recipientAddress ? 'border-red-500' : 'border-white/30 focus:border-[#0066FF]'
              } px-4 py-3 font-mono text-white placeholder:text-white/20 focus:outline-none`}
            />
            {errors.recipientAddress && (
              <p className="text-red-400 text-sm mt-1">{errors.recipientAddress}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-white/60 text-sm font-bold mb-2">
              TOTAL AMOUNT *
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                placeholder="0.00"
                step="0.0000001"
                min="0"
                className={`w-full bg-black border-2 ${
                  errors.totalAmount ? 'border-red-500' : 'border-white/30 focus:border-[#0066FF]'
                } px-4 py-3 pr-16 text-xl font-black text-white placeholder:text-white/20 focus:outline-none`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">
                XLM
              </span>
            </div>
            <p className="text-white/40 text-sm mt-1">
              Available: {senderBalance.toFixed(4)} XLM
            </p>
            {errors.totalAmount && (
              <p className="text-red-400 text-sm mt-1">{errors.totalAmount}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-white/60 text-sm font-bold mb-2">
              STREAM DURATION *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={form.durationValue}
                onChange={(e) => setForm({ ...form, durationValue: parseInt(e.target.value) || 0 })}
                min="1"
                className={`flex-1 bg-black border-2 ${
                  errors.duration ? 'border-red-500' : 'border-white/30 focus:border-[#0066FF]'
                } px-4 py-3 text-white focus:outline-none`}
              />
              <select
                value={form.durationUnit}
                onChange={(e) => setForm({ ...form, durationUnit: e.target.value as any })}
                className="bg-black border-2 border-white/30 px-4 py-3 text-white focus:outline-none focus:border-[#0066FF] appearance-none cursor-pointer"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
            {errors.duration && (
              <p className="text-red-400 text-sm mt-1">{errors.duration}</p>
            )}
          </div>

          {/* Streaming Curve */}
          <div>
            <label className="block text-white/60 text-sm font-bold mb-2">
              STREAMING CURVE
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['linear', 'cliff', 'exponential', 'steps'] as const).map((curve) => (
                <button
                  key={curve}
                  type="button"
                  onClick={() => setForm({ ...form, curveType: curve })}
                  className={`p-3 border-2 text-left transition-colors ${
                    form.curveType === curve
                      ? 'border-[#0066FF] bg-[#0066FF]/10'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {form.curveType === curve && <Check className="w-4 h-4 text-[#0066FF]" />}
                    <span className="font-bold text-white">{curve.toUpperCase()}</span>
                  </div>
                  <p className="text-white/40 text-xs mt-1">{curveDescriptions[curve]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cliff Period (only show if cliff or custom curves) */}
          {(form.curveType === 'cliff' || form.curveType === 'exponential') && (
            <div>
              <label className="block text-white/60 text-sm font-bold mb-2">
                CLIFF PERIOD (OPTIONAL)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.cliffValue || ''}
                  onChange={(e) => setForm({ ...form, cliffValue: parseInt(e.target.value) || undefined })}
                  placeholder="0"
                  min="0"
                  className={`flex-1 bg-black border-2 ${
                    errors.cliff ? 'border-red-500' : 'border-white/30 focus:border-[#0066FF]'
                  } px-4 py-3 text-white placeholder:text-white/20 focus:outline-none`}
                />
                <select
                  value={form.cliffUnit || 'hours'}
                  onChange={(e) => setForm({ ...form, cliffUnit: e.target.value as any })}
                  className="bg-black border-2 border-white/30 px-4 py-3 text-white focus:outline-none focus:border-[#0066FF] appearance-none cursor-pointer"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
              <p className="text-white/40 text-xs mt-1">
                No tokens released until cliff period ends
              </p>
              {errors.cliff && (
                <p className="text-red-400 text-sm mt-1">{errors.cliff}</p>
              )}
            </div>
          )}

          {/* Title & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-sm font-bold mb-2">
                TITLE (OPTIONAL)
              </label>
              <input
                type="text"
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Salary Stream"
                maxLength={100}
                className="w-full bg-black border-2 border-white/30 px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#0066FF]"
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm font-bold mb-2">
                MEMO (OPTIONAL)
              </label>
              <input
                type="text"
                value={form.memo || ''}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="On-chain memo"
                maxLength={28}
                className={`w-full bg-black border-2 ${
                  errors.memo ? 'border-red-500' : 'border-white/30 focus:border-[#0066FF]'
                } px-4 py-3 text-white placeholder:text-white/20 focus:outline-none`}
              />
              {errors.memo && (
                <p className="text-red-400 text-sm mt-1">{errors.memo}</p>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white/5 border-2 border-white/10 p-4">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00FF88]" />
              STREAM PREVIEW
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-white/40 text-xs mb-1">TOTAL</p>
                <p className="text-xl font-black text-white">
                  {calculations.totalAmount.toFixed(2)} XLM
                </p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">FLOW RATE</p>
                <p className="text-xl font-black text-[#00FF88]">
                  {calculations.flowRateDisplay}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">DURATION</p>
                <p className="text-xl font-black text-[#0066FF]">
                  {form.durationValue} {form.durationUnit}
                </p>
              </div>
            </div>

            {/* Visual flow preview */}
            <div className="mt-4 flex items-center justify-center gap-4 py-4">
              <div className="text-center">
                <p className="text-white/40 text-xs">YOU</p>
                <p className="font-mono text-sm text-white">
                  {senderAddress.slice(0, 4)}...
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-0.5 bg-gradient-to-r from-[#0066FF] to-[#00FF88]" />
                <Zap className="w-5 h-5 text-[#00FF88] animate-pulse" />
                <div className="w-16 h-0.5 bg-gradient-to-r from-[#00FF88] to-[#0066FF]" />
              </div>
              <div className="text-center">
                <p className="text-white/40 text-xs">RECIPIENT</p>
                <p className="font-mono text-sm text-white">
                  {form.recipientAddress ? `${form.recipientAddress.slice(0, 4)}...` : '???'}
                </p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="bg-red-500/10 border-2 border-red-500/50 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || calculations.hasInsufficientBalance}
            className="group relative w-full disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-[#00FF88] translate-x-1 translate-y-1" />
            <div className="relative flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-black border-4 border-[#00FF88] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform">
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  CREATING STREAM...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  START STREAMING
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </div>
          </button>

          {/* Info */}
          <div className="flex items-start gap-2 text-white/40 text-xs">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Streams begin immediately. The recipient can withdraw available funds at any time.
              You can cancel the stream to stop future payments (already streamed amount is kept by recipient).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateStreamModal;
