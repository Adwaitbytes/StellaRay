/**
 * Create Payment Link Page
 *
 * Allows authenticated users to create shareable payment links.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Link2,
  ArrowLeft,
  Loader,
  Check,
  AlertCircle,
  Zap,
  Calendar,
  FileText,
  Hash,
  Wallet,
} from 'lucide-react';
import { useZkWallet } from '@/hooks/useZkWallet';
import { PaymentLinkQR } from '@/components/PaymentLinkQR';
import { isValidAddress, getCurrentNetwork } from '@/lib/stellar';

interface CreatedLink {
  id: string;
  url: string;
  recipientAddress: string;
  amount: string | null;
  asset: string;
  memo: string | null;
  description: string | null;
  expiresAt: string | null;
  network: string;
}

export default function CreatePaymentLinkPage() {
  const { status } = useSession();
  const router = useRouter();
  const zkWallet = useZkWallet();

  const [isDark] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [description, setDescription] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>(''); // '', '1h', '24h', '7d', '30d'
  const [customAddress, setCustomAddress] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const getExpirationDate = (option: string): string | null => {
    if (!option) return null;

    const now = new Date();
    switch (option) {
      case '1h':
        now.setHours(now.getHours() + 1);
        break;
      case '24h':
        now.setHours(now.getHours() + 24);
        break;
      case '7d':
        now.setDate(now.getDate() + 7);
        break;
      case '30d':
        now.setDate(now.getDate() + 30);
        break;
      default:
        return null;
    }
    return now.toISOString();
  };

  const handleCreate = async () => {
    setError(null);

    const recipientAddress = useCustomAddress ? customAddress : zkWallet.address;

    if (!recipientAddress) {
      setError('No recipient address. Please wait for wallet to load or enter a custom address.');
      return;
    }

    if (useCustomAddress && !isValidAddress(customAddress)) {
      setError('Invalid Stellar address format');
      return;
    }

    if (amount && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
      setError('Amount must be a positive number');
      return;
    }

    if (memo && memo.length > 28) {
      setError('Memo must be 28 characters or less');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAddress,
          amount: amount || null,
          asset: 'XLM',
          memo: memo || null,
          description: description || null,
          expiresAt: getExpirationDate(expiresIn),
          network: getCurrentNetwork(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment link');
      }

      setCreatedLink(data.paymentLink);
    } catch (err: any) {
      setError(err.message || 'Failed to create payment link');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setCreatedLink(null);
    setAmount('');
    setMemo('');
    setDescription('');
    setExpiresIn('');
    setCustomAddress('');
    setUseCustomAddress(false);
    setError(null);
  };

  if (status === 'loading' || zkWallet.isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#0066FF] animate-spin" />
      </div>
    );
  }

  // Success state - show the created link
  if (createdLink) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-md mx-auto pt-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00FF88] mb-4">
              <Check className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-black mb-2">LINK CREATED!</h1>
            <p className="text-white/60">Share this link to receive payment</p>
          </div>

          {/* Payment Details */}
          <div className="border-4 border-[#00FF88] mb-6">
            <div className="px-4 py-3 bg-[#00FF88]">
              <span className="font-black text-black text-sm">PAYMENT REQUEST</span>
            </div>
            <div className="p-4 space-y-3">
              {createdLink.amount && (
                <div className="flex justify-between">
                  <span className="text-white/50 text-sm">Amount</span>
                  <span className="font-black text-[#00FF88]">
                    {createdLink.amount} {createdLink.asset}
                  </span>
                </div>
              )}
              {!createdLink.amount && (
                <div className="flex justify-between">
                  <span className="text-white/50 text-sm">Amount</span>
                  <span className="font-bold text-white/70">Any amount</span>
                </div>
              )}
              {createdLink.memo && (
                <div className="flex justify-between">
                  <span className="text-white/50 text-sm">Memo</span>
                  <span className="font-mono text-xs">{createdLink.memo}</span>
                </div>
              )}
              {createdLink.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-white/50 text-sm">Expires</span>
                  <span className="text-xs">
                    {new Date(createdLink.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Network</span>
                <span className={`text-xs font-bold ${
                  createdLink.network === 'mainnet' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {createdLink.network.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="border-4 border-white p-4 mb-6">
            <PaymentLinkQR
              url={createdLink.url}
              recipientAddress={createdLink.recipientAddress}
              amount={createdLink.amount}
              asset={createdLink.asset}
              isDark={true}
              size={180}
              showActions={true}
            />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={resetForm}
              className="w-full py-4 border-4 border-[#0066FF] text-[#0066FF] font-black hover:bg-[#0066FF] hover:text-white transition-colors"
            >
              CREATE ANOTHER LINK
            </button>
            <button
              onClick={() => router.push('/pay/history')}
              className="w-full py-3 border-2 border-white/30 text-white/60 font-bold hover:border-white/60 transition-colors"
            >
              VIEW ALL LINKS
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 text-white/40 font-bold hover:text-white/60 transition-colors"
            >
              BACK TO DASHBOARD
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:border-white/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black">CREATE PAYMENT LINK</h1>
            <p className="text-white/60 text-sm">Generate a shareable link to receive payments</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Recipient Address */}
          <div className="border-4 border-white/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-[#0066FF]" />
              <span className="font-black text-sm">RECIPIENT ADDRESS</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setUseCustomAddress(false)}
                className={`flex-1 py-2 text-xs font-bold border-2 transition-colors ${
                  !useCustomAddress
                    ? 'bg-[#0066FF] text-white border-[#0066FF]'
                    : 'border-white/30 text-white/60 hover:border-white/60'
                }`}
              >
                MY WALLET
              </button>
              <button
                onClick={() => setUseCustomAddress(true)}
                className={`flex-1 py-2 text-xs font-bold border-2 transition-colors ${
                  useCustomAddress
                    ? 'bg-[#0066FF] text-white border-[#0066FF]'
                    : 'border-white/30 text-white/60 hover:border-white/60'
                }`}
              >
                CUSTOM ADDRESS
              </button>
            </div>

            {useCustomAddress ? (
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="G..."
                className="w-full bg-black border-2 border-white/30 px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#0066FF]"
              />
            ) : (
              <div className="px-4 py-3 bg-white/5 border-2 border-white/10">
                <code className="text-xs text-[#0066FF] break-all">
                  {zkWallet.address || 'Loading...'}
                </code>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="border-4 border-white/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-[#00FF88]" />
              <span className="font-black text-sm">AMOUNT (OPTIONAL)</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.0000001"
                min="0"
                className="w-full bg-black border-2 border-white/30 px-4 py-3 text-xl font-black focus:outline-none focus:border-[#0066FF] placeholder:text-white/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">
                XLM
              </span>
            </div>
            <p className="text-white/30 text-xs mt-2">
              Leave empty to allow any amount
            </p>
          </div>

          {/* Memo */}
          <div className="border-4 border-white/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#00D4FF]" />
                <span className="font-black text-sm">MEMO (OPTIONAL)</span>
              </div>
              <span className="text-white/30 text-xs">{memo.length}/28</span>
            </div>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value.slice(0, 28))}
              placeholder="e.g., Invoice #123"
              maxLength={28}
              className="w-full bg-black border-2 border-white/30 px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#0066FF] placeholder:text-white/20"
            />
          </div>

          {/* Description */}
          <div className="border-4 border-white/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-white/50" />
              <span className="font-black text-sm">DESCRIPTION (OPTIONAL)</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="What is this payment for?"
              maxLength={500}
              rows={2}
              className="w-full bg-black border-2 border-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#0066FF] placeholder:text-white/20 resize-none"
            />
          </div>

          {/* Expiration */}
          <div className="border-4 border-white/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-yellow-400" />
              <span className="font-black text-sm">EXPIRES (OPTIONAL)</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: '', label: 'Never' },
                { value: '1h', label: '1 Hour' },
                { value: '24h', label: '24 Hours' },
                { value: '7d', label: '7 Days' },
                { value: '30d', label: '30 Days' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setExpiresIn(option.value)}
                  className={`py-2 text-[10px] font-bold border-2 transition-colors ${
                    expiresIn === option.value
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'border-white/30 text-white/60 hover:border-white/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 border-4 border-red-500/50 bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={isCreating || (!zkWallet.address && !useCustomAddress)}
            className="group relative w-full disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-[#0066FF] translate-x-1 translate-y-1" />
            <div className="relative flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-black border-4 border-[#0066FF] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform">
              {isCreating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  CREATING...
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  CREATE PAYMENT LINK
                </>
              )}
            </div>
          </button>

          {/* Network Badge */}
          <div className="flex justify-center">
            <div
              className={`px-3 py-1 text-xs font-bold ${
                getCurrentNetwork() === 'mainnet'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}
            >
              {getCurrentNetwork().toUpperCase()} NETWORK
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
