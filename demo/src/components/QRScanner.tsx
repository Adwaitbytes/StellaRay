/**
 * QR Scanner Component
 *
 * Scans QR codes using device camera and parses Stellar payment data.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, Flashlight, SwitchCamera, AlertCircle } from 'lucide-react';

export interface ParsedPaymentData {
  type: 'stellar_uri' | 'payment_link' | 'address' | 'unknown';
  destination?: string;
  amount?: string;
  memo?: string;
  memoType?: string;
  asset?: string;
  paymentLinkId?: string;
  rawValue: string;
}

interface QRScannerProps {
  onScan: (data: ParsedPaymentData) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

/**
 * Parse scanned QR code data into payment information
 */
export function parseQRData(rawValue: string): ParsedPaymentData {
  const trimmed = rawValue.trim();

  // Check for Stellar URI (web+stellar:pay?destination=...)
  if (trimmed.startsWith('web+stellar:pay')) {
    try {
      const url = new URL(trimmed.replace('web+stellar:', 'https://stellar.org/'));
      const params = url.searchParams;

      return {
        type: 'stellar_uri',
        destination: params.get('destination') || undefined,
        amount: params.get('amount') || undefined,
        memo: params.get('memo') || undefined,
        memoType: params.get('memo_type') || undefined,
        asset: params.get('asset_code') || 'XLM',
        rawValue: trimmed,
      };
    } catch {
      // Fall through to unknown
    }
  }

  // Check for Stellaray payment link URL
  const paymentLinkMatch = trimmed.match(/\/pay\/([a-zA-Z0-9]+)$/);
  if (paymentLinkMatch || trimmed.includes('stellaray.fun/pay/') || trimmed.includes('localhost:3000/pay/')) {
    const idMatch = trimmed.match(/\/pay\/([a-zA-Z0-9]+)/);
    if (idMatch) {
      return {
        type: 'payment_link',
        paymentLinkId: idMatch[1],
        rawValue: trimmed,
      };
    }
  }

  // Check for raw Stellar address (G...)
  if (/^G[A-Z2-7]{55}$/.test(trimmed)) {
    return {
      type: 'address',
      destination: trimmed,
      rawValue: trimmed,
    };
  }

  // Unknown format
  return {
    type: 'unknown',
    rawValue: trimmed,
  };
}

export function QRScanner({ onScan, onClose, isOpen = true }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const startScanner = async () => {
      try {
        // Check camera permission
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          setError('No cameras found on this device');
          return;
        }

        if (!mounted) return;

        // Create scanner instance
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        setIsScanning(true);
        setError(null);

        // Start scanning with back camera preferred
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Parse the scanned data
            const parsed = parseQRData(decodedText);
            onScan(parsed);

            // Stop scanning after successful scan
            if (scannerRef.current) {
              scannerRef.current.stop().catch(console.error);
            }
          },
          () => {
            // Ignore QR code not found errors during continuous scanning
          }
        );
      } catch (err: any) {
        console.error('Scanner error:', err);
        if (mounted) {
          if (err.message?.includes('Permission')) {
            setHasPermission(false);
            setError('Camera permission denied. Please allow camera access to scan QR codes.');
          } else {
            setError(err.message || 'Failed to start camera');
          }
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
    }
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h2 className="text-xl font-black text-white">SCAN QR CODE</h2>
          <p className="text-white/60 text-sm">Point camera at a payment QR code</p>
        </div>
        {onClose && (
          <button
            onClick={handleClose}
            className="w-12 h-12 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Scanner View */}
      <div className="w-full h-full flex items-center justify-center" ref={containerRef}>
        {/* QR Reader Container */}
        <div id="qr-reader" className="w-full max-w-md" />

        {/* Scanning overlay frame */}
        {isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#0066FF]" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#0066FF]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#0066FF]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#0066FF]" />

              {/* Scanning line animation */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#0066FF] animate-scan-line" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center max-w-sm p-6">
              <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">CAMERA ERROR</h3>
              <p className="text-white/60 mb-6">{error}</p>
              <button
                onClick={handleClose}
                className="px-8 py-4 bg-[#0066FF] text-white font-black hover:bg-[#0055DD] transition-colors"
              >
                GO BACK
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {!isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <Camera className="w-12 h-12 text-[#0066FF] mx-auto mb-4 animate-pulse" />
              <p className="text-white font-bold">Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-md mx-auto">
          <p className="text-white/40 text-xs text-center mb-4">
            Supports: Stellar URIs, Payment Links, Wallet Addresses
          </p>

          {/* Supported formats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="px-3 py-2 bg-white/5 border border-white/10 text-center">
              <p className="text-[10px] font-bold text-white/50">STELLAR URI</p>
              <p className="text-xs text-[#0066FF]">web+stellar:</p>
            </div>
            <div className="px-3 py-2 bg-white/5 border border-white/10 text-center">
              <p className="text-[10px] font-bold text-white/50">PAY LINK</p>
              <p className="text-xs text-[#00FF88]">/pay/xxx</p>
            </div>
            <div className="px-3 py-2 bg-white/5 border border-white/10 text-center">
              <p className="text-[10px] font-bold text-white/50">ADDRESS</p>
              <p className="text-xs text-[#00D4FF]">G...</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0% {
            top: 0;
          }
          50% {
            top: calc(100% - 4px);
          }
          100% {
            top: 0;
          }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default QRScanner;
