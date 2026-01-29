"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Send,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  LogOut,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Balance {
  asset: string;
  amount: string;
}

interface Transaction {
  hash: string;
  type: string;
  amount: string;
  to: string;
  date: string;
}

interface LiveWalletDashboardProps {
  address: string;
  balances: Balance[];
  transactions: Transaction[];
  proofStatus: "generating" | "ready" | "none";
  onSend: (to: string, amount: string) => Promise<void>;
  onRefresh: () => void;
  onDisconnect: () => void;
  isDark: boolean;
}

function truncateHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function LiveWalletDashboard({
  address,
  balances,
  transactions,
  proofStatus,
  onSend,
  onRefresh,
  onDisconnect,
  isDark,
}: LiveWalletDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showTxns, setShowTxns] = useState(true);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const xlmBalance = balances.find((b) => b.asset === "XLM");
  const otherBalances = balances.filter((b) => b.asset !== "XLM");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    setSendError("");
    if (!recipient.trim()) {
      setSendError("Recipient address is required");
      return;
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setSendError("Valid amount is required");
      return;
    }
    setIsSending(true);
    try {
      await onSend(recipient.trim(), amount.trim());
      setRecipient("");
      setAmount("");
    } catch {
      setSendError("Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  const proofBadge = () => {
    switch (proofStatus) {
      case "ready":
        return (
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-[#39FF14] text-[#39FF14] text-xs font-black uppercase">
            <Shield className="w-3.5 h-3.5" />
            PROOF READY
          </div>
        );
      case "generating":
        return (
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-[#FFD600] text-[#FFD600] text-xs font-black uppercase">
            <Shield className="w-3.5 h-3.5 animate-pulse" />
            GENERATING...
          </div>
        );
      default:
        return (
          <div
            className={`flex items-center gap-2 px-3 py-1 border-2 text-xs font-black uppercase ${
              isDark
                ? "border-white/30 text-white/40"
                : "border-black/30 text-black/40"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            NO PROOF
          </div>
        );
    }
  };

  return (
    <div
      className={`border-4 ${
        isDark ? "border-white bg-[#0A0A0A]" : "border-black bg-white"
      }`}
    >
      {/* Window dots */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b-4 ${
          isDark ? "border-white" : "border-black"
        }`}
      >
        <div className="w-3 h-3 bg-[#FF3366]" />
        <div className="w-3 h-3 bg-[#FFD600]" />
        <div className="w-3 h-3 bg-[#39FF14]" />
        <span
          className={`ml-3 text-xs font-black uppercase ${
            isDark ? "text-white/60" : "text-black/60"
          }`}
        >
          WALLET
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Address + Proof Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-sm ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {truncateAddress(address)}
            </span>
            <button
              onClick={handleCopy}
              className={`p-1 transition-colors ${
                isDark
                  ? "text-white/50 hover:text-white"
                  : "text-black/50 hover:text-black"
              }`}
              title="Copy address"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#39FF14]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-[#00D4FF] hover:brightness-110 transition-colors"
              title="View on Explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          {proofBadge()}
        </div>

        {/* Balance section */}
        <div
          className={`border-4 p-4 ${
            isDark ? "border-white/20" : "border-black/20"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`font-black text-xs uppercase ${
                isDark ? "text-white/60" : "text-black/60"
              }`}
            >
              BALANCE
            </h3>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className={`p-1 ${
                isDark
                  ? "text-white/50 hover:text-white"
                  : "text-black/50 hover:text-black"
              }`}
            >
              {showBalance ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>

          {xlmBalance && (
            <div className="mb-3">
              <span
                className={`font-black text-3xl font-mono ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                {showBalance ? xlmBalance.amount : "****"}
              </span>
              <span
                className={`ml-2 text-sm font-black ${
                  isDark ? "text-white/50" : "text-black/50"
                }`}
              >
                XLM
              </span>
            </div>
          )}

          {otherBalances.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {otherBalances.map((b) => (
                <div
                  key={b.asset}
                  className={`flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-mono ${
                    isDark
                      ? "border-white/10 text-white/70"
                      : "border-black/10 text-black/70"
                  }`}
                >
                  <span className="font-black">{b.asset}</span>
                  <span>{showBalance ? b.amount : "****"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send form */}
        <div
          className={`border-4 p-4 ${
            isDark ? "border-white/20" : "border-black/20"
          }`}
        >
          <h3
            className={`font-black text-xs uppercase mb-3 ${
              isDark ? "text-white/60" : "text-black/60"
            }`}
          >
            SEND
          </h3>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Recipient address (G...)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={`w-full px-3 py-2.5 border-4 font-mono text-sm outline-none transition-colors ${
                isDark
                  ? "border-white/20 bg-transparent text-white placeholder:text-white/30 focus:border-[#0066FF]"
                  : "border-black/20 bg-transparent text-black placeholder:text-black/30 focus:border-[#0066FF]"
              }`}
            />
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`flex-1 px-3 py-2.5 border-4 font-mono text-sm outline-none transition-colors ${
                  isDark
                    ? "border-white/20 bg-transparent text-white placeholder:text-white/30 focus:border-[#0066FF]"
                    : "border-black/20 bg-transparent text-black placeholder:text-black/30 focus:border-[#0066FF]"
                }`}
              />
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0066FF] text-white border-4 border-[#0066FF] font-black text-xs uppercase transition-all hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                SEND
              </button>
            </div>
            {sendError && (
              <p className="text-[#FF3366] text-xs font-black">{sendError}</p>
            )}
          </div>
        </div>

        {/* Transaction history */}
        <div
          className={`border-4 ${
            isDark ? "border-white/20" : "border-black/20"
          }`}
        >
          <button
            onClick={() => setShowTxns(!showTxns)}
            className={`w-full flex items-center justify-between px-4 py-3 font-black text-xs uppercase ${
              isDark ? "text-white/60" : "text-black/60"
            }`}
          >
            <span>TRANSACTIONS ({transactions.length})</span>
            {showTxns ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showTxns && (
            <div
              className={`border-t-4 ${
                isDark ? "border-white/20" : "border-black/20"
              }`}
            >
              {transactions.length === 0 ? (
                <p
                  className={`px-4 py-6 text-center text-xs font-mono ${
                    isDark ? "text-white/30" : "text-black/30"
                  }`}
                >
                  No transactions yet
                </p>
              ) : (
                <div className="divide-y divide-white/10">
                  {transactions.map((tx, i) => (
                    <div
                      key={`${tx.hash}-${i}`}
                      className={`flex items-center justify-between px-4 py-3 ${
                        isDark ? "hover:bg-white/5" : "hover:bg-black/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#39FF14] rounded-full" />
                        <div>
                          <p
                            className={`font-mono text-xs ${
                              isDark ? "text-white/80" : "text-black/80"
                            }`}
                          >
                            {truncateHash(tx.hash)}
                          </p>
                          <p
                            className={`text-xs ${
                              isDark ? "text-white/40" : "text-black/40"
                            }`}
                          >
                            {tx.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-mono text-xs font-black ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          {tx.amount} XLM
                        </p>
                        <p
                          className={`text-xs ${
                            isDark ? "text-white/40" : "text-black/40"
                          }`}
                        >
                          {relativeTime(tx.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onRefresh}
            className={`flex items-center gap-2 px-4 py-2 border-4 font-black text-xs uppercase transition-all ${
              isDark
                ? "border-white/20 text-white/60 hover:border-white/40 hover:text-white"
                : "border-black/20 text-black/60 hover:border-black/40 hover:text-black"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            REFRESH
          </button>
          <button
            onClick={onDisconnect}
            className="flex items-center gap-2 px-4 py-2 border-4 border-[#FF3366] text-[#FF3366] font-black text-xs uppercase transition-all hover:bg-[#FF3366] hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            DISCONNECT
          </button>
        </div>
      </div>
    </div>
  );
}
