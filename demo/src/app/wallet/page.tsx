"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useZkLogin } from "../providers";

export default function WalletPage() {
  const router = useRouter();
  const { client, wallet, disconnect, refreshBalance } = useZkLogin();
  const [activeTab, setActiveTab] = useState<"overview" | "send" | "history">("overview");
  const [sendForm, setSendForm] = useState({
    recipient: "",
    amount: "",
    asset: "USDC",
  });
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; hash?: string; error?: string } | null>(null);

  // Redirect if not connected
  useEffect(() => {
    if (!wallet.isConnected && !wallet.isLoading) {
      router.push("/");
    }
  }, [wallet.isConnected, wallet.isLoading, router]);

  // Refresh balance periodically
  useEffect(() => {
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const result = await client.transfer(
        process.env.NEXT_PUBLIC_USDC_CONTRACT_ID || "",
        sendForm.recipient,
        (parseFloat(sendForm.amount) * 10000000).toString() // Convert to stroops
      );

      setSendResult({ success: true, hash: result.hash });
      setSendForm({ recipient: "", amount: "", asset: "USDC" });
      refreshBalance();
    } catch (error) {
      setSendResult({ success: false, error: (error as Error).message });
    } finally {
      setIsSending(false);
    }
  };

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
    }
  };

  if (wallet.isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-stellar-purple/20 border-t-stellar-purple rounded-full spinner mx-auto mb-4" />
          <p className="text-white/60">Setting up your wallet...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Stellar zkLogin</h1>
            <p className="text-white/50 text-sm">Your secure wallet</p>
          </div>
          <button onClick={disconnect} className="btn-secondary text-sm">
            Disconnect
          </button>
        </header>

        {/* Balance Card */}
        <div className="gradient-border p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/50 text-sm mb-1">Total Balance</p>
              <p className="text-4xl font-bold">
                {wallet.balance ? `${parseFloat(wallet.balance).toFixed(2)} XLM` : "0.00 XLM"}
              </p>
            </div>
            <button onClick={refreshBalance} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Address */}
          <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white/50 text-xs mb-1">Wallet Address</p>
              <p className="font-mono text-sm">
                {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-8)}
              </p>
            </div>
            <button
              onClick={copyAddress}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Copy address"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["overview", "send", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? "bg-stellar-purple text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab("send")}
                  className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <span className="text-2xl mb-2 block">📤</span>
                  <span className="text-sm">Send</span>
                </button>
                <button className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-2xl mb-2 block">📥</span>
                  <span className="text-sm">Receive</span>
                </button>
                <button className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-2xl mb-2 block">💱</span>
                  <span className="text-sm">Swap</span>
                </button>
                <button className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-2xl mb-2 block">💳</span>
                  <span className="text-sm">x402 Pay</span>
                </button>
              </div>
            </div>

            {/* Session Info */}
            <div className="card">
              <h3 className="font-semibold mb-4">Session Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Status</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    Active
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Network</span>
                  <span>Stellar Testnet</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Auth Provider</span>
                  <span>Google</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Proof Type</span>
                  <span>Groth16 (BN254)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "send" && (
          <div className="card max-w-md mx-auto">
            <h3 className="font-semibold mb-6">Send Tokens</h3>

            {sendResult && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  sendResult.success
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {sendResult.success
                  ? `Transaction sent! Hash: ${sendResult.hash?.slice(0, 16)}...`
                  : `Error: ${sendResult.error}`}
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={sendForm.recipient}
                  onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
                  placeholder="G..."
                  className="input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-2">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={sendForm.amount}
                    onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                    placeholder="0.00"
                    step="0.0000001"
                    min="0"
                    className="input pr-20"
                    required
                  />
                  <select
                    value={sendForm.asset}
                    onChange={(e) => setSendForm({ ...sendForm, asset: e.target.value })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-white focus:outline-none"
                  >
                    <option value="XLM">XLM</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full spinner" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === "history" && (
          <div className="card">
            <h3 className="font-semibold mb-4">Transaction History</h3>
            <div className="text-center py-12 text-white/40">
              <p className="text-4xl mb-4">📋</p>
              <p>No transactions yet</p>
              <p className="text-sm mt-2">
                Send your first transaction to see it here
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
