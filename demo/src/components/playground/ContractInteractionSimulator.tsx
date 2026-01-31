"use client";

import { useState } from 'react';
import { Box, Play, ChevronDown, Copy, Check } from 'lucide-react';
import SyntaxHighlighter from './SyntaxHighlighter';

interface ContractInteractionSimulatorProps {
  isDark: boolean;
}

interface Param {
  name: string;
  type: string;
  placeholder: string;
}

interface Method {
  name: string;
  params: Param[];
  response: string;
}

interface Contract {
  id: string;
  name: string;
  address: string;
  color: string;
  methods: Method[];
}

const CONTRACTS: Contract[] = [
  {
    id: 'zkVerifier',
    name: 'ZK VERIFIER',
    address: 'CDAQXHNK2HZJJE...',
    color: '#FF3366',
    methods: [
      {
        name: 'is_nullifier_used',
        params: [{ name: 'nullifier', type: 'BytesN<32>', placeholder: '0x1a2b3c...' }],
        response: '{ "result": false, "gas_used": 42000 }',
      },
      {
        name: 'get_verification_key',
        params: [],
        response: '{ "alpha": { "x": "0x1a...", "y": "0x2b..." }, "beta": { ... }, "ic_count": 6 }',
      },
      {
        name: 'compute_nonce',
        params: [
          { name: 'eph_pk_high', type: 'BytesN<32>', placeholder: '0x...' },
          { name: 'max_epoch', type: 'u64', placeholder: '5000000' },
        ],
        response: '{ "nonce": "0x7f3a9b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a", "gas_used": 50000 }',
      },
    ],
  },
  {
    id: 'gatewayFactory',
    name: 'GATEWAY FACTORY',
    address: 'CAAOQR7L5UVV7...',
    color: '#0066FF',
    methods: [
      {
        name: 'get_wallet_count',
        params: [],
        response: '{ "count": 2847, "gas_used": 15000 }',
      },
      {
        name: 'predict_address',
        params: [
          { name: 'iss_hash', type: 'BytesN<32>', placeholder: '0x...' },
          { name: 'address_seed', type: 'BytesN<32>', placeholder: '0x...' },
        ],
        response: '{ "address": "GDEMO7X2YZKLOGINWALLET...", "gas_used": 35000 }',
      },
      {
        name: 'get_wallet',
        params: [{ name: 'address_seed', type: 'BytesN<32>', placeholder: '0x...' }],
        response: '{ "exists": true, "address": "GDEMO...", "deployed_at": 4847000 }',
      },
    ],
  },
  {
    id: 'jwkRegistry',
    name: 'JWK REGISTRY',
    address: 'CAMO5LYOANZWUZ...',
    color: '#00D4FF',
    methods: [
      {
        name: 'get_provider_jwks',
        params: [{ name: 'provider', type: 'String', placeholder: 'google' }],
        response: '{ "keys": [{ "kid": "abc123", "alg": "RS256", "active": true }], "count": 3 }',
      },
      {
        name: 'compute_issuer_hash',
        params: [{ name: 'issuer', type: 'String', placeholder: 'https://accounts.google.com' }],
        response: '{ "hash": "0x9f2e1a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f", "gas_used": 50000 }',
      },
    ],
  },
  {
    id: 'x402Facilitator',
    name: 'x402 FACILITATOR',
    address: 'CDJMT4P4DUZVR...',
    color: '#FFD600',
    methods: [
      {
        name: 'is_paid',
        params: [{ name: 'request_id', type: 'BytesN<32>', placeholder: '0x...' }],
        response: '{ "paid": true, "paid_at": 1706400000, "amount": "1000000" }',
      },
      {
        name: 'get_stats',
        params: [],
        response: '{ "total_payments": 8492, "total_volume": "84920000000", "fee_bps": 100 }',
      },
    ],
  },
];

