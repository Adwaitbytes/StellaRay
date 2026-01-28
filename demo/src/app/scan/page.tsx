/**
 * Scan and Pay Page
 *
 * Scan QR codes to make payments directly from the app.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader,
  Wallet,
  Zap,
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Camera,
  ArrowRight,
  X,
} from 'lucide-react';
import { useZkWallet } from '@/hooks/useZkWallet';
import { QRScanner, ParsedPaymentData, parseQRData } from '@/components/QRScanner';
import { getCurrentNetwork, isValidAddress } from '@/lib/stellar';

interface PaymentLinkData {
  id: string;
  recipientAddress: string;
  amount: string | null;
  asset: string;
  memo: string | null;
  description: string | null;
  status: string;
  network: string;
}

export default function ScanPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const zkWallet = useZkWallet();

  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<ParsedPaymentData | null>(null);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/');
    }
  }, [sessionStatus, router]);

  // Fetch payment link details if scanned a payment link
  useEffect(() => {
    if (scannedData?.type === 'payment_link' && scannedData.paymentLinkId) {
      fetchPaymentLink(scannedData.paymentLinkId);
    }
  }, [scannedData]);

  // Pre-fill form from scanned data
  useEffect(() => {
    if (scannedData) {
      if (scannedData.amount) {
        setPaymentAmount(scannedData.amount);
      }
      if (scannedData.memo) {
        setPaymentMemo(scannedData.memo);
      }
    }
  }, [scannedData]);

  // Pre-fill from payment link
  useEffect(() => {
    if (paymentLink) {
      if (paymentLink.amount) {
        setPaymentAmount(paymentLink.amount);
      }
      if (paymentLink.memo) {
        setPaymentMemo(paymentLink.memo);
      }
    }
  }, [paymentLink]);

  const fetchPaymentLink = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pay/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payment link');
      }

      if (data.paymentLink.status !== 'active') {
        throw new Error(`This payment link is ${data.paymentLink.status}`);
      }

      setPaymentLink(data.paymentLink);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment link');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (data: ParsedPaymentData) => {
    setScannedData(data);
    setIsScanning(false);
    setError(null);
    setPaymentError(null);

    // Validate the scanned data
    if (data.type === 'unknown') {
      setError('Unrecognized QR code format');
    } else if (data.type === 'address' && !isValidAddress(data.destination!)) {
      setError('Invalid Stellar address');
    }
  };

  const handlePay = async () => {
    if (!zkWallet.address) {
      setPaymentError('Wallet not ready');
      return;
    }

    const destination = paymentLink?.recipientAddress || scannedData?.destination;
    if (!destination) {
      setPaymentError('No destination address');
      return;
    }

    const amount = paymentAmount || paymentLink?.amount || scannedData?.amount;
    if (!amount || parseFloat(amount) <= 0) {
      setPaymentError('Please enter a valid amount');
      return;
    }

    setIsPaying(true);
    setPaymentError(null);

    try {
      const result = await zkWallet.send(
        destination,
        amount,
        paymentMemo || paymentLink?.memo || scannedData?.memo || undefined
      );

      // If this was a payment link, mark it as paid
      if (paymentLink) {
        await fetch(`/api/pay/${paymentLink.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: result.hash,
            paidAmount: amount,
            paidBy: zkWallet.address,
          }),
        });
      }

      setPaymentSuccess(true);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  const resetScan = () => {
    setScannedData(null);
    setPaymentLink(null);
    setIsScanning(true);
    setError(null);
    setPaymentAmount('');
    setPaymentMemo('');
    setPaymentError(null);
    setPaymentSuccess(false);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDestination = () => {
    return paymentLink?.recipientAddress || scannedData?.destination;
  };

  const getAsset = () => {
    return paymentLink?.asset || scannedData?.asset || 'XLM';
  };

  if (sessionStatus === 'loading' || zkWallet.isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#0066FF] animate-spin" />
      </div>
    );
  }

  // Payment success screen
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#00FF88] flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">PAYMENT SENT!</h1>
          <p className="text-white/60 mb-8">
            {paymentAmount} {getAsset()} sent successfully
          </p>

          <div className="space-y-3">
            <button
              onClick={resetScan}
              className="w-full py-4 bg-[#0066FF] text-white font-black hover:bg-[#0055DD] transition-colors"
            >
              SCAN ANOTHER
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 border-2 border-white/30 text-white font-bold hover:border-white/60 transition-colors"
            >
              BACK TO DASHBOARD
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Scanner view
  if (isScanning) {
    return (
      <QRScanner
        isOpen={true}
        onScan={handleScan}
        onClose={() => router.push('/dashboard')}
      />
    );
  }

  // Payment form view
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={resetScan}
            className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:border-white/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black">SCAN & PAY</h1>
            <p className="text-white/60 text-sm">Review and confirm payment</p>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="border-4 border-red-500/50 bg-red-500/10 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span className="font-black text-red-400">ERROR</span>
            </div>
            <p className="text-white/70 mb-4">{error}</p>
            <button
              onClick={resetScan}
              className="w-full py-3 bg-red-500/20 border-2 border-red-500/50 text-red-400 font-bold hover:bg-red-500/30 transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Loading payment link */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-[#0066FF] animate-spin" />
          </div>
        )}

        {/* Payment details */}
        {!error && !loading && (scannedData || paymentLink) && (
          <>
            {/* Scanned type badge */}
            <div className="flex justify-center mb-6">
              <div
                className={`px-4 py-2 border-2 ${
                  scannedData?.type === 'payment_link'
                    ? 'border-[#00FF88]/50 bg-[#00FF88]/10 text-[#00FF88]'
                    : scannedData?.type === 'stellar_uri'
                    ? 'border-[#0066FF]/50 bg-[#0066FF]/10 text-[#0066FF]'
                    : 'border-[#00D4FF]/50 bg-[#00D4FF]/10 text-[#00D4FF]'
                } font-black text-sm`}
              >
                {scannedData?.type === 'payment_link'
                  ? 'PAYMENT LINK'
                  : scannedData?.type === 'stellar_uri'
                  ? 'STELLAR URI'
                  : 'WALLET ADDRESS'}
              </div>
            </div>

            {/* Payment Link description */}
            {paymentLink?.description && (
              <div className="text-center mb-6">
                <p className="text-white/70">{paymentLink.description}</p>
              </div>
            )}

            {/* Payment Card */}
            <div className="border-4 border-white mb-6">
              {/* Recipient */}
              <div className="p-6 border-b-4 border-white/20">
                <p className="text-white/50 text-sm font-bold mb-2">PAY TO</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0066FF] flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">{getDestination()}</p>
                    <p className="text-white/40 text-xs">{getCurrentNetwork().toUpperCase()} Network</p>
                  </div>
                  <button
                    onClick={() => copyAddress(getDestination()!)}
                    className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#00FF88]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="p-6 border-b-4 border-white/20">
                <p className="text-white/50 text-sm font-bold mb-2">
                  {(paymentLink?.amount || scannedData?.amount) ? 'AMOUNT' : 'ENTER AMOUNT'}
                </p>
                {(paymentLink?.amount || scannedData?.amount) ? (
                  <div className="text-center">
                    <p className="text-4xl font-black text-[#00FF88]">
                      {paymentLink?.amount || scannedData?.amount}{' '}
                      <span className="text-xl">{getAsset()}</span>
                    </p>
                  </div>
                ) : (
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
                      {getAsset()}
                    </span>
                  </div>
                )}

                {/* Balance check */}
                {zkWallet.balances && (
                  <p className="text-white/40 text-sm mt-2">
                    Available: {zkWallet.balances.find(b => b.asset === 'XLM')?.balance || '0'} XLM
                  </p>
                )}
              </div>

              {/* Memo */}
              {(paymentLink?.memo || scannedData?.memo) ? (
                <div className="p-6 border-b-4 border-white/20">
                  <p className="text-white/50 text-sm font-bold mb-2">MEMO</p>
                  <code className="text-[#00D4FF] bg-white/5 px-3 py-2 block">
                    {paymentLink?.memo || scannedData?.memo}
                  </code>
                </div>
              ) : (
                <div className="p-6 border-b-4 border-white/20">
                  <p className="text-white/50 text-sm font-bold mb-2">MEMO (OPTIONAL)</p>
                  <input
                    type="text"
                    value={paymentMemo}
                    onChange={(e) => setPaymentMemo(e.target.value)}
                    placeholder="Add a note..."
                    maxLength={28}
                    className="w-full bg-black border-2 border-white/30 px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#0066FF] placeholder:text-white/20"
                  />
                </div>
              )}

              {/* Pay Button */}
              <div className="p-6">
                {paymentError && (
                  <div className="mb-4 p-3 border-2 border-red-500/50 bg-red-500/10">
                    <p className="text-red-400 text-sm text-center">{paymentError}</p>
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={isPaying || !paymentAmount && !paymentLink?.amount && !scannedData?.amount}
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
                        PAY NOW
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Scan another button */}
            <button
              onClick={resetScan}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-white/30 text-white/60 font-bold hover:border-white/60 transition-colors"
            >
              <Camera className="w-5 h-5" />
              SCAN ANOTHER CODE
            </button>
          </>
        )}

        {/* Network Badge */}
        <div className="mt-6 flex justify-center">
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
  );
}
