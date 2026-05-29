import { motion } from 'framer-motion';
import { Gauge, Navigation, BatteryCharging, AlertTriangle, Play, Square, Compass } from 'lucide-react';
import { useAlgorithmStore } from '../store/algorithmStore';
import { useUniverseStore } from '../store/universeStore';
import { UNIVERSE_DATA } from '../data/universeData';

export default function RocketTelemetry() {
  const { level, selectedGalaxy, selectedSystem } = useUniverseStore();
  const { 
    isFlying, 
    fuel, 
    isRefueling, 
    shortestPath, 
    currentSegmentIndex, 
    endNodeId,
    startNodeId,
    startFlight,
    resetAlgorithm
  } = useAlgorithmStore();

  // Telemetry is relevant at all levels except planet detail, when a path is computed
  if (level === 'planet' || shortestPath.length === 0) return null;

  const currentSegment = currentSegmentIndex;
  const totalSegments = shortestPath.length - 1;
  const isFinished = currentSegmentIndex >= totalSegments;

  const getSystemName = (id: string | null) => {
    if (!id) return 'Unknown';
    if (level === 'universe') {
      return UNIVERSE_DATA.find(g => g.id === id)?.name || 'Unknown';
    } else if (level === 'galaxy' && selectedGalaxy) {
      return selectedGalaxy.systems.find(s => s.id === id)?.name || 'Unknown';
    } else if (level === 'system' && selectedSystem) {
      if (id === selectedSystem.id) return `${selectedSystem.name} Star`;
      return selectedSystem.planets.find(p => p.id === id)?.name || 'Unknown';
    }
    return 'Unknown';
  };

  const startName = getSystemName(startNodeId);
  const targetName = getSystemName(endNodeId);
  
  const currentLegStart = getSystemName(shortestPath[currentSegment]);
  const currentLegEnd = getSystemName(shortestPath[currentSegment + 1] || null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed bottom-32 right-6 z-50 w-72"
    >
      <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Telemetry HUD</span>
          </div>
          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
            isRefueling 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
              : isFlying 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : isFinished
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {isRefueling ? 'REFUELING' : isFlying ? 'EN ROUTE' : isFinished ? 'DOCKED' : 'STANDBY'}
          </span>
        </div>

        {/* Dynamic Status Text */}
        <div className="space-y-1 font-mono">
          {isRefueling ? (
            <div className="text-xs text-amber-400 flex items-center gap-1.5 font-medium">
              <BatteryCharging className="w-4 h-4 animate-bounce" />
              Docked at {currentLegStart} — Refueling Cell...
            </div>
          ) : isFlying ? (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <Navigation className="w-4 h-4 animate-pulse" />
              Hoping: {currentLegStart} ➔ {currentLegEnd}
            </div>
          ) : isFinished ? (
            <div className="text-xs text-blue-400 font-medium">
              Mission Complete! Landed at {targetName}.
            </div>
          ) : (
            <div className="text-xs text-slate-350 font-medium">
              Course Set: {startName} ➔ {targetName}
            </div>
          )}
          
          {/* Progress bar */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentSegment / Math.max(totalSegments, 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1">
            <span className="truncate max-w-[80px]">START: {startName.split(' ')[0]}</span>
            <span>SEGMENT {currentSegment}/{totalSegments}</span>
            <span className="truncate max-w-[80px]">END: {targetName.split(' ')[0]}</span>
          </div>
        </div>

        {/* Telemetry Stats */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5 font-mono">Velocity</span>
            <span className="text-white font-mono font-medium flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              {isFlying && !isRefueling ? '0.85c (Hyper)' : '0.00c (Docked)'}
            </span>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5 font-mono">Reactor Status</span>
            <span className="text-white font-mono font-medium truncate">
              {isRefueling ? 'Charging Cell' : isFlying ? 'Core Emissive' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Fuel Economy System */}
        <div className="space-y-1.5 font-mono">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400 font-medium">Fuel Cells Power</span>
            <span className={`font-mono font-bold ${fuel < 30 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {fuel.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 p-0.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                fuel < 30 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${fuel}%` }}
            />
          </div>
          {fuel < 30 && !isRefueling && !isFinished && (
            <div className="text-[9px] text-red-400 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              Refuel stop scheduled at next junction node.
            </div>
          )}
        </div>

        {/* Launch / Traversal Controls */}
        <div className="flex gap-2 pt-1">
          {!isFlying && !isFinished ? (
            <button
              onClick={startFlight}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Launch Flight
            </button>
          ) : (
            <button
              onClick={resetAlgorithm}
              className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-350 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-800 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              Reset Trajectory
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
