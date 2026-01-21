"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Plus, X, Zap, Info } from "lucide-react";

interface BN254CurveExplorerProps {
  isDark?: boolean;
}

interface Point {
  x: number;
  y: number;
  label: string;
  color: string;
}

interface Operation {
  id: string;
  type: 'add' | 'mul' | 'pairing';
  points: string[];
  result?: Point;
  status: 'pending' | 'running' | 'completed';
  gasUsed?: number;
  duration?: number;
}

export function BN254CurveExplorer({ isDark = true }: BN254CurveExplorerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([
    { x: 0.5, y: 0.7, label: 'P', color: '#FF3366' },
    { x: 1.2, y: 0.9, label: 'Q', color: '#00D4FF' },
  ]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<'add' | 'mul' | 'pairing'>('add');
  const [scalar, setScalar] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const animationRef = useRef<number>();
  const frameRef = useRef(0);

  // Elliptic curve: y² = x³ + 3 (BN254)
  const curveY = (x: number): number | null => {
    const y2 = x * x * x + 3;
    if (y2 < 0) return null;
    return Math.sqrt(y2);
  };

  // Point addition (simplified visualization)
  const addPoints = (p1: Point, p2: Point): Point => {
    // Simplified point addition for visualization
    const newX = (p1.x + p2.x) / 2 + 0.3;
    const y = curveY(newX);
    return {
      x: newX,
      y: y !== null ? -y : 0,
      label: `${p1.label}+${p2.label}`,
      color: '#39FF14',
    };
  };

  // Scalar multiplication (simplified visualization)
  const multiplyPoint = (p: Point, k: number): Point => {
    const newX = p.x * (1 + k * 0.1);
    const y = curveY(newX);
    return {
      x: newX,
      y: y !== null ? y * (k % 2 === 0 ? 1 : -1) : 0,
      label: `${k}${p.label}`,
      color: '#FFD600',
    };
  };

  // Execute operation
  const executeOperation = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);

    const newOp: Operation = {
      id: Date.now().toString(),
      type: selectedOperation,
      points: selectedOperation === 'mul' ? [points[0].label] : [points[0].label, points[1].label],
      status: 'pending',
    };

    setOperations(prev => [...prev, newOp]);

    // Simulate operation execution
    setTimeout(() => {
      setOperations(prev => prev.map(op =>
        op.id === newOp.id ? { ...op, status: 'running' } : op
      ));
    }, 100);

    setTimeout(() => {
      let result: Point;

      if (selectedOperation === 'add') {
        result = addPoints(points[0], points[1]);
      } else if (selectedOperation === 'mul') {
        result = multiplyPoint(points[0], scalar);
      } else {
        // Pairing - just show a result point
        result = {
          x: 1.5,
          y: 1.2,
          label: 'e(P,Q)',
          color: '#FF10F0',
        };
      }

      setOperations(prev => prev.map(op =>
        op.id === newOp.id
          ? {
              ...op,
              status: 'completed',
              result,
              gasUsed: selectedOperation === 'pairing' ? 150000 : selectedOperation === 'mul' ? 45000 : 15000,
              duration: selectedOperation === 'pairing' ? 8 : selectedOperation === 'mul' ? 3 : 1,
            }
          : op
      ));

      // Add result point to canvas
      setPoints(prev => [...prev, result]);
      setIsRunning(false);
    }, 500 + Math.random() * 500);
  }, [isRunning, selectedOperation, points, scalar]);

  // Reset
  const reset = () => {
    setPoints([
      { x: 0.5, y: 0.7, label: 'P', color: '#FF3366' },
      { x: 1.2, y: 0.9, label: 'Q', color: '#00D4FF' },
    ]);
    setOperations([]);
    frameRef.current = 0;
  };

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Coordinate transformation
    const scale = 60;
    const offsetX = width / 2 - 50;
    const offsetY = height / 2;

    const toCanvas = (x: number, y: number) => ({
      x: offsetX + x * scale,
      y: offsetY - y * scale,
    });

    const animate = () => {
      ctx.fillStyle = isDark ? "#0A0A0A" : "#F5F5F5";
      ctx.fillRect(0, 0, width, height);

      // Draw grid
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

      // Draw axes
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, offsetY);
      ctx.lineTo(width, offsetY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(offsetX, 0);
      ctx.lineTo(offsetX, height);
      ctx.stroke();

      // Draw curve y² = x³ + 3
      ctx.beginPath();
      ctx.strokeStyle = isDark ? "rgba(57, 255, 20, 0.4)" : "rgba(0, 170, 85, 0.4)";
      ctx.lineWidth = 2;

      // Upper branch
      let started = false;
      for (let px = -2; px <= 3; px += 0.02) {
        const y = curveY(px);
        if (y !== null) {
          const canvasPos = toCanvas(px, y);
          if (!started) {
            ctx.moveTo(canvasPos.x, canvasPos.y);
            started = true;
          } else {
            ctx.lineTo(canvasPos.x, canvasPos.y);
          }
        }
      }
      ctx.stroke();

      // Lower branch
      ctx.beginPath();
      started = false;
      for (let px = -2; px <= 3; px += 0.02) {
        const y = curveY(px);
        if (y !== null) {
          const canvasPos = toCanvas(px, -y);
          if (!started) {
            ctx.moveTo(canvasPos.x, canvasPos.y);
            started = true;
          } else {
            ctx.lineTo(canvasPos.x, canvasPos.y);
          }
        }
      }
      ctx.stroke();

      // Draw connections for recent operations
      operations.slice(-3).forEach(op => {
        if (op.status === 'completed' && op.result) {
          const involvedPoints = points.filter(p => op.points.includes(p.label));
          involvedPoints.forEach(p => {
            const start = toCanvas(p.x, p.y);
            const end = toCanvas(op.result!.x, op.result!.y);

            ctx.beginPath();
            ctx.strokeStyle = `rgba(57, 255, 20, ${0.3 + Math.sin(frameRef.current * 0.1) * 0.2})`;
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1;
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            ctx.setLineDash([]);
          });
        }
      });

      // Draw points
      points.forEach((point, idx) => {
        const pos = toCanvas(point.x, point.y);
        const isNew = idx >= points.length - 1 && operations.length > 0;
        const pulse = isNew ? Math.sin(frameRef.current * 0.15) * 4 : 0;
        const size = 8 + pulse;

        // Glow effect
        if (isNew || idx < 2) {
          const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size + 15);
          gradient.addColorStop(0, point.color);
          gradient.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, size + 15, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Point circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = point.color;
        ctx.fill();
        ctx.strokeStyle = isDark ? '#fff' : '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = isDark ? '#fff' : '#000';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(point.label, pos.x + 12, pos.y - 8);

        // Coordinates
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
        ctx.font = '9px monospace';
        ctx.fillText(`(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`, pos.x + 12, pos.y + 5);
      });

      // Curve label
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
      ctx.font = '10px monospace';
      ctx.fillText('y² = x³ + 3 (BN254)', 10, height - 10);

      frameRef.current++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDark, points, operations]);

  return (
    <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-[#00D4FF]' : 'border-black bg-[#0099CC]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-black" />
            <span className="font-black text-black">BN254_CURVE.EXPLORER</span>
          </div>
          <div className="flex items-center gap-2">
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

      <div className="grid md:grid-cols-3 gap-0">
        {/* Canvas */}
        <div className={`md:col-span-2 relative border-r-0 md:border-r-4 ${isDark ? 'border-white' : 'border-black'}`}>
          <canvas
            ref={canvasRef}
            width={400}
            height={280}
            className="w-full"
          />

          {showInfo && (
            <div className={`absolute inset-0 ${isDark ? 'bg-black/95' : 'bg-white/95'} p-4 overflow-y-auto`}>
              <h4 className={`font-black mb-3 ${isDark ? 'text-white' : 'text-black'}`}>BN254 CURVE OPERATIONS</h4>
              <div className="space-y-2 text-xs">
                <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                  <span className="text-[#FF3366] font-bold">Point Addition (P+Q)</span><br/>
                  Adds two points on the curve. Used in multi-scalar multiplication.
                  <br/><span className="text-[#39FF14]">Gas: ~15,000</span>
                </p>
                <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                  <span className="text-[#FFD600] font-bold">Scalar Multiplication (kP)</span><br/>
                  Multiplies a point by a scalar. Core operation for verification.
                  <br/><span className="text-[#39FF14]">Gas: ~45,000</span>
                </p>
                <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                  <span className="text-[#FF10F0] font-bold">Pairing e(P,Q)</span><br/>
                  Bilinear map to target group. Used in Groth16 verification.
                  <br/><span className="text-[#39FF14]">Gas: ~150,000</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4">
          <p className={`text-xs font-black mb-3 ${isDark ? 'text-white/50' : 'text-black/50'}`}>OPERATION</p>

          {/* Operation selector */}
          <div className="flex flex-col gap-2 mb-4">
            {[
              { id: 'add', label: 'P + Q', icon: Plus, color: '#39FF14' },
              { id: 'mul', label: `${scalar}P`, icon: X, color: '#FFD600' },
              { id: 'pairing', label: 'e(P,Q)', icon: Zap, color: '#FF10F0' },
            ].map((op) => (
              <button
                key={op.id}
                onClick={() => setSelectedOperation(op.id as any)}
                className={`flex items-center gap-2 px-3 py-2 border-2 text-xs font-black transition-all ${
                  selectedOperation === op.id
                    ? `border-[${op.color}] bg-[${op.color}]/20`
                    : `${isDark ? 'border-white/20 hover:border-white/50' : 'border-black/20 hover:border-black/50'}`
                }`}
                style={selectedOperation === op.id ? { borderColor: op.color, backgroundColor: `${op.color}20` } : {}}
              >
                <op.icon className="w-3 h-3" style={{ color: op.color }} />
                <span style={{ color: selectedOperation === op.id ? op.color : undefined }}>{op.label}</span>
              </button>
            ))}
          </div>

          {/* Scalar input for multiplication */}
          {selectedOperation === 'mul' && (
            <div className="mb-4">
              <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>SCALAR (k)</p>
              <input
                type="range"
                min="2"
                max="10"
                value={scalar}
                onChange={(e) => setScalar(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-center text-lg font-black text-[#FFD600]">{scalar}</p>
            </div>
          )}

          {/* Execute button */}
          <button
            onClick={executeOperation}
            disabled={isRunning}
            className={`w-full flex items-center justify-center gap-2 py-3 border-4 font-black text-sm transition-all ${
              isRunning
                ? 'border-gray-500 bg-gray-500/20 text-gray-500'
                : 'border-[#39FF14] bg-[#39FF14] text-black hover:bg-[#39FF14]/80'
            }`}
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'COMPUTING...' : 'EXECUTE'}
          </button>

          {/* Operation history */}
          {operations.length > 0 && (
            <div className="mt-4">
              <p className={`text-xs font-black mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>HISTORY</p>
              <div className="space-y-1 max-h-[100px] overflow-y-auto">
                {operations.slice().reverse().map((op) => (
                  <div
                    key={op.id}
                    className={`text-[10px] px-2 py-1 border ${isDark ? 'border-white/10' : 'border-black/10'} ${
                      op.status === 'completed' ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <span className="text-[#39FF14]">{op.type.toUpperCase()}</span>
                    {op.duration && <span className={isDark ? 'text-white/40' : 'text-black/40'}> • {op.duration}ms</span>}
                    {op.gasUsed && <span className={isDark ? 'text-white/40' : 'text-black/40'}> • {op.gasUsed.toLocaleString()} gas</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BN254CurveExplorer;
