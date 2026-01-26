"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { ArrowRight, Wallet, Copy, Check, ExternalLink, Zap } from "lucide-react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [xlmPrice, setXlmPrice] = useState<number | null>(null);

  const recipient = searchParams.get("to") || "";
  const network = searchParams.get("network") || "testnet";
  const requestedAmount = searchParams.get("amount") || "";

  useEffect(() => {
    if (requestedAmount) {
      setAmount(requestedAmount);
    }
  }, [requestedAmount]);

  useEffect(() => {
    // Fetch XLM price
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd")
      .then(res => res.json())
      .then(data => setXlmPrice(data.stellar?.usd))
      .catch(() => setXlmPrice(null));
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(recipient);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const openInStellarWallet = () => {
    // Stellar URI for native wallet apps
    const stellarUri = amount
      ? `web+stellar:pay?destination=${recipient}&amount=${amount}&network=${network}`
      : `web+stellar:pay?destination=${recipient}&network=${network}`;
    window.location.href = stellarUri;
  };

  const openInLobstr = () => {
    window.open(`https://lobstr.co/send?destination=${recipient}${amount ? `&amount=${amount}` : ''}`, '_blank');
  };

  if (!recipient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">INVALID LINK</h1>
          <p className="text-white/60 mb-8">No recipient address provided</p>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-4 bg-[#0066FF] text-black font-black hover:bg-[#00DD77] transition-colors"
          >
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF]/10 border border-[#0066FF]/30 mb-4">
            <Zap className="w-4 h-4 text-[#0066FF]" />
            <span className="text-[#0066FF] font-bold text-sm">STELLARAY</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">SEND PAYMENT</h1>
          <p className="text-white/60">Pay to this Stellar address</p>
        </div>

        {/* Payment Card */}
        <div className="border-4 border-white bg-[#0A0A0A]">
          {/* Recipient Section */}
          <div className="p-6 border-b-4 border-white/20">
            <p className="text-white/50 text-sm font-bold mb-2">RECIPIENT</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0066FF] flex items-center justify-center">
                <Wallet className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-mono text-sm truncate">{recipient}</p>
                <p className="text-white/40 text-xs">{network.toUpperCase()} Network</p>
              </div>
              <button
                onClick={copyAddress}
                className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-[#0066FF]" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="p-6 border-b-4 border-white/20">
            <p className="text-white/50 text-sm font-bold mb-2">AMOUNT (OPTIONAL)</p>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black border-2 border-white/30 px-4 py-4 text-white text-2xl font-black focus:outline-none focus:border-[#0066FF] placeholder:text-white/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">XLM</span>
            </div>
            {amount && xlmPrice && (
              <p className="text-white/40 text-sm mt-2">
                = ${(parseFloat(amount) * xlmPrice).toFixed(2)} USD
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            {/* Primary: Open in Stellar Wallet */}
            <button
              onClick={openInStellarWallet}
              className="group relative w-full"
            >
              <div className="absolute inset-0 bg-[#0066FF] translate-x-1 translate-y-1" />
              <div className="relative flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-black border-4 border-[#0066FF] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform">
                <Wallet className="w-5 h-5" />
                OPEN IN WALLET
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>

            {/* Secondary: Open in Lobstr */}
            <button
              onClick={openInLobstr}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-white/30 text-white font-bold hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              OPEN IN LOBSTR
            </button>

            {/* Copy Address */}
            <button
              onClick={copyAddress}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-white/30 text-white/60 font-bold hover:bg-white/10 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-[#0066FF]" /> : <Copy className="w-4 h-4" />}
              {copied ? "COPIED!" : "COPY ADDRESS"}
            </button>
          </div>
        </div>

        {/* Create Your Own Wallet */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm mb-3">Don't have a Stellar wallet?</p>
          <button
            onClick={() => router.push("/")}
            className="text-[#0066FF] font-bold hover:underline"
          >
            Create one with Google Sign-In →
          </button>
        </div>

        {/* Network Badge */}
        <div className="mt-6 flex justify-center">
          <div className={`px-3 py-1 text-xs font-bold ${network === 'mainnet' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
            {network.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-bold">Loading...</div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
