import { useEffect, useState } from 'react';
import { Network, Zap, Activity, Play, Square, RotateCcw, Cpu, Crosshair, Sliders, Shield, RotateCw } from 'lucide-react';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore, AlgorithmType } from '../store/algorithmStore';
import { UNIVERSE_DATA } from '../data/universeData';

const algorithms = [
  {
    id: 'astar' as AlgorithmType,
    name: "A* Algorithm",
    subtitle: "Fastest route with heuristics",
    description: "Goal-directed coordinate search. Uses Euclidean distance heuristic to target the destination quickly.",
    timeComplexity: "O(E log V)",
    spaceComplexity: "O(V)",
    icon: Zap,
    color: "text-cyan-400",
    borderClass: "border-cyan-500/30 peer-checked:border-cyan-400 bg-cyan-950/10"
  },
  {
    id: 'dijkstra' as AlgorithmType,
    name: "Bellman Ford / Dijkstra",
    subtitle: "Optimal for search weights",
    description: "Uniform priority frontier expansion. Finds exact shortest path under active segment weights.",
    timeComplexity: "O(V² + E)",
    spaceComplexity: "O(V)",
    icon: Network,
    color: "text-indigo-400",
    borderClass: "border-indigo-500/30 peer-checked:border-indigo-400 bg-indigo-950/10"
  },
  {
    id: 'kruskal' as AlgorithmType,
    name: "Genetic Algorithm / Kruskal",
    subtitle: "Best for complex network MST",
    description: "Builds a Minimum Spanning Tree connecting all systems with minimal total fuel without cycles.",
    timeComplexity: "O(E log E)",
    spaceComplexity: "O(V + E)",
    icon: Activity,
    color: "text-pink-400",
    borderClass: "border-pink-500/30 peer-checked:border-pink-400 bg-pink-950/10"
  }
];

