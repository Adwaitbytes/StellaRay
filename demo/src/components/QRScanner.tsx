/**
 * QR Scanner Component
 *
 * Scans QR codes using device camera and parses Stellar payment data.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';

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
  if (trimmed.toLowerCase().startsWith('web+stellar:pay')) {
    try {
      const url = new URL(trimmed.replace(/web\+stellar:/i, 'https://stellar.org/'));
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
      // Fall through to other checks
    }
  }

  // Check for Stellaray payment link URL - more flexible matching
  // Matches: /pay/ABC123, stellaray.fun/pay/ABC123, https://stellaray.fun/pay/ABC123?foo=bar
  const paymentLinkPatterns = [
    /\/pay\/([a-zA-Z0-9]{6,12})(?:\?|$|\/)/,  // /pay/ID with optional query params
    /stellaray\.fun\/pay\/([a-zA-Z0-9]{6,12})/i,
    /localhost:\d+\/pay\/([a-zA-Z0-9]{6,12})/i,
    /\/pay\/([a-zA-Z0-9]{6,12})$/,  // Ending with /pay/ID
  ];

  for (const pattern of paymentLinkPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return {
        type: 'payment_link',
        paymentLinkId: match[1],
        rawValue: trimmed,
      };
    }
  }

  // Check for raw Stellar address (G...) - can be anywhere in the string
  const addressMatch = trimmed.match(/\b(G[A-Z2-7]{55})\b/);
  if (addressMatch) {
    return {
      type: 'address',
      destination: addressMatch[1],
      rawValue: trimmed,
    };
  }

  // Check if it's a URL that might contain payment info
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      // Check for destination in query params
      const destination = url.searchParams.get('destination') || url.searchParams.get('to');
      if (destination && /^G[A-Z2-7]{55}$/.test(destination)) {
        return {
          type: 'address',
          destination,
          amount: url.searchParams.get('amount') || undefined,
          memo: url.searchParams.get('memo') || undefined,
          rawValue: trimmed,
        };
      }
    } catch {
      // Not a valid URL
    }
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
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<any>(null);
  const hasScannedRef = useRef(false);

  const handleScanSuccess = useCallback((decodedText: string) => {
    // Prevent multiple scans
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;

    // Parse the scanned data
    const parsed = parseQRData(decodedText);

    // Stop scanner
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {});
      } catch (e) {
        // Ignore
      }
    }

    onScan(parsed);
  }, [onScan]);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    let html5QrCode: any = null;

    const initScanner = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import('html5-qrcode');

        if (!mounted) return;

        // Check for camera support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Camera not supported on this device/browser');
          setIsInitializing(false);
          return;
        }

        // Get cameras
        let cameras: any[] = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch (e) {
          console.error('Failed to get cameras:', e);
        }

        if (!mounted) return;

        if (!cameras || cameras.length === 0) {
          setError('No cameras found. Please ensure camera permission is granted.');
          setIsInitializing(false);
          return;
        }

        // Create scanner
        html5QrCode = new Html5Qrcode('qr-reader', { verbose: false });
        scannerRef.current = html5QrCode;

        // Configure scanner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        setIsInitializing(false);
        setIsScanning(true);

        // Start scanning - prefer back camera
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          handleScanSuccess,
          () => {} // Ignore scan errors
        );

      } catch (err: any) {
        console.error('Scanner init error:', err);
        if (mounted) {
          setIsInitializing(false);
          if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
            setError('Camera permission denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.');
          } else if (err.name === 'NotReadableError') {
            setError('Camera is in use by another application.');
          } else {
            setError(err.message || 'Failed to start camera. Please try again.');
          }
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      hasScannedRef.current = false;

      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {
          // Ignore cleanup errors
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, handleScanSuccess]);

  const handleClose = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {});
      } catch (e) {
        // Ignore
      }
    }
    onClose?.();
  }, [onClose]);

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
      <div className="w-full h-full flex items-center justify-center">
        {/* QR Reader Container - must be in DOM before scanner init */}
        <div
          id="qr-reader"
          className="w-full max-w-md"
          style={{ minHeight: '300px' }}
        />

        {/* Scanning overlay frame */}
        {isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#0066FF]" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#0066FF]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#0066FF]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#0066FF]" />
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
        {isInitializing && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <Camera className="w-12 h-12 text-[#0066FF] mx-auto mb-4 animate-pulse" />
              <p className="text-white font-bold">Starting camera...</p>
              <p className="text-white/50 text-sm mt-2">Please allow camera access</p>
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
    </div>
  );
}

export default QRScanner;
