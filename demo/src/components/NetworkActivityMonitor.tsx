"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Activity, Zap, Shield, Hash, Cpu, Globe, Signal, RefreshCw } from "lucide-react";
import { fetchXRayMetrics, type XRayMetrics } from "@/lib/xray";

interface NetworkActivityMonitorProps {
  isDark?: boolean;
}

interface LiveEvent {
  id: string;
  type: 'proof_verified' | 'pairing_check' | 'poseidon_hash' | 'g1_operation';
  operation: string;
  timestamp: string;
  proofId: string;
  gasUsed: number;
  duration: number;
  blockNumber: number;
  status: string;
}

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  active: boolean;
  pulsePhase: number;
}

export function NetworkActivityMonitor({ isDark = true }: NetworkActivityMonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metrics, setMetrics] = useState<XRayMetrics | null>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [tps, setTps] = useState(0);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const frameRef = useRef(0);
  const lastEventIdRef = useRef<string | null>(null);

  // Initialize network nodes
  useEffect(() => {
    const initialNodes: NetworkNode[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 80;
      initialNodes.push({
        id: `node-${i}`,
        x: 150 + Math.cos(angle) * radius,
        y: 100 + Math.sin(angle) * radius,
        active: Math.random() > 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    setNodes(initialNodes);
  }, []);

  // Fetch metrics from API
  const loadMetrics = useCallback(async () => {
    try {
      const data = await fetchXRayMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to fetch metrics');
    }
  }, []);

  // Fetch live events from API
  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/xray/events?limit=10');
      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();

      // Update TPS from API
      setTps(data.tps || 0);

      // Check if we have new events
      if (data.events && data.events.length > 0) {
        const newEvents = data.events as LiveEvent[];

        // Only update if we have new events
        if (!lastEventIdRef.current || newEvents[0].id !== lastEventIdRef.current) {
          lastEventIdRef.current = newEvents[0].id;
          setLiveEvents(newEvents);

          // Activate a random node when new event arrives
          setNodes(prev => prev.map((node, idx) => ({
            ...node,
            active: idx === Math.floor(Math.random() * prev.length) ? true : node.active,
          })));
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch live events');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    loadEvents();

    const metricsInterval = setInterval(loadMetrics, 5000);
    const eventsInterval = setInterval(loadEvents, 1500);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(eventsInterval);
    };
  }, [loadMetrics, loadEvents]);

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

    const animate = () => {
      ctx.fillStyle = isDark ? "#0A0A0A" : "#F5F5F5";
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = isDark ? "rgba(57, 255, 20, 0.03)" : "rgba(0, 170, 85, 0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 15) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Draw connections between nodes
      nodes.forEach((node, i) => {
        nodes.forEach((otherNode, j) => {
          if (i < j && Math.random() > 0.7) {
            const alpha = 0.1 + Math.sin(frameRef.current * 0.02 + i) * 0.05;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(57, 255, 20, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.stroke();
          }
        });
      });

      // Draw center hub
      const hubPulse = Math.sin(frameRef.current * 0.05) * 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20 + hubPulse, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30 + hubPulse);
      gradient.addColorStop(0, "#39FF14");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#39FF14";
      ctx.fill();

      // Draw X-Ray logo in center
      ctx.fillStyle = "#000";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("X", centerX, centerY + 4);

      // Draw nodes
      nodes.forEach((node) => {
        const pulse = Math.sin(frameRef.current * 0.1 + node.pulsePhase) * 3;
        const size = node.active ? 8 + pulse : 5;

        // Glow for active nodes
        if (node.active) {
          const nodeGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size + 10);
          nodeGradient.addColorStop(0, "rgba(57, 255, 20, 0.5)");
          nodeGradient.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 10, 0, Math.PI * 2);
          ctx.fillStyle = nodeGradient;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fillStyle = node.active ? "#39FF14" : isDark ? "#333" : "#ccc";
        ctx.fill();

        // Connection to center
        if (node.active && Math.random() > 0.95) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(57, 255, 20, 0.8)";
          ctx.lineWidth = 2;
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(centerX, centerY);
          ctx.stroke();
        }
      });

      // Draw data packets traveling
      const packetCount = 3;
      for (let i = 0; i < packetCount; i++) {
        const progress = ((frameRef.current * 0.02 + i * 0.33) % 1);
        const nodeIdx = Math.floor(i * nodes.length / packetCount);
        const node = nodes[nodeIdx];
        if (node && node.active) {
          const px = node.x + (centerX - node.x) * progress;
          const py = node.y + (centerY - node.y) * progress;

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#00D4FF";
          ctx.fill();
        }
      }

      // Stats overlay
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Nodes: ${nodes.filter(n => n.active).length}/${nodes.length}`, 10, 15);
      ctx.fillText(`Events: ${liveEvents.length}`, 10, 28);

      frameRef.current++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDark, nodes, liveEvents.length]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'proof_verified': return Shield;
      case 'pairing_check': return Cpu;
      case 'poseidon_hash': return Hash;
      case 'g1_operation': return Zap;
      default: return Activity;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'proof_verified': return '#39FF14';
      case 'pairing_check': return '#00D4FF';
      case 'poseidon_hash': return '#FF10F0';
      case 'g1_operation': return '#FFD600';
      default: return '#39FF14';
    }
  };

  const formatTimestamp = (timestamp: string, idx: number) => {
    if (idx === 0) return 'NOW';
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  return (
    <div className={`border-4 ${isDark ? 'border-white' : 'border-black'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b-4 ${isDark ? 'border-white bg-[#39FF14]' : 'border-black bg-[#00AA55]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-black" />
            <span className="font-black text-black">NETWORK_ACTIVITY.LIVE</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-black" />
              <span className="text-xs font-black text-black">{tps} TPS</span>
            </div>
            {loading && <RefreshCw className="w-4 h-4 text-black animate-spin" />}
            <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/20 text-red-500 text-xs font-bold">
          {error} - Retrying...
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-0">
        {/* Network Visualization */}
        <div className={`border-r-0 md:border-r-4 ${isDark ? 'border-white' : 'border-black'}`}>
          <canvas
            ref={canvasRef}
            width={300}
            height={200}
            className="w-full"
          />

          {/* Network Stats */}
          <div className={`p-4 border-t-4 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-black text-[#39FF14]">
                  {metrics?.proofsVerified?.toLocaleString() || '---'}
                </p>
                <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>PROOFS</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#00D4FF]">
                  {metrics?.bn254Operations?.toLocaleString() || '---'}
                </p>
                <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>BN254 OPS</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#FF10F0]">
                  {metrics?.poseidonHashes?.toLocaleString() || '---'}
                </p>
                <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>POSEIDON</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="flex flex-col">
          <div className={`px-4 py-2 border-b-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black ${isDark ? 'text-white/50' : 'text-black/50'}`}>LIVE FEED</span>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#39FF14]" />
                <span className="text-[10px] text-[#39FF14]">STREAMING</span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-h-[200px] overflow-y-auto">
            {liveEvents.length === 0 ? (
              <div className={`flex items-center justify-center h-full ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                <span className="text-xs">Loading events...</span>
              </div>
            ) : (
              liveEvents.map((event, idx) => {
                const Icon = getEventIcon(event.type);
                const color = getEventColor(event.type);

                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 px-4 py-2 transition-all ${
                      idx === 0 ? 'animate-pulse' : ''
                    } ${idx > 0 ? `border-t ${isDark ? 'border-white/5' : 'border-black/5'}` : ''}`}
                    style={idx === 0 ? { animationDuration: '1s' } : {}}
                  >
                    <div
                      className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="w-3 h-3 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>
                        {event.operation}
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        {event.duration}ms • {event.gasUsed.toLocaleString()} gas
                      </p>
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                      {formatTimestamp(event.timestamp, idx)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkActivityMonitor;