export default function ContractInteractionSimulator({
  isDark,
}: ContractInteractionSimulatorProps) {
  const [selectedContract, setSelectedContract] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState(0);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);

  const contract = CONTRACTS[selectedContract];
  const method = contract.methods[selectedMethod];

  const handleContractChange = (index: number) => {
    setSelectedContract(index);
    setSelectedMethod(0);
    setParamValues({});
    setResponse(null);
  };

  const handleMethodChange = (index: number) => {
    setSelectedMethod(index);
    setParamValues({});
    setResponse(null);
    setMethodDropdownOpen(false);
  };

  const handleCall = () => {
    setIsLoading(true);
    setResponse(null);
    setTimeout(() => {
      setResponse(method.response);
      setIsLoading(false);
    }, 800);
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`border-4 ${isDark ? 'border-white bg-[#0A0A0A]' : 'border-black bg-white'}`}
    >
      {/* Title bar */}
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b-4 ${
          isDark ? 'border-white' : 'border-black'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF3366]" />
          <div className="w-3 h-3 rounded-full bg-[#FFD600]" />
          <div className="w-3 h-3 rounded-full bg-[#00D4FF]" />
        </div>
        <Box className="w-5 h-5" style={{ color: '#0066FF' }} />
        <span
          className={`font-black text-sm uppercase tracking-wider ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          CONTRACT INTERACTION SIMULATOR
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Contract selector */}
        <div>
          <label
            className={`block font-black text-xs uppercase tracking-wider mb-3 ${
              isDark ? 'text-white/50' : 'text-black/50'
            }`}
          >
            SELECT CONTRACT
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {CONTRACTS.map((c, i) => {
              const isActive = selectedContract === i;
              return (
                <button
                  key={c.id}
                  onClick={() => handleContractChange(i)}
                  className={`px-3 py-2.5 border-4 font-black text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? 'text-black'
                      : isDark
                        ? 'border-white/20 text-white/60 hover:border-white/40 bg-transparent'
                        : 'border-black/20 text-black/60 hover:border-black/40 bg-transparent'
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: c.color, borderColor: c.color }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate">{c.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Method selector */}
        <div>
          <label
            className={`block font-black text-xs uppercase tracking-wider mb-3 ${
              isDark ? 'text-white/50' : 'text-black/50'
            }`}
          >
            METHOD
          </label>
          <div className="relative">
            <button
              onClick={() => setMethodDropdownOpen(!methodDropdownOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 border-4 font-mono text-sm transition-colors ${
                isDark
                  ? 'border-white/40 bg-white/5 text-white hover:border-white/60'
                  : 'border-black/40 bg-black/5 text-black hover:border-black/60'
              }`}
            >
              <span>
                {method.name}
                <span className={isDark ? 'text-white/30' : 'text-black/30'}>
                  ({method.params.map((p) => p.type).join(', ')})
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  methodDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {methodDropdownOpen && (
              <div
                className={`absolute z-10 w-full mt-1 border-4 ${
                  isDark
                    ? 'border-white bg-[#0A0A0A]'
                    : 'border-black bg-white'
                }`}
              >
                {contract.methods.map((m, i) => (
                  <button
                    key={m.name}
                    onClick={() => handleMethodChange(i)}
                    className={`w-full text-left px-4 py-2.5 font-mono text-sm transition-colors ${
                      selectedMethod === i
                        ? isDark
                          ? 'bg-white/10 text-white'
                          : 'bg-black/10 text-black'
                        : isDark
                          ? 'text-white/70 hover:bg-white/5'
                          : 'text-black/70 hover:bg-black/5'
                    }`}
                  >
                    {m.name}
                    <span className={isDark ? 'text-white/30' : 'text-black/30'}>
                      ({m.params.map((p) => p.type).join(', ')})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Parameters */}
        {method.params.length > 0 && (
          <div>
            <label
              className={`block font-black text-xs uppercase tracking-wider mb-3 ${
                isDark ? 'text-white/50' : 'text-black/50'
              }`}
            >
              PARAMETERS
            </label>
            <div className="space-y-3">
              {method.params.map((param) => (
                <div key={param.name}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`font-mono text-sm font-bold ${
                        isDark ? 'text-white' : 'text-black'
                      }`}
                    >
                      {param.name}
                    </span>
                    <span
                      className={`font-mono text-xs px-2 py-0.5 ${
                        isDark
                          ? 'bg-white/10 text-white/50'
                          : 'bg-black/10 text-black/50'
                      }`}
                    >
                      {param.type}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={paramValues[param.name] || ''}
                    onChange={(e) =>
                      setParamValues((prev) => ({
                        ...prev,
                        [param.name]: e.target.value,
                      }))
                    }
                    placeholder={param.placeholder}
                    className={`w-full px-4 py-2.5 border-4 font-mono text-sm outline-none transition-colors ${
                      isDark
                        ? 'border-white/30 bg-white/5 text-white placeholder:text-white/25 focus:border-[#00D4FF]'
                        : 'border-black/30 bg-black/5 text-black placeholder:text-black/25 focus:border-[#0066FF]'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call button */}
        <button
          onClick={handleCall}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 border-4 font-black text-sm uppercase tracking-wider transition-all bg-[#0066FF] border-[#0066FF] text-white hover:brightness-110 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              EXECUTING...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              CALL METHOD
            </>
          )}
        </button>

        {/* Response */}
        {response && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                className={`font-black text-xs uppercase tracking-wider ${
                  isDark ? 'text-white/50' : 'text-black/50'
                }`}
              >
                RESPONSE
              </label>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 border-2 font-black text-xs uppercase transition-all ${
                  copied
                    ? 'border-[#00D4FF] text-[#00D4FF]'
                    : isDark
                      ? 'border-white/30 text-white/50 hover:border-white/50'
                      : 'border-black/30 text-black/50 hover:border-black/50'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    COPIED
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    COPY
                  </>
                )}
              </button>
            </div>
            <div
              className={`border-4 overflow-auto ${
                isDark
                  ? 'border-[#00D4FF]/40 bg-[#00D4FF]/5'
                  : 'border-[#00D4FF]/60 bg-[#00D4FF]/10'
              }`}
            >
              <div className="p-4">
                <SyntaxHighlighter code={response} isDark={isDark} />
              </div>
            </div>

            {/* Contract info footer */}
            <div
              className={`mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs ${
                isDark ? 'text-white/40' : 'text-black/40'
              }`}
            >
              <span>
                Contract:{' '}
                <span style={{ color: contract.color }}>{contract.address}</span>
              </span>
              <span>
                Gas estimate:{' '}
                <span className="text-[#FFD600]">
                  {response.match(/"gas_used":\s*(\d+)/)?.[1] || '~50,000'}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
