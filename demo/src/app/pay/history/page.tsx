/**
 * Payment Links History Page
 *
 * Lists all payment links created by the user with stats and management options.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader,
  Link2,
  Plus,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { getCurrentNetwork } from '@/lib/stellar';

interface PaymentLink {
  id: string;
  url: string;
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
  paidBy: string | null;
  network: string;
  createdAt: string;
  viewCount: number;
}

interface Stats {
  total: number;
  active: number;
  paid: number;
  expired: number;
  totalAmountReceived: string;
}

export default function PaymentHistoryPage() {
  const { status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paid' | 'expired'>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch payment links
  const fetchLinks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const network = getCurrentNetwork();
      const response = await fetch(`/api/pay/history?network=${network}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment links');
      }

      setPaymentLinks(data.paymentLinks || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment links');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLinks();
    }
  }, [status]);

  const copyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const cancelLink = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this payment link?')) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/pay/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel link');
      }

      // Refresh the list
      await fetchLinks();
    } catch (err) {
      console.error('Failed to cancel link:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getExpiryInfo = (expiresAt: string | null) => {
    if (!expiresAt) return null;

    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return { text: 'Expired', isExpired: true };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) return { text: `${hours}h left`, isExpired: false };
    return { text: `${days}d left`, isExpired: false };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-[#0066FF]" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-[#00FF88]" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-[#0066FF] border-[#0066FF]/30';
      case 'paid':
        return 'text-[#00FF88] border-[#00FF88]/30';
      case 'expired':
        return 'text-yellow-400 border-yellow-400/30';
      case 'cancelled':
        return 'text-red-400 border-red-400/30';
      default:
        return 'text-white/50 border-white/30';
    }
  };

  const filteredLinks = paymentLinks.filter((link) => {
    if (filter === 'all') return true;
    return link.status === filter;
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#0066FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:border-white/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black">PAYMENT LINKS</h1>
            <p className="text-white/60 text-sm">Manage your payment links</p>
          </div>
          <button
            onClick={() => router.push('/pay/create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#0066FF] text-white font-black hover:bg-[#0055CC] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">NEW LINK</span>
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="border-4 border-white/20 p-4">
              <p className="text-white/40 text-xs font-bold">TOTAL</p>
              <p className="text-2xl font-black">{stats.total}</p>
            </div>
            <div className="border-4 border-[#0066FF]/30 p-4">
              <p className="text-[#0066FF] text-xs font-bold">ACTIVE</p>
              <p className="text-2xl font-black text-[#0066FF]">{stats.active}</p>
            </div>
            <div className="border-4 border-[#00FF88]/30 p-4">
              <p className="text-[#00FF88] text-xs font-bold">PAID</p>
              <p className="text-2xl font-black text-[#00FF88]">{stats.paid}</p>
            </div>
            <div className="border-4 border-yellow-400/30 p-4">
              <p className="text-yellow-400 text-xs font-bold">EXPIRED</p>
              <p className="text-2xl font-black text-yellow-400">{stats.expired}</p>
            </div>
          </div>
        )}

        {/* Total Received */}
        {stats && parseFloat(stats.totalAmountReceived) > 0 && (
          <div className="border-4 border-[#00FF88] p-4 mb-6">
            <p className="text-[#00FF88]/60 text-xs font-bold">TOTAL RECEIVED</p>
            <p className="text-3xl font-black text-[#00FF88]">
              {parseFloat(stats.totalAmountReceived).toLocaleString()} XLM
            </p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'active', 'paid', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 text-xs font-bold border-2 whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-white text-black border-white'
                  : 'border-white/30 text-white/60 hover:border-white/60'
              }`}
            >
              {f.toUpperCase()}
              {f === 'all' && ` (${paymentLinks.length})`}
              {f === 'active' && ` (${paymentLinks.filter((l) => l.status === 'active').length})`}
              {f === 'paid' && ` (${paymentLinks.filter((l) => l.status === 'paid').length})`}
              {f === 'expired' && ` (${paymentLinks.filter((l) => l.status === 'expired').length})`}
            </button>
          ))}
          <button
            onClick={fetchLinks}
            className="px-3 py-2 border-2 border-white/30 text-white/60 hover:border-white/60 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-[#0066FF] animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="border-4 border-red-500/50 bg-red-500/10 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-400 font-bold">{error}</p>
            <button
              onClick={fetchLinks}
              className="mt-4 px-4 py-2 border-2 border-red-500/50 text-red-400 font-bold hover:bg-red-500/20 transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredLinks.length === 0 && (
          <div className="border-4 border-white/20 p-8 text-center">
            <Link2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 font-bold mb-4">
              {filter === 'all'
                ? 'No payment links yet'
                : `No ${filter} payment links`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/pay/create')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0066FF] text-white font-black hover:bg-[#0055CC] transition-colors"
              >
                <Plus className="w-4 h-4" />
                CREATE YOUR FIRST LINK
              </button>
            )}
          </div>
        )}

        {/* Payment Links List */}
        {!isLoading && !error && filteredLinks.length > 0 && (
          <div className="space-y-4">
            {filteredLinks.map((link) => {
              const expiryInfo = getExpiryInfo(link.expiresAt);

              return (
                <div
                  key={link.id}
                  className={`border-4 ${
                    link.status === 'paid'
                      ? 'border-[#00FF88]/30'
                      : link.status === 'expired' || link.status === 'cancelled'
                      ? 'border-white/10'
                      : 'border-white/20'
                  }`}
                >
                  {/* Link Header */}
                  <div className="flex items-center justify-between p-4 border-b-2 border-white/10">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 flex items-center justify-center border-2 ${getStatusColor(
                          link.status
                        )}`}
                      >
                        {getStatusIcon(link.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold">#{link.id}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusColor(
                              link.status
                            )} border`}
                          >
                            {link.status}
                          </span>
                        </div>
                        <p className="text-white/40 text-xs">{getTimeAgo(link.createdAt)}</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      {link.amount ? (
                        <p className="font-black text-lg">
                          {link.amount} <span className="text-white/50">{link.asset}</span>
                        </p>
                      ) : (
                        <p className="text-white/50 font-bold text-sm">Any amount</p>
                      )}
                      {link.status === 'paid' && link.paidAmount && (
                        <p className="text-[#00FF88] text-xs font-bold">
                          Received: {link.paidAmount} XLM
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Link Details */}
                  <div className="p-4 space-y-3">
                    {/* Description */}
                    {link.description && (
                      <p className="text-white/60 text-sm">{link.description}</p>
                    )}

                    {/* Memo */}
                    {link.memo && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/30 text-xs">Memo:</span>
                        <code className="text-xs font-mono text-white/60">{link.memo}</code>
                      </div>
                    )}

                    {/* Expiry */}
                    {expiryInfo && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-white/30" />
                        <span
                          className={`text-xs ${
                            expiryInfo.isExpired ? 'text-yellow-400' : 'text-white/50'
                          }`}
                        >
                          {expiryInfo.text}
                        </span>
                      </div>
                    )}

                    {/* Views */}
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3 text-white/30" />
                      <span className="text-white/40 text-xs">
                        {link.viewCount} {link.viewCount === 1 ? 'view' : 'views'}
                      </span>
                    </div>

                    {/* Paid By */}
                    {link.status === 'paid' && link.paidBy && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-[#00FF88]" />
                        <span className="text-white/40 text-xs">
                          Paid by {formatAddress(link.paidBy)} on {formatDate(link.paidAt!)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Link Actions */}
                  <div className="flex items-center gap-2 p-4 border-t-2 border-white/10">
                    <button
                      onClick={() => copyLink(link.url, link.id)}
                      className={`flex items-center gap-2 px-3 py-2 border-2 text-xs font-bold transition-colors ${
                        copiedId === link.id
                          ? 'border-[#00FF88] text-[#00FF88]'
                          : 'border-white/30 text-white/60 hover:border-white/60'
                      }`}
                    >
                      {copiedId === link.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          COPIED!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          COPY
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => window.open(link.url, '_blank')}
                      className="flex items-center gap-2 px-3 py-2 border-2 border-white/30 text-white/60 text-xs font-bold hover:border-white/60 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      OPEN
                    </button>

                    <button
                      onClick={() => router.push(`/pay/${link.id}`)}
                      className="flex items-center gap-2 px-3 py-2 border-2 border-white/30 text-white/60 text-xs font-bold hover:border-white/60 transition-colors"
                    >
                      <QrCode className="w-3 h-3" />
                      QR
                    </button>

                    {link.status === 'paid' && link.paymentTxHash && (
                      <button
                        onClick={() =>
                          window.open(
                            `https://stellar.expert/explorer/${link.network}/tx/${link.paymentTxHash}`,
                            '_blank'
                          )
                        }
                        className="flex items-center gap-2 px-3 py-2 border-2 border-[#00FF88]/30 text-[#00FF88] text-xs font-bold hover:border-[#00FF88]/60 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        TX
                      </button>
                    )}

                    {link.status === 'active' && (
                      <button
                        onClick={() => cancelLink(link.id)}
                        disabled={deletingId === link.id}
                        className="flex items-center gap-2 px-3 py-2 border-2 border-red-500/30 text-red-400 text-xs font-bold hover:border-red-500/60 transition-colors ml-auto disabled:opacity-50"
                      >
                        {deletingId === link.id ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        CANCEL
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Network Badge */}
        <div className="flex justify-center mt-8">
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
