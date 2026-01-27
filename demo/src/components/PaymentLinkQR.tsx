/**
 * Payment Link QR Code Component
 *
 * Displays a QR code for payment links with copy and share functionality.
 */

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2, Download, ExternalLink } from 'lucide-react';

interface PaymentLinkQRProps {
  url: string;
  stellarUri?: string;
  amount?: string | null;
  asset?: string;
  recipientAddress: string;
  isDark?: boolean;
  size?: number;
  showActions?: boolean;
}

export function PaymentLinkQR({
  url,
  stellarUri,
  amount,
  asset = 'XLM',
  recipientAddress,
  isDark = true,
  size = 200,
  showActions = true,
}: PaymentLinkQRProps) {
  const [copied, setCopied] = useState<'url' | 'address' | null>(null);
  const [showStellarQR, setShowStellarQR] = useState(false);

  const copyToClipboard = async (text: string, type: 'url' | 'address') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Payment Request',
          text: amount
            ? `Pay ${amount} ${asset} via Stellaray`
            : `Send payment via Stellaray`,
          url: url,
        });
      } catch (err) {
        // User cancelled or share failed
        console.error('Share failed:', err);
      }
    } else {
      // Fallback to copy
      copyToClipboard(url, 'url');
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('payment-qr-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size * 2;
      canvas.height = size * 2;
      if (ctx) {
        ctx.fillStyle = isDark ? '#000000' : '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `payment-link-${Date.now()}.png`;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const qrValue = showStellarQR && stellarUri ? stellarUri : url;

  return (
    <div className={`${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* QR Code */}
      <div className="flex flex-col items-center">
        <div
          className={`p-4 ${isDark ? 'bg-white' : 'bg-black'} rounded-none border-4 ${
            isDark ? 'border-white' : 'border-black'
          }`}
        >
          <QRCodeSVG
            id="payment-qr-svg"
            value={qrValue}
            size={size}
            level="H"
            includeMargin={false}
            bgColor={isDark ? '#FFFFFF' : '#000000'}
            fgColor={isDark ? '#000000' : '#FFFFFF'}
          />
        </div>

        {/* Toggle between URL and Stellar URI */}
        {stellarUri && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowStellarQR(false)}
              className={`px-3 py-1 text-xs font-bold border-2 transition-colors ${
                !showStellarQR
                  ? isDark
                    ? 'bg-white text-black border-white'
                    : 'bg-black text-white border-black'
                  : isDark
                  ? 'text-white/60 border-white/30 hover:border-white/60'
                  : 'text-black/60 border-black/30 hover:border-black/60'
              }`}
            >
              WEB LINK
            </button>
            <button
              onClick={() => setShowStellarQR(true)}
              className={`px-3 py-1 text-xs font-bold border-2 transition-colors ${
                showStellarQR
                  ? isDark
                    ? 'bg-[#0066FF] text-white border-[#0066FF]'
                    : 'bg-[#0066FF] text-white border-[#0066FF]'
                  : isDark
                  ? 'text-white/60 border-white/30 hover:border-white/60'
                  : 'text-black/60 border-black/30 hover:border-black/60'
              }`}
            >
              WALLET APP
            </button>
          </div>
        )}

        {/* Info text */}
        <p
          className={`mt-3 text-xs text-center ${
            isDark ? 'text-white/40' : 'text-black/40'
          }`}
        >
          {showStellarQR
            ? 'Scan with Stellar wallet app (Lobstr, Solar, etc.)'
            : 'Scan or share this link to receive payment'}
        </p>
      </div>

      {showActions && (
        <>
          {/* URL Display */}
          <div className={`mt-6 p-3 border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
            <p
              className={`text-xs font-bold mb-1 ${
                isDark ? 'text-white/40' : 'text-black/40'
              }`}
            >
              PAYMENT LINK
            </p>
            <div className="flex items-center gap-2">
              <code
                className={`flex-1 font-mono text-xs truncate ${
                  isDark ? 'text-[#0066FF]' : 'text-[#0055CC]'
                }`}
              >
                {url}
              </code>
              <button
                onClick={() => copyToClipboard(url, 'url')}
                className={`p-2 border-2 ${
                  isDark
                    ? 'border-white/20 hover:border-white/40'
                    : 'border-black/20 hover:border-black/40'
                } transition-colors`}
              >
                {copied === 'url' ? (
                  <Check className="w-4 h-4 text-[#00FF88]" />
                ) : (
                  <Copy className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button
              onClick={() => copyToClipboard(url, 'url')}
              className={`flex flex-col items-center gap-1 p-3 border-2 ${
                isDark
                  ? 'border-white/20 hover:border-white/40 text-white'
                  : 'border-black/20 hover:border-black/40 text-black'
              } transition-colors`}
            >
              {copied === 'url' ? (
                <Check className="w-5 h-5 text-[#00FF88]" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span className="text-[10px] font-bold">
                {copied === 'url' ? 'COPIED!' : 'COPY'}
              </span>
            </button>

            <button
              onClick={shareLink}
              className={`flex flex-col items-center gap-1 p-3 border-2 ${
                isDark
                  ? 'border-white/20 hover:border-white/40 text-white'
                  : 'border-black/20 hover:border-black/40 text-black'
              } transition-colors`}
            >
              <Share2 className="w-5 h-5" />
              <span className="text-[10px] font-bold">SHARE</span>
            </button>

            <button
              onClick={downloadQR}
              className={`flex flex-col items-center gap-1 p-3 border-2 ${
                isDark
                  ? 'border-white/20 hover:border-white/40 text-white'
                  : 'border-black/20 hover:border-black/40 text-black'
              } transition-colors`}
            >
              <Download className="w-5 h-5" />
              <span className="text-[10px] font-bold">SAVE QR</span>
            </button>
          </div>

          {/* Recipient Address */}
          <div className={`mt-4 p-3 border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
            <p
              className={`text-xs font-bold mb-1 ${
                isDark ? 'text-white/40' : 'text-black/40'
              }`}
            >
              RECIPIENT ADDRESS
            </p>
            <div className="flex items-center gap-2">
              <code
                className={`flex-1 font-mono text-[10px] truncate ${
                  isDark ? 'text-white/70' : 'text-black/70'
                }`}
              >
                {recipientAddress}
              </code>
              <button
                onClick={() => copyToClipboard(recipientAddress, 'address')}
                className={`p-2 border-2 ${
                  isDark
                    ? 'border-white/20 hover:border-white/40'
                    : 'border-black/20 hover:border-black/40'
                } transition-colors`}
              >
                {copied === 'address' ? (
                  <Check className="w-3 h-3 text-[#00FF88]" />
                ) : (
                  <Copy className={`w-3 h-3 ${isDark ? 'text-white' : 'text-black'}`} />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PaymentLinkQR;
