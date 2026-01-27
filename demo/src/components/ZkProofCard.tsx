/**
 * ZK Proof Card Component
 *
 * Displays ZK proof information and verification status.
 * Shows the Groth16 proof structure and public inputs.
 */

'use client';

import { useState } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Fingerprint,
  Lock,
  Key,
} from 'lucide-react';

interface G1Point {
  x: string;
  y: string;
}

interface G2Point {
  x: [string, string];
  y: [string, string];
}

interface Groth16Proof {
  a: G1Point;
  b: G2Point;
  c: G1Point;
}

interface ZkPublicInputs {
  ephPkHash: string;
  maxEpoch: number;
  addressSeed: string;
  issHash: string;
  jwkModulusHash: string;
}

interface ZkProofCardProps {
  proof: {
    proof: Groth16Proof;
    publicInputs: ZkPublicInputs;
    metadata?: {
      proofTimeMs?: number;
      prover?: string;
      timestamp?: string;
    };
  } | null;
  walletAddress?: string;
  isDark?: boolean;
  onVerify?: () => Promise<boolean>;
}

export function ZkProofCard({
  proof,
  walletAddress,
  isDark = true,
  onVerify,
}: ZkProofCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  if (!proof) {
    return (
      <div
        className={`p-6 border-4 ${
          isDark ? 'border-white/20 bg-white/5' : 'border-black/20 bg-black/5'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 border-2 border-dashed ${
              isDark ? 'border-white/30' : 'border-black/30'
            } flex items-center justify-center`}
          >
            <Shield className={`w-6 h-6 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
          </div>
          <div>
            <p className="font-black">NO ZK PROOF</p>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Proof will be generated on login
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleVerify = async () => {
    if (!onVerify) return;
    setIsVerifying(true);
    try {
      const result = await onVerify();
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const shortenHex = (hex: string) => {
    if (!hex) return '';
    const clean = hex.startsWith('0x') ? hex : `0x${hex}`;
    return `${clean.slice(0, 10)}...${clean.slice(-8)}`;
  };

  return (
    <div
      className={`border-4 ${
        isDark ? 'border-[#00FF88]' : 'border-[#00AA55]'
      } overflow-hidden`}
    >
      {/* Header */}
      <div className={`px-4 py-3 ${isDark ? 'bg-[#00FF88]' : 'bg-[#00AA55]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-black" />
            <span className="font-black text-black text-sm">ZK PROOF</span>
          </div>
          <div className="flex items-center gap-2">
            {verificationResult !== null && (
              <div
                className={`px-2 py-1 ${
                  verificationResult
                    ? 'bg-black/20 text-black'
                    : 'bg-red-500 text-white'
                }`}
              >
                {verificationResult ? (
                  <span className="flex items-center gap-1 text-xs font-black">
                    <CheckCircle className="w-3 h-3" /> VERIFIED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-black">
                    <XCircle className="w-3 h-3" /> INVALID
                  </span>
                )}
              </div>
            )}
            <span className="text-xs font-bold text-black/60">GROTH16</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 ${isDark ? 'bg-black/30' : 'bg-white/30'}`}>
        {/* Wallet Address */}
        {walletAddress && (
          <div className="mb-4">
            <p className={`text-xs font-black mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              WALLET ADDRESS
            </p>
            <div className="flex items-center gap-2">
              <code
                className={`flex-1 font-mono text-xs ${
                  isDark ? 'text-[#00FF88]' : 'text-[#00AA55]'
                }`}
              >
                {walletAddress}
              </code>
              <button
                onClick={() => copyToClipboard(walletAddress, 'address')}
                className={`p-1 ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
              >
                {copied === 'address' ? (
                  <Check className="w-3 h-3 text-[#00FF88]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Public Inputs Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-2 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <p className={`text-[10px] font-black ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              EPH KEY HASH
            </p>
            <p className={`font-mono text-xs ${isDark ? 'text-[#00D4FF]' : 'text-[#0099CC]'}`}>
              {shortenHex(proof.publicInputs.ephPkHash)}
            </p>
          </div>
          <div className={`p-2 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <p className={`text-[10px] font-black ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              MAX EPOCH
            </p>
            <p className="font-mono text-xs">{proof.publicInputs.maxEpoch}</p>
          </div>
          <div className={`p-2 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <p className={`text-[10px] font-black ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              ADDRESS SEED
            </p>
            <p className={`font-mono text-xs ${isDark ? 'text-[#00FF88]' : 'text-[#00AA55]'}`}>
              {shortenHex(proof.publicInputs.addressSeed)}
            </p>
          </div>
          <div className={`p-2 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <p className={`text-[10px] font-black ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              ISSUER HASH
            </p>
            <p className={`font-mono text-xs ${isDark ? 'text-[#0066FF]' : 'text-[#0055CC]'}`}>
              {shortenHex(proof.publicInputs.issHash)}
            </p>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-center gap-2 py-2 border-2 ${
            isDark
              ? 'border-white/20 hover:border-white/40'
              : 'border-black/20 hover:border-black/40'
          } transition-all`}
        >
          <span className="text-xs font-black">
            {isExpanded ? 'HIDE DETAILS' : 'SHOW PROOF DETAILS'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Proof Points */}
            <div>
              <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                PROOF POINTS (BN254)
              </p>

              {/* Point A (G1) */}
              <div className={`p-3 mb-2 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#0066FF]" />
                  <span className="text-xs font-black">π_A (G1)</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>x:</span>
                    <code className="font-mono text-[10px] flex-1 truncate">
                      {proof.proof.a.x}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>y:</span>
                    <code className="font-mono text-[10px] flex-1 truncate">
                      {proof.proof.a.y}
                    </code>
                  </div>
                </div>
              </div>

              {/* Point B (G2) */}
              <div className={`p-3 mb-2 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#00D4FF]" />
                  <span className="text-xs font-black">π_B (G2)</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>x[0]:</span>
                    <code className="font-mono text-[10px] flex-1 truncate">
                      {proof.proof.b.x[0]}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>x[1]:</span>
                    <code className="font-mono text-[10px] flex-1 truncate">
                      {proof.proof.b.x[1]}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>y[0]:</span>
                    <code className="font-mono text-[10px] flex-1 truncate">
                      {proof.proof.b.y[0]}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>y[1]:</span>
                    <code className="font-mono text-[10px] flex-1 truncate">
                      {proof.proof.b.y[1]}
                    </code>
                  </div>
                </div>
              </div>

              {/* Point C (G1) */}
              <div className={`p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#00FF88]" />
                  <span className="text-xs font-black">π_C (G1)</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>x:</span>
                    <code className="font-mono text-[10px] flex-1 truncate">
                      {proof.proof.c.x}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>y:</span>
                    <code className="font-mono text-[10px] flex-1 truncate">
                      {proof.proof.c.y}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {proof.metadata && (
              <div className={`p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  PROOF METADATA
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {proof.metadata.proofTimeMs && (
                    <div>
                      <span className={isDark ? 'text-white/40' : 'text-black/40'}>
                        Generation Time:
                      </span>{' '}
                      {proof.metadata.proofTimeMs}ms
                    </div>
                  )}
                  {proof.metadata.prover && (
                    <div>
                      <span className={isDark ? 'text-white/40' : 'text-black/40'}>
                        Prover:
                      </span>{' '}
                      {proof.metadata.prover}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verify Button */}
        {onVerify && (
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className={`w-full mt-4 flex items-center justify-center gap-2 py-3 font-black ${
              isDark
                ? 'bg-[#0066FF] hover:bg-[#0055DD]'
                : 'bg-[#0066FF] hover:bg-[#0055DD]'
            } text-white transition-all disabled:opacity-50`}
          >
            {isVerifying ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                VERIFYING ON-CHAIN...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                VERIFY PROOF ON-CHAIN
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default ZkProofCard;
