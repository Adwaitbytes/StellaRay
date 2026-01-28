/**
 * Payment Link View/Pay Page
 *
 * Public page for viewing and paying a payment link.
 */

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Loader,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useZkWallet } from '@/hooks/useZkWallet';
import { formatAmount, getTimeUntilExpiration } from '@/lib/paymentLinkUtils';

interface PaymentLinkData {
  id: string;
  recipientAddress: string;
  amount: string | null;
  asset: string;
  memo: string | null;
  description: string | null;
  expiresAt: string | null;
  status: 'active' | 'paid' | 'expired' | 'cancelled';
  paymentTxHash: string | null;
  paidAt: string | null;
  paidAmount: string | null;
  network: string;
  url: string;
  stellarUri: string;
  createdAt: string;
}

export default function PaymentLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const zkWallet = useZkWallet();

  const [link, setLink] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'address' | 'memo' | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentLink();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (link?.amount) {
      setPaymentAmount(link.amount);
    }
  }, [link?.amount]);

  const fetchPaymentLink = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/pay/${resolvedParams.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payment link');
      }

      setLink(data.paymentLink);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'address' | 'memo') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePayWithWallet = async () => {
    if (!link || !zkWallet.address) return;

    const amount = link.amount || paymentAmount;
    if (!amount || parseFloat(amount) <= 0) {
      setPaymentError('Please enter a valid amount');
      return;
    }

    setIsPaying(true);
    setPaymentError(null);

    try {
      const result = await zkWallet.send(
        link.recipientAddress,
        amount,
        link.memo || undefined
      );

      // Mark the link as paid
      await fetch(`/api/pay/${link.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: result.hash,
          paidAmount: amount,
          paidBy: zkWallet.address,
        }),
      });

      setPaymentSuccess(true);
      fetchPaymentLink(); // Refresh the link data
    } catch (err: any) {
      setPaymentError(err.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  const openInWallet = () => {
    if (!link) return;
    window.location.href = link.stellarUri;
  };

  const openInLobstr = () => {
    if (!link) return;
    const amount = link.amount || paymentAmount;
    let url = `https://lobstr.co/send?destination=${link.recipientAddress}`;
    if (amount) url += `&amount=${amount}`;
    if (link.memo) url += `&memo=${encodeURIComponent(link.memo)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#0066FF] animate-spin" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">LINK NOT FOUND</h1>
          <p className="text-white/60 mb-6">{error || 'This payment link does not exist or has been removed.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-[#0066FF] text-white font-black hover:bg-[#0055DD] transition-colors"
          >
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  // Link is paid
  if (link.status === 'paid') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#00FF88] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">PAYMENT COMPLETE</h1>
            <p className="text-white/60">This payment request has been fulfilled</p>
          </div>

          <div className="border-4 border-[#00FF88] p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-white/50">Amount Paid</span>
              <span className="font-black text-[#00FF88]">
                {link.paidAmount} {link.asset}
              </span>
            </div>
            {link.paidAt && (
              <div className="flex justify-between">
                <span className="text-white/50">Paid At</span>
                <span className="text-white text-sm">
                  {new Date(link.paidAt).toLocaleString()}
                </span>
              </div>
            )}
            {link.paymentTxHash && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-white/50 text-xs mb-2">Transaction Hash</p>
                <code className="text-[#0066FF] text-xs break-all">{link.paymentTxHash}</code>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full mt-6 py-4 border-4 border-white/30 text-white font-black hover:border-white/60 transition-colors"
          >
            CREATE YOUR OWN WALLET
          </button>
        </div>
      </div>
    );
  }

  // Link is expired or cancelled
  if (link.status === 'expired' || link.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">
            {link.status === 'expired' ? 'LINK EXPIRED' : 'LINK CANCELLED'}
          </h1>
          <p className="text-white/60 mb-6">
            {link.status === 'expired'
              ? 'This payment link has expired and is no longer valid.'
              : 'This payment link has been cancelled by the creator.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-[#0066FF] text-white font-black hover:bg-[#0055DD] transition-colors"
          >
            CREATE YOUR OWN WALLET
          </button>
        </div>
      </div>
    );
  }

  // Payment success state
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#00FF88] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">PAYMENT SENT!</h1>
          <p className="text-white/60 mb-6">Your payment has been successfully sent.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 bg-[#0066FF] text-white font-black hover:bg-[#0055DD] transition-colors"
          >
            BACK TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  // Active link - show payment form
  const timeLeft = getTimeUntilExpiration(link.expiresAt);
  const isLoggedIn = sessionStatus === 'authenticated' && zkWallet.address;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF]/10 border border-[#0066FF]/30 mb-4">
            <Zap className="w-4 h-4 text-[#0066FF]" />
            <span className="text-[#0066FF] font-bold text-sm">STELLARAY</span>
          </div>
          <h1 className="text-2xl font-black mb-2">PAYMENT REQUEST</h1>
          {link.description && (
            <p className="text-white/60">{link.description}</p>
          )}
        </div>

        {/* Payment Card */}
        <div className="border-4 border-white">
          {/* Amount Section */}
          <div className="p-6 border-b-4 border-white/20">
            {link.amount ? (
              <div className="text-center">
                <p className="text-white/50 text-sm mb-1">AMOUNT REQUESTED</p>
                <p className="text-4xl font-black text-[#00FF88]">
                  {link.amount} <span className="text-xl">{link.asset}</span>
                </p>
              </div>
            ) : (
              <div>
                <p className="text-white/50 text-sm mb-2">ENTER AMOUNT</p>
                <div className="relative">
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.0000001"
                    min="0"
                    className="w-full bg-black border-2 border-white/30 px-4 py-4 text-2xl font-black focus:outline-none focus:border-[#0066FF] placeholder:text-white/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">
                    {link.asset}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Recipient */}
          <div className="p-6 border-b-4 border-white/20">
            <p className="text-white/50 text-sm font-bold mb-2">PAY TO</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0066FF] flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm truncate">{link.recipientAddress}</p>
                <p className="text-white/40 text-xs">{link.network.toUpperCase()} Network</p>
              </div>
              <button
                onClick={() => copyToClipboard(link.recipientAddress, 'address')}
                className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                {copied === 'address' ? (
                  <Check className="w-4 h-4 text-[#00FF88]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Memo */}
          {link.memo && (
            <div className="p-6 border-b-4 border-white/20">
              <p className="text-white/50 text-sm font-bold mb-2">MEMO (REQUIRED)</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 font-mono text-[#00D4FF] bg-white/5 px-3 py-2">
                  {link.memo}
                </code>
                <button
                  onClick={() => copyToClipboard(link.memo!, 'memo')}
                  className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  {copied === 'memo' ? (
                    <Check className="w-4 h-4 text-[#00FF88]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Expiration */}
          {timeLeft && (
            <div className="px-6 py-3 bg-yellow-500/10 border-b-4 border-white/20 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-bold">Expires in {timeLeft}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            {/* If logged in with Stellaray */}
            {isLoggedIn && (
              <>
                <button
                  onClick={handlePayWithWallet}
                  disabled={isPaying || (!link.amount && !paymentAmount)}
                  className="group relative w-full disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-[#00FF88] translate-x-1 translate-y-1" />
                  <div className="relative flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-black border-4 border-[#00FF88] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform">
                    {isPaying ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        SENDING...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        PAY WITH STELLARAY
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </div>
                </button>

                {paymentError && (
                  <div className="p-3 border-2 border-red-500/50 bg-red-500/10">
                    <p className="text-red-400 text-sm text-center">{paymentError}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-white/20" />
                  <span className="text-white/40 text-xs">OR</span>
                  <div className="flex-1 h-px bg-white/20" />
                </div>
              </>
            )}

            {/* External wallet options */}
            <button
              onClick={openInWallet}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 border-4 border-[#0066FF] text-white font-black hover:bg-[#0066FF]/10 transition-colors"
            >
              <Wallet className="w-5 h-5" />
              OPEN IN WALLET APP
            </button>

            <button
              onClick={openInLobstr}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-white/30 text-white/80 font-bold hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              OPEN IN LOBSTR
            </button>

            {/* QR Code */}
            <div className="pt-4">
              <p className="text-white/40 text-xs text-center mb-3">
                Or scan with your Stellar wallet app
              </p>
              <div className="flex justify-center">
                <div className="p-4 bg-white">
                  <QRCodeSVG
                    value={link.stellarUri}
                    size={150}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create account CTA */}
        {!isLoggedIn && (
          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm mb-3">Don't have a Stellar wallet?</p>
            <button
              onClick={() => router.push('/')}
              className="text-[#0066FF] font-bold hover:underline"
            >
              Create one with Google Sign-In
            </button>
          </div>
        )}

        {/* Network Badge */}
        <div className="mt-6 flex justify-center">
          <div
            className={`px-3 py-1 text-xs font-bold ${
              link.network === 'mainnet'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            {link.network.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
