"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Info, CheckCircle, Loader2 } from "lucide-react";
import { fetchXRayMetrics, type XRayMetrics } from "@/lib/xray";

interface ZKProofVisualizerProps {
  isDark?: boolean;
  proofData?: {
    id: string;
    status: string;
    type: string;
    curve: string;
    verificationTime: number;
    gasUsed: number;
  };
}

interface VerificationStep {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed';
  duration?: number;
  gasUsed?: number;
}

export function ZKProofVisualizer({ isDark = true, proofData }: ZKProofVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [metrics, setMetrics] = useState<XRayMetrics | null>(null);
  const animationRef = useRef<number>();
  const frameRef = useRef(0);

  const [steps, setSteps] = useState<VerificationStep[]>([
    { name: "Load Proof", description: "Loading verification key and proof points", status: 'pending' },
    { name: "G1 Scalar Mul", description: "Computing vk_x = IC[0] + Σ(input[i] × IC[i+1])", status: 'pending' },
    { name: "Point Addition", description: "Adding G1 points on BN254 curve", status: 'pending' },
    { name: "Negate A", description: "Computing -A for pairing equation", status: 'pending' },
    { name: "Multi-Pairing", description: "e(-A,B) × e(α,β) × e(vk_x,γ) × e(C,δ) = 1", status: 'pending' },
    { name: "Verified!", description: "Proof is cryptographically valid", status: 'pending' },
  ]);

  // Fetch live metrics
  const loadMetrics = useCallback(async () => {
    try {
      const data = await fetchXRayMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  // Start verification process
  const startVerification = useCallback(() => {
    setIsVerifying(true);
    setVerificationComplete(false);
    setCurrentStep(0);

    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));

    // Run through steps with realistic timing
    const stepDurations = [50, 150, 80, 30, 200, 50]; // ms for each step
    let totalDelay = 0;

    stepDurations.forEach((duration, idx) => {
      // Start step
      setTimeout(() => {
        setCurrentStep(idx);
        setSteps(prev => prev.map((step, i) => ({
          ...step,
          status: i === idx ? 'running' : i < idx ? 'completed' : 'pending',
          duration: i === idx ? duration : step.duration,
          gasUsed: i === idx ? Math.floor(Math.random() * 50000) + 10000 : step.gasUsed,
        })));
      }, totalDelay);

      // Complete step
      setTimeout(() => {
        setSteps(prev => prev.map((step, i) => ({
          ...step,
          status: i <= idx ? 'completed' : step.status,
        })));

        if (idx === stepDurations.length - 1) {
          setVerificationComplete(true);
          setIsVerifying(false);
        }
      }, totalDelay + duration);

      totalDelay += duration + 100; // Add gap between steps
    });
  }, []);

  const reset = () => {
    setIsVerifying(false);
    setVerificationComplete(false);
    setCurrentStep(-1);
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const, duration: undefined, gasUsed: undefined })));
    frameRef.current = 0;
  };

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const drawGrid = () => {
      ctx.strokeStyle = isDark ? "rgba(57, 255, 20, 0.05)" : "rgba(0, 170, 85, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
    };

    const drawEllipticCurve = () => {
      ctx.beginPath();
      ctx.strokeStyle = isDark ? "rgba(57, 255, 20, 0.3)" : "rgba(0, 170, 85, 0.3)";
      ctx.lineWidth = 2;

      // Draw BN254 curve representation: y² = x³ + 3
      for (let x = -120; x <= 120; x += 1) {
        const scaledX = x / 40;
        const y2 = scaledX * scaledX * scaledX + 3;
        if (y2 >= 0) {
          const y = Math.sqrt(y2) * 40;
          if (x === -120) {
            ctx.moveTo(centerX + x, centerY - y);
          } else {
            ctx.lineTo(centerX + x, centerY - y);
          }
        }
      }
      ctx.stroke();

      ctx.beginPath();
      for (let x = 120; x >= -120; x -= 1) {
        const scaledX = x / 40;
        const y2 = scaledX * scaledX * scaledX + 3;
        if (y2 >= 0) {
          const y = Math.sqrt(y2) * 40;
          if (x === 120) {
            ctx.moveTo(centerX + x, centerY + y);
          } else {
            ctx.lineTo(centerX + x, centerY + y);
          }
        }
      }
      ctx.stroke();
    };

    const drawPoint = (x: number, y: number, color: string, label: string, active: boolean = false) => {
      const size = active ? 10 + Math.sin(frameRef.current * 0.15) * 3 : 8;

      // Glow effect for active points
      if (active) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size + 15);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, size + 15, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Point
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isDark ? '#fff' : '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = isDark ? "#fff" : "#000";
      ctx.font = "bold 12px monospace";
      ctx.fillText(label, x + 15, y + 4);
    };

    const drawConnection = (x1: number, y1: number, x2: number, y2: number, color: string, progress: number = 1) => {
      const dx = (x2 - x1) * progress;
      const dy = (y2 - y1) * progress;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + dx, y1 + dy);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const animate = () => {
      ctx.fillStyle = isDark ? "#0A0A0A" : "#F5F5F5";
      ctx.fillRect(0, 0, width, height);

      drawGrid();
      drawEllipticCurve();

      // Proof points positions
      const points = [
        { x: centerX - 70, y: centerY - 50, label: "π.A", color: "#FF3366" },
        { x: centerX + 50, y: centerY - 30, label: "π.B", color: "#00D4FF" },
        { x: centerX + 70, y: centerY + 40, label: "π.C", color: "#39FF14" },
        { x: centerX - 30, y: centerY + 60, label: "vk_x", color: "#FFD600" },
      ];

      // Draw connections based on verification progress
      if (currentStep >= 1) {
        // IC point connections
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 + frameRef.current * 0.02;
          const radius = 30;
          const px = centerX + Math.cos(angle) * radius;
          const py = centerY + Math.sin(angle) * radius;
          drawPoint(px, py, "#FF10F0", `IC${i}`, currentStep === 1);
        }
      }

      if (currentStep >= 2) {
        drawConnection(points[0].x, points[0].y, points[3].x, points[3].y, "rgba(255, 214, 0, 0.5)");
      }

      if (currentStep >= 3) {
        // Negated A point
        const negAY = centerY + (centerY - points[0].y);
        drawPoint(points[0].x, negAY, "#FF3366", "-A", currentStep === 3);
        drawConnection(points[0].x, points[0].y, points[0].x, negAY, "rgba(255, 51, 102, 0.3)");
      }

      if (currentStep >= 4) {
        // Pairing connections
        points.forEach((p, i) => {
          if (i < points.length - 1) {
            const alpha = 0.3 + Math.sin(frameRef.current * 0.1) * 0.2;
            drawConnection(p.x, p.y, points[i + 1].x, points[i + 1].y, `rgba(57, 255, 20, ${alpha})`);
          }
        });
      }

      // Draw main points
      points.forEach((p, i) => {
        const isActive = (currentStep === 1 && i === 3) ||
                        (currentStep === 2 && i <= 1) ||
                        (currentStep === 3 && i === 0) ||
                        (currentStep >= 4);
        drawPoint(p.x, p.y, p.color, p.label, isActive);
      });

      // Verification complete indicator
      if (verificationComplete) {
        ctx.fillStyle = "#39FF14";
        ctx.font = "bold 16px monospace";
        const text = "✓ PROOF VERIFIED";
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, centerX - textWidth / 2, 25);

        // Success ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, 90 + Math.sin(frameRef.current * 0.1) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(57, 255, 20, ${0.4 + Math.sin(frameRef.current * 0.1) * 0.2})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Axis labels
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
      ctx.font = "10px monospace";
      ctx.fillText("BN254 G1", 10, height - 10);
      ctx.fillText(`Frame: ${frameRef.current}`, width - 80, height - 10);

      frameRef.current++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDark, currentStep, verificationComplete]);

  const totalGasUsed = steps.reduce((acc, step) => acc + (step.gasUsed || 0), 0);
  const totalDuration = steps.reduce((acc, step) => acc + (step.duration || 0), 0);

  return (
    <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-[#00D4FF]' : 'border-black bg-[#0099CC]'}`}>
        <div className="flex items-center justify-between">
          <span className="font-black text-black">GROTH16_VERIFIER.EXE</span>
          <div className="flex items-center gap-2">
            {!isVerifying && !verificationComplete && (
              <button
                onClick={startVerification}
                className="flex items-center gap-2 px-4 py-1 bg-black text-white font-black text-xs"
              >
                <Play className="w-3 h-3" />
                VERIFY
              </button>
            )}
            {isVerifying && (
              <div className="flex items-center gap-2 px-4 py-1 bg-[#39FF14] text-black font-black text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                VERIFYING...
              </div>
            )}
            {verificationComplete && (
              <div className="flex items-center gap-2 px-4 py-1 bg-[#39FF14] text-black font-black text-xs">
                <CheckCircle className="w-3 h-3" />
                VERIFIED
              </div>
            )}
            <button
              onClick={reset}
              className="w-8 h-8 bg-black text-white flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`w-8 h-8 flex items-center justify-center ${showInfo ? 'bg-white text-black' : 'bg-black text-white'}`}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={280}
          className="w-full"
        />

        {/* Info overlay */}
        {showInfo && (
          <div className={`absolute inset-0 ${isDark ? 'bg-black/95' : 'bg-white/95'} p-6 overflow-y-auto`}>
            <h4 className={`font-black mb-4 ${isDark ? 'text-white' : 'text-black'}`}>GROTH16 VERIFICATION ON BN254</h4>
            <div className="space-y-3 text-sm">
              <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                <span className="text-[#FF3366] font-bold">π.A, π.B, π.C</span> - Proof points generated by prover
              </p>
              <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                <span className="text-[#FFD600] font-bold">vk_x</span> - Computed from public inputs × IC points
              </p>
              <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                <span className="text-[#FF10F0] font-bold">IC[i]</span> - Verification key commitment points
              </p>
              <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                <span className="text-[#39FF14] font-bold">Pairing Check</span> - e(-A,B) × e(α,β) × e(vk_x,γ) × e(C,δ) = 1
              </p>
              <div className={`mt-4 p-3 border ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  X-Ray Protocol enables native BN254 operations on Stellar, making Groth16 verification ~94% cheaper than WASM.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification Steps */}
      <div className={`p-4 border-t-4 ${isDark ? 'border-white' : 'border-black'}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>VERIFICATION STEPS</span>
          {verificationComplete && (
            <div className="flex items-center gap-4 text-xs">
              <span className={isDark ? 'text-white/50' : 'text-black/50'}>
                Time: <span className="text-[#39FF14] font-black">{totalDuration}ms</span>
              </span>
              <span className={isDark ? 'text-white/50' : 'text-black/50'}>
                Gas: <span className="text-[#00D4FF] font-black">{totalGasUsed.toLocaleString()}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex-shrink-0 px-3 py-2 border-2 transition-all ${
                step.status === 'completed'
                  ? 'border-[#39FF14] bg-[#39FF14]/20'
                  : step.status === 'running'
                  ? 'border-[#FFD600] bg-[#FFD600]/20 animate-pulse'
                  : `${isDark ? 'border-white/20' : 'border-black/20'}`
              }`}
            >
              <div className="flex items-center gap-2">
                {step.status === 'completed' && <CheckCircle className="w-3 h-3 text-[#39FF14]" />}
                {step.status === 'running' && <Loader2 className="w-3 h-3 text-[#FFD600] animate-spin" />}
                <p className={`text-xs font-black ${
                  step.status === 'completed' ? 'text-[#39FF14]' :
                  step.status === 'running' ? 'text-[#FFD600]' :
                  isDark ? 'text-white/50' : 'text-black/50'
                }`}>
                  {step.name}
                </p>
              </div>
              {step.duration && (
                <p className={`text-[10px] mt-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                  {step.duration}ms
                </p>
              )}
            </div>
          ))}
        </div>
        <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          {currentStep >= 0 && currentStep < steps.length ? steps[currentStep].description : 'Click VERIFY to start proof verification'}
        </p>
      </div>

      {/* Live Stats */}
      {metrics && (
        <div className={`px-4 py-3 border-t-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
          <div className="flex items-center justify-between text-xs">
            <span className={isDark ? 'text-white/40' : 'text-black/40'}>
              Total Proofs Verified: <span className="text-[#39FF14] font-bold">{metrics.proofsVerified.toLocaleString()}</span>
            </span>
            <span className={isDark ? 'text-white/40' : 'text-black/40'}>
              Success Rate: <span className="text-[#39FF14] font-bold">{metrics.successRate.toFixed(1)}%</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ZKProofVisualizer;