function RocketSchematic({ diagState, scannedIndex }: { diagState: string, scannedIndex: number }) {
  const getPartColor = (idx: number) => {
    if (diagState === 'ready') return '#10b981'; // nominal green
    if (diagState === 'scanning') {
      if (idx < scannedIndex) return '#10b981'; // nominal green
      if (idx === scannedIndex) return '#06b6d4'; // scanning cyan
    }
    return '#334155'; // pending grey
  };

  const c0 = getPartColor(0); // Core
  const c1 = getPartColor(1); // Shield
  const c2 = getPartColor(2); // Radiator Wings
  const c3 = getPartColor(3); // RCS Beacons
  const c4 = getPartColor(4); // Exhaust Manifolds
  const c5 = getPartColor(5); // Ion Cells

  return (
    <svg width="55" height="85" viewBox="0 0 60 95" className="flex-shrink-0 select-none">
      {/* Deflector Shield (index 1) */}
      <ellipse 
        cx="30" 
        cy="45" 
        rx="26" 
        ry="42" 
        fill="none" 
        stroke={c1} 
        strokeWidth="1" 
        strokeDasharray="2,3" 
        className={diagState === 'scanning' && scannedIndex === 1 ? 'animate-pulse' : ''}
        style={{ filter: c1 !== '#334155' ? 'drop-shadow(0 0 3px rgba(6,182,212,0.4))' : 'none' }}
      />

      {/* Radiator Wings (index 2) */}
      <path 
        d="M 20 35 L 7 48 L 7 65 L 20 58 Z" 
        fill="none" 
        stroke={c2} 
        strokeWidth="1" 
        style={{ filter: c2 !== '#334155' ? 'drop-shadow(0 0 2px rgba(16,185,129,0.3))' : 'none' }}
      />
      <path 
        d="M 40 35 L 53 48 L 53 65 L 40 58 Z" 
        fill="none" 
        stroke={c2} 
        strokeWidth="1" 
        style={{ filter: c2 !== '#334155' ? 'drop-shadow(0 0 2px rgba(16,185,129,0.3))' : 'none' }}
      />

      {/* Hull Structure */}
      <path d="M 30 14 L 20 28 L 20 62 L 40 62 L 40 28 Z" fill="#0b1329" stroke="#475569" strokeWidth="1" />

      {/* FTL Warp Drive Core (index 0) */}
      <rect 
        x="27" 
        y="30" 
        width="6" 
        height="22" 
        rx="1" 
        fill={c0} 
        className={diagState === 'scanning' && scannedIndex === 0 ? 'animate-pulse' : ''}
        style={{ filter: c0 !== '#334155' ? 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' : 'none' }}
      />

      {/* Ion Thruster Cells (index 5) */}
      <rect x="16" y="52" width="4" height="10" rx="0.5" fill="none" stroke={c5} strokeWidth="1" />
      <rect x="40" y="52" width="4" height="10" rx="0.5" fill="none" stroke={c5} strokeWidth="1" />

      {/* Triple Exhaust Manifolds (index 4) */}
      <path d="M 27 62 L 25 67 L 35 67 L 33 62 Z" fill="none" stroke={c4} strokeWidth="1" />
      <path d="M 17 62 L 16 65 L 20 65 L 19 62 Z" fill="none" stroke={c4} strokeWidth="0.8" />
      <path d="M 43 62 L 42 65 L 40 65 L 41 62 Z" fill="none" stroke={c4} strokeWidth="0.8" />

      {/* Engine Flames when fully nominal / scanned */}
      {(diagState === 'ready' || (diagState === 'scanning' && scannedIndex > 4)) && (
        <g>
          <path d="M 28 69 L 30 79 L 32 69 Z" fill="#10b981" opacity="0.8" className="animate-pulse" />
          <path d="M 17 67 L 18 72 L 19 67 Z" fill="#10b981" opacity="0.6" />
          <path d="M 42 67 L 41 72 L 40 67 Z" fill="#10b981" opacity="0.6" />
        </g>
      )}

      {/* RCS Navigation Beacons (index 3) */}
      <circle cx="30" cy="12" r="1.8" fill={c3} className={diagState === 'scanning' && scannedIndex === 3 ? 'animate-ping' : ''} />
      <circle cx="7" cy="48" r="1.2" fill={c3} />
      <circle cx="53" cy="48" r="1.2" fill={c3} />
    </svg>
  );
}

interface MissionControlProps {
  onOpenTheory: () => void;
}

export default function MissionControl({ onOpenTheory }: MissionControlProps) {
  const { level, selectedGalaxy, selectedSystem } = useUniverseStore();
  const {
    selectedAlgorithm,
    startNodeId,
    endNodeId,
    isRunning,
    edges,
    useWormholes,
    avoidAnomalies,
    optimiseFuel,
    highSpeedCorridors,
    setAlgorithm,
    setStartNode,
    setEndNode,
    runAlgorithm,
    resetAlgorithm,
    toggleRouteOption,
    selectionMode,
    setSelectionMode,
    stepForward,
    courseLocked,
    setCourse,
    clearCourse,
    isFlying,
    startFlight,
    stopFlight,
    rocketSpeedFactor,
    setRocketSpeedFactor,
    cinematicCamera,
    setCinematicCamera,
    shortestPath,
    isRefueling,
    shieldActive,
    setShieldActive,
    engineColor,
    setEngineColor,
    gravityOverdrive,
    setGravityOverdrive
  } = useAlgorithmStore();

  const [diagState, setDiagState] = useState<'pending' | 'scanning' | 'ready'>('pending');
  const [scannedIndex, setScannedIndex] = useState(-1);

  const ROCKET_PARTS = [
    { name: "FTL Warp Drive Core", desc: "Stabilizes space-time folding grid" },
    { name: "Deflector Shield Projector", desc: "Blocks cosmic dust and asteroids" },
    { name: "Radiator Heat Grids", desc: "Dissipates thermal core friction" },
    { name: "RCS Navigation Beacons", desc: "Calibrates vector approach lights" },
    { name: "Triple Exhaust Manifolds", desc: "Balances antimatter plasma thrust" },
    { name: "Ion Thruster Cells", desc: "Regulates low-velocity sub-light speed" }
  ];

  // Reset diagnostics when course changes or clears
  useEffect(() => {
    if (shortestPath.length < 2) {
      setDiagState('pending');
      setScannedIndex(-1);
    }
  }, [shortestPath]);

  // Run diagnostics sequence
  useEffect(() => {
    let t: any = null;
    if (diagState === 'scanning') {
      t = setInterval(() => {
        setScannedIndex(prev => {
          const next = prev + 1;
          if (next >= ROCKET_PARTS.length) {
            clearInterval(t);
            setDiagState('ready');
            return ROCKET_PARTS.length;
          }
          return next;
        });
      }, 350);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [diagState]);

  // Helper to compute node start coordinate
  const getStartNodePosition = (): [number, number, number] | null => {
    if (!startNodeId) return null;
    if (level === 'universe') {
      const gal = UNIVERSE_DATA.find(g => g.id === startNodeId);
      return gal ? gal.position : null;
    }
    if (level === 'galaxy' && selectedGalaxy) {
      const sys = selectedGalaxy.systems.find(s => s.id === startNodeId);
      return sys ? sys.position : null;
    }
    if (level === 'system' && selectedSystem) {
      if (startNodeId === selectedSystem.id) return [0, 0, 0];
      const idx = selectedSystem.planets.findIndex(p => p.id === startNodeId);
      if (idx !== -1) {
        const planet = selectedSystem.planets[idx];
        const angle = idx * Math.PI * 0.7;
        return [
          Math.cos(angle) * planet.orbitRadius,
          0,
          Math.sin(angle) * planet.orbitRadius
        ];
      }
    }
    return null;
  };

  // Step-by-step pathfinding visual animation driver
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        const hasNext = stepForward();
        if (!hasNext) {
          clearInterval(interval);
          
          // Auto lock course and launch flight if a valid path is found
          const state = useAlgorithmStore.getState();
          if (state.shortestPath.length >= 2) {
            let startPos: [number, number, number] | null = null;
            const startId = state.startNodeId;
            if (startId) {
              if (level === 'universe') {
                const gal = UNIVERSE_DATA.find(g => g.id === startId);
                if (gal) startPos = gal.position;
              } else if (level === 'galaxy' && selectedGalaxy) {
                const sys = selectedGalaxy.systems.find(s => s.id === startId);
                if (sys) startPos = sys.position;
              } else if (level === 'system' && selectedSystem) {
                if (startId === selectedSystem.id) {
                  startPos = [0, 0, 0];
                } else {
                  const idx = selectedSystem.planets.findIndex(p => p.id === startId);
                  if (idx !== -1) {
                    const planet = selectedSystem.planets[idx];
                    const angle = idx * Math.PI * 0.7;
                    startPos = [
                      Math.cos(angle) * planet.orbitRadius,
                      0,
                      Math.sin(angle) * planet.orbitRadius
                    ];
                  }
                }
              }
            }
            if (startPos) {
              state.setCourse(startPos);
            }
          }
        }
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, stepForward, level, selectedGalaxy, selectedSystem]);

  if (level === 'planet') return null;

  const getAvailableNodes = () => {
    const list: { id: string; name: string }[] = [];
    UNIVERSE_DATA.forEach(g => {
      list.push({ id: g.id, name: `${g.name} [Galaxy]` });
      g.systems.forEach(s => {
        list.push({ id: s.id, name: `── ${g.name} ➔ ${s.name} [System]` });
        s.planets.forEach(p => {
          list.push({ id: p.id, name: `──── ${s.name} ➔ ${p.name} [Planet]` });
        });
      });
    });
    return list;
  };

  const nodesList = getAvailableNodes();

  const handleRun = () => {
    if (isRunning) {
      resetAlgorithm();
    } else {
      runAlgorithm();
    }
  };

  // Get total stats
  const totalSystems = level === 'universe' ? 842 : level === 'galaxy' ? selectedGalaxy?.systems.length || 0 : selectedSystem?.planets.length || 0;
  const activeRoutesCount = edges.length;

  return (
    <div className="relative w-full h-full bg-slate-950/75 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-2xl pointer-events-auto">
      {/* Laser lines styling */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Top Section */}
      <div className="space-y-4 overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: 'none' }}>
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-black text-white tracking-widest uppercase font-mono">Mission Control</h2>
            <p className="text-[9px] text-cyan-400/70 font-mono uppercase tracking-wider">Navigate the Universe</p>
          </div>
        </div>

        {/* Route Planning */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-black">Route Planning</div>
          <div className="space-y-2.5">
            <div>
              <label className="text-[8px] text-cyan-300/60 font-mono uppercase block mb-1">From (Origin)</label>
              <div className="flex gap-2">
                <select
                  value={startNodeId || ''}
                  onChange={(e) => setStartNode(e.target.value || null)}
                  className="flex-1 bg-slate-900/90 border border-cyan-500/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono cursor-pointer"
                >
                  <option value="" className="text-slate-650">-- Select Source --</option>
                  {nodesList.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSelectionMode(selectionMode === 'start' ? 'navigate' : 'start')}
                  className={`p-1.5 rounded-lg border transition-all ${
                    selectionMode === 'start'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 animate-pulse'
                      : 'bg-slate-900 border-cyan-500/25 text-slate-400 hover:text-white hover:border-cyan-400'
                  }`}
                  title="Select Origin node on 3D map"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-[8px] text-cyan-300/60 font-mono uppercase block mb-1">To (Destination)</label>
              <div className="flex gap-2">
                <select
                  value={endNodeId || ''}
                  onChange={(e) => setEndNode(e.target.value || null)}
                  className="flex-1 bg-slate-900/90 border border-cyan-500/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono cursor-pointer"
                >
                  <option value="" className="text-slate-650">-- Select Target --</option>
                  {nodesList.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSelectionMode(selectionMode === 'end' ? 'navigate' : 'end')}
                  className={`p-1.5 rounded-lg border transition-all ${
                    selectionMode === 'end'
                      ? 'bg-red-500/20 border-red-400 text-red-400 animate-pulse'
                      : 'bg-slate-900 border-cyan-500/25 text-slate-400 hover:text-white hover:border-cyan-400'
                  }`}
                  title="Select Target node on 3D map"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>
            </div>
            {selectionMode !== 'navigate' && (
              <div className="bg-cyan-500/10 border border-cyan-500/35 rounded-lg p-2 text-center text-[9px] text-cyan-300 font-mono animate-pulse uppercase tracking-wider">
                [ MAP CAPTURE: Click a system/planet on 3D viewport ]
              </div>
            )}
          </div>
        </div>

        {/* Algorithms */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-black">Algorithm</span>
            <button 
              onClick={onOpenTheory}
              className="text-[8px] text-cyan-400 hover:text-cyan-300 font-mono uppercase hover:underline"
            >
              [ View Theory ]
            </button>
          </div>
          <div className="space-y-2">
            {algorithms.map((algo) => {
              const Icon = algo.icon;
              const isSelected = selectedAlgorithm === algo.id;
              return (
                <div 
                  key={algo.id}
                  onClick={() => setAlgorithm(algo.id)}
                  className={`border rounded-xl p-2.5 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                    isSelected 
                      ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5 relative z-10">
                    <div className={`p-1.5 rounded-lg bg-black/40 border border-slate-800 ${isSelected ? algo.color : 'text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black font-mono text-white tracking-wide truncate">{algo.name}</span>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                      </div>
                      <p className="text-[8px] text-slate-400 leading-tight mt-0.5">{algo.description}</p>
                    </div>
                  </div>
                  {/* Subtle edge neon lines */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 bottom-0 w-[3px] bg-cyan-400" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Route Options */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-black">Route Options</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'useWormholes', label: 'Use Wormholes', active: useWormholes },
              { id: 'avoidAnomalies', label: 'Avoid Anomalies', active: avoidAnomalies },
              { id: 'optimiseFuel', label: 'Optimise Fuel', active: optimiseFuel },
              { id: 'highSpeedCorridors', label: 'High Speed Corridors', active: highSpeedCorridors },
            ].map(opt => (
              <label 
                key={opt.id}
                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer font-mono text-[9px] transition-all duration-300 ${
                  opt.active 
                    ? 'border-cyan-400/50 bg-cyan-950/20 text-cyan-300' 
                    : 'border-slate-900 bg-slate-900/30 text-slate-400 hover:border-slate-800 hover:text-slate-350'
                }`}
              >
                <span>{opt.label}</span>
                <input 
                  type="checkbox" 
                  checked={opt.active} 
                  onChange={() => toggleRouteOption(opt.id as any, level, selectedGalaxy, selectedSystem)}
                  className="sr-only"
                />
                <div className={`w-2.5 h-2.5 rounded border flex items-center justify-center ${
                  opt.active ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-slate-700 bg-black'
                }`}>
                  {opt.active && <div className="w-1 h-1 rounded-full bg-black" />}
                </div>
              </label>
            ))}
          </div>
        </div>

            {/* Starship Flight Deck Panel */}
            <div className="bg-slate-900/50 border border-cyan-500/30 rounded-xl p-3 space-y-2.5 relative overflow-hidden mt-4">
              <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest font-black flex justify-between items-center border-b border-white/5 pb-1">
                <span>Starship Flight Deck</span>
                {isRefueling ? (
                  <span className="text-amber-400 animate-pulse text-[8px] font-extrabold">[ RECHARGING ]</span>
                ) : isFlying ? (
                  <span className="text-emerald-400 text-[8px] font-extrabold">[ FLIGHT ACTIVE ]</span>
                ) : (
                  <span className="text-slate-500 text-[8px] font-bold">
                    {shortestPath.length >= 2 ? (diagState === 'ready' ? '[ SYSTEMS READY ]' : diagState === 'scanning' ? '[ DIAGNOSTIC RUN ]' : '[ DOCKED ]') : '[ STANDBY ]'}
                  </span>
                )}
              </div>

              {shortestPath.length >= 2 ? (
                <>
                  {/* Scrolling Diagnostics Checklist (Only visible when not flying) */}
                  {!isFlying && (
                    <div className="space-y-1.5">
                      <div className="text-[8px] text-slate-400 font-mono uppercase tracking-wider block">
                        Diagnostics Checklist
                      </div>
                      
                      {/* Side-by-side flex layout */}
                      <div className="flex gap-2 items-center bg-slate-950/80 border border-slate-850 p-2 rounded-xl shadow-inner min-h-[105px]">
                        {/* Left: SVG Schematic */}
                        <div className="w-14 flex justify-center items-center py-1 border-r border-white/5 pr-1.5">
                          <RocketSchematic diagState={diagState} scannedIndex={scannedIndex} />
                        </div>
                        
                        {/* Right: Scrollable list container */}
                        <div 
                          className="flex-1 max-h-[95px] overflow-y-auto pr-1 space-y-1 text-[8px] font-mono leading-tight" 
                          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(6,182,212,0.3) transparent' }}
                        >
                          {ROCKET_PARTS.map((part, idx) => {
                            let statusText = "PENDING";
                            let statusColor = "text-amber-500 font-bold";
                            if (diagState === 'scanning') {
                              if (idx < scannedIndex) {
                                statusText = "NOMINAL";
                                statusColor = "text-emerald-400 font-bold";
                              } else if (idx === scannedIndex) {
                                statusText = "SCANNING";
                                statusColor = "text-cyan-400 font-bold animate-pulse";
                              } else {
                                statusText = "PENDING";
                                statusColor = "text-slate-600";
                              }
                            } else if (diagState === 'ready') {
                              statusText = "NOMINAL";
                              statusColor = "text-emerald-400 font-bold";
                            }
                            
                            return (
                              <div key={idx} className="flex justify-between items-center py-0.5 border-b border-white/5 last:border-0">
                                <div>
                                  <span className="text-slate-200 block font-bold truncate max-w-[100px]">{part.name}</span>
                                  <span className="text-slate-500 block text-[6.5px] truncate max-w-[100px]">{part.desc}</span>
                                </div>
                                <span className={`${statusColor} flex-shrink-0 ml-1`}>[{statusText}]</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Launch / Abort / Prep Actions */}
                  <div className="flex gap-2 mt-1">
                    {isFlying ? (
                      <div className="space-y-2 w-full">
                        {/* Active Flight Controls */}
                        <div className="flex gap-2">
                          <button
                            onClick={stopFlight}
                            className="flex-1 py-1.5 rounded-lg bg-red-650/40 border border-red-500 hover:bg-red-500 hover:text-white text-red-400 font-mono text-[9px] font-black uppercase transition-all shadow-[0_0_10px_rgba(239,68,68,0.15)] cursor-pointer"
                          >
                            Abort Flight
                          </button>
                          <button
                            onClick={clearCourse}
                            className="py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-mono text-[9px] font-black uppercase transition-all cursor-pointer"
                          >
                            Clear Route
                          </button>
                        </div>
                        
                        {/* Cinematic Tracking Toggle */}
                        <label className="flex items-center justify-between p-2 rounded-lg border border-slate-850 bg-slate-900/30 cursor-pointer font-mono text-[9px] text-slate-400 hover:border-slate-800 transition-all pointer-events-auto">
                          <span>Cinematic Tracking Camera</span>
                          <input 
                            type="checkbox" 
                            checked={cinematicCamera} 
                            onChange={(e) => setCinematicCamera(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-6 h-3.5 rounded-full p-0.5 transition-colors duration-300 ${
                            cinematicCamera ? 'bg-cyan-500' : 'bg-slate-850'
                          }`}>
                            <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform duration-300 ${
                              cinematicCamera ? 'translate-x-2.5' : 'translate-x-0'
                            }`} />
                          </div>
                        </label>
                      </div>
                    ) : (
                      /* Launch Preparation Phase */
                      <div className="w-full space-y-2">
                        {diagState === 'pending' && (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => {
                                setDiagState('scanning');
                                setScannedIndex(0);
                              }}
                              className="flex-1 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400 hover:bg-cyan-500 hover:text-black text-cyan-300 font-mono text-[9px] font-black uppercase transition-all shadow-[0_0_8px_rgba(6,182,212,0.15)] cursor-pointer"
                            >
                              Prepare Launch diagnostics
                            </button>
                            <button
                              onClick={clearCourse}
                              className="py-2 px-2.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white font-mono text-[9px] font-black uppercase transition-all cursor-pointer"
                            >
                              Abort
                            </button>
                          </div>
                        )}

                        {diagState === 'scanning' && (
                          <button
                            disabled
                            className="w-full py-2 rounded-lg bg-cyan-950/40 border border-cyan-500/35 text-cyan-400 font-mono text-[9px] font-black uppercase transition-all cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <div className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            <span>Verifying Parts ({Math.round((scannedIndex / ROCKET_PARTS.length) * 100)}%)</span>
                          </button>
                        )}

                        {diagState === 'ready' && (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => {
                                if (!courseLocked) {
                                  const startPos = getStartNodePosition();
                                  if (startPos) setCourse(startPos);
                                }
                                startFlight();
                              }}
                              className="flex-1 py-2 rounded-lg bg-emerald-600/30 border border-emerald-500 text-emerald-300 font-mono text-[9.5px] font-black uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-emerald-500 hover:text-black cursor-pointer animate-pulse"
                            >
                              Engage Warp Drive / Launch
                            </button>
                            <button
                              onClick={clearCourse}
                              className="py-2 px-2.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white font-mono text-[9px] font-black uppercase transition-all cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Pre-flight Configuration & Cockpit Setup */
                <div className="space-y-3 font-mono text-[8px] text-slate-400">
                  <div className="text-[8px] text-slate-400 font-mono uppercase tracking-wider block">
                    Pre-Flight Cockpit Setup
                  </div>
                  <div className="flex gap-2.5 items-center bg-slate-950/80 border border-slate-850 p-2 rounded-xl shadow-inner min-h-[90px]">
                    <div className="w-14 flex justify-center items-center py-1 border-r border-white/5 pr-1.5">
                      <RocketSchematic diagState="pending" scannedIndex={-1} />
                    </div>
                    <div className="flex-1 text-[8.5px] leading-relaxed pl-1 text-slate-350">
                      <span className="text-cyan-400 font-bold block mb-0.5">AWAITING CO-ORDINATES</span>
                      Configure engines, stabilizers, and shields. Set source & target above to calculate launch path.
                    </div>
                  </div>
                </div>
              )}

              {/* Starship Cockpit Overrides (Always render) */}
              <div className="space-y-2 border-t border-white/5 pt-2 text-[8px] font-mono">
                <div className="text-[8px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Starship Cockpit Overrides</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[8px]">
                  {/* Deflector shield toggle */}
                  <button
                    onClick={() => setShieldActive(!shieldActive)}
                    className={`py-1.5 px-2 rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer pointer-events-auto ${
                      shieldActive 
                        ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>{shieldActive ? 'SHIELD ENGAGED' : 'SHIELD OFF'}</span>
                  </button>

                  {/* Ring Gravity overdrive */}
                  <button
                    onClick={() => setGravityOverdrive(!gravityOverdrive)}
                    className={`py-1.5 px-2 rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer pointer-events-auto ${
                      gravityOverdrive 
                        ? 'bg-purple-500/20 border-purple-400/50 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.15)]'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <RotateCw className="w-3 h-3 animate-spin" style={{ animationDuration: gravityOverdrive ? '1.5s' : '4s' }} />
                    <span>{gravityOverdrive ? 'STAB OVERDRIVE' : 'STABILIZER'}</span>
                  </button>
                </div>

                {/* Engine Color plasma mix */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[8px]">
                  <span className="text-slate-400">ENGINE PLASMA MIX:</span>
                  <div className="flex gap-1.5 pointer-events-auto">
                    {(['orange', 'cyan', 'purple'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => setEngineColor(color)}
                        className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                          engineColor === color 
                            ? 'ring-2 ring-white scale-110 shadow-lg' 
                            : 'opacity-55 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: color === 'orange' ? '#f97316' : color === 'cyan' ? '#06b6d4' : '#a855f7'
                        }}
                        title={`Warp core propulsion mix: ${color === 'orange' ? 'Thermal standard' : color === 'cyan' ? 'Fusion drive' : 'Quantum core'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Warp Speed Factor Slider */}
                <div className="space-y-1 pt-1.5">
                  <div className="flex justify-between text-[8px] text-slate-400 uppercase">
                    <span>Warp Velocity:</span>
                    <span className="text-cyan-400 font-bold">{(rocketSpeedFactor * 0.5).toFixed(2)} LY/s</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={rocketSpeedFactor}
                    onChange={(e) => setRocketSpeedFactor(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-950 rounded accent-cyan-500 cursor-pointer pointer-events-auto"
                  />
                </div>
              </div>
            </div>
        </div>

      {/* Bottom Section */}
      <div className="pt-3 border-t border-white/5 space-y-3 bg-slate-950">
        {/* Run triggers */}
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={!startNodeId || !endNodeId}
            className={`flex-1 py-2 rounded-xl font-bold font-mono text-[10px] tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-lg border transition-all duration-300 disabled:opacity-30 ${
              isRunning 
                ? 'bg-red-500/25 border-red-500/40 text-red-400 shadow-red-900/20 hover:bg-red-500/45' 
                : 'bg-cyan-500/25 border-cyan-500/40 text-cyan-400 shadow-cyan-950/30 hover:bg-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            }`}
          >
            {isRunning ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            {isRunning ? 'Abort Search' : 'Compute Optimal Route'}
          </button>
          <button
            onClick={resetAlgorithm}
            className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Reset Algorithm State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* System Stats Summary */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-2.5 space-y-1.5 font-mono text-[9px] text-slate-500">
          <div className="flex justify-between">
            <span>EXPLORATION DEPTH:</span>
            <span className="text-white font-bold uppercase">{level}</span>
          </div>
          <div className="flex justify-between">
            <span>SECTOR NODES:</span>
            <span className="text-cyan-400 font-bold">{totalSystems}</span>
          </div>
          <div className="flex justify-between">
            <span>ACTIVE PATH SEGMENTS:</span>
            <span className="text-cyan-400 font-bold">{activeRoutesCount}</span>
          </div>
          <div className="flex justify-between">
            <span>EXPLORED VOLUME:</span>
            <span className="text-white font-bold">78%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
