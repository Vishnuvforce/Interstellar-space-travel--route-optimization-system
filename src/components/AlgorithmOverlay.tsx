import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, RotateCcw, Activity, Network, Zap, Crosshair, Code } from 'lucide-react';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore, AlgorithmType } from '../store/algorithmStore';
import { UNIVERSE_DATA } from '../data/universeData';

const algorithms = [
  {
    id: 'dijkstra' as AlgorithmType,
    name: "Dijkstra's Algorithm",
    description: "Finds the shortest path between nodes in a graph by expanding the frontier uniformly. Cost is exact distance.",
    timeComplexity: "O(V²)",
    spaceComplexity: "O(V)",
    icon: Network,
    color: "text-blue-400"
  },
  {
    id: 'astar' as AlgorithmType,
    name: "A* Search",
    description: "Goal-directed search. Uses Euclidean distance heuristic to target the destination quickly.",
    timeComplexity: "O(E)",
    spaceComplexity: "O(V)",
    icon: Zap,
    color: "text-amber-400"
  },
  {
    id: 'kruskal' as AlgorithmType,
    name: "Kruskal's MST",
    description: "Finds the Minimum Spanning Tree connecting all systems with minimal total edge weight without cycles.",
    timeComplexity: "O(E log E)",
    spaceComplexity: "O(V + E)",
    icon: Activity,
    color: "text-purple-400"
  }
];

interface AlgorithmOverlayProps {
  onOpenTheory: () => void;
}

export default function AlgorithmOverlay({ onOpenTheory }: AlgorithmOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { level, selectedGalaxy, selectedSystem } = useUniverseStore();
  const {
    selectedAlgorithm,
    startNodeId,
    endNodeId,
    selectionMode,
    isRunning,
    nodesState,
    shortestPath,
    mstEdges,
    edges,
    setAlgorithm,
    setSelectionMode,
    runAlgorithm,
    stepForward,
    resetAlgorithm
  } = useAlgorithmStore();

  // Handle automatic step-by-step animation execution
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        const hasNext = stepForward();
        if (!hasNext) {
          clearInterval(interval);
          
          // Auto launch flight if a valid path is found
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
              state.startFlight();
            }
          }
        }
      }, 150); // Snappy updates (150ms per step)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, stepForward, level, selectedGalaxy, selectedSystem]);

  // We show the algorithm panel on all views except the individual Planet close-up
  if (level === 'planet') return null;

  const activeAlgoConfig = algorithms.find(a => a.id === selectedAlgorithm) || algorithms[0];

  // Calculate statistics
  const visitedCount = Object.values(nodesState).filter(n => n.status === 'visited').length;
  const frontierCount = Object.values(nodesState).filter(n => n.status === 'frontier').length;
  
  // Calculate shortest path length
  let totalDistance = 0;
  if (selectedAlgorithm === 'kruskal') {
    totalDistance = edges
      .filter(e => mstEdges.includes(e.id))
      .reduce((sum, e) => sum + e.weight, 0);
  } else if (shortestPath.length > 1) {
    for (let i = 0; i < shortestPath.length - 1; i++) {
      const edge = edges.find(
        e => (e.from === shortestPath[i] && e.to === shortestPath[i+1]) || 
             (e.from === shortestPath[i+1] && e.to === shortestPath[i])
      );
      if (edge) totalDistance += edge.weight;
    }
  }

  const handleRun = () => {
    if (isRunning) {
      resetAlgorithm();
    } else {
      runAlgorithm();
    }
  };

  const getSystemName = (id: string | null) => {
    if (!id) return 'None';
    if (level === 'universe') {
      return UNIVERSE_DATA.find(g => g.id === id)?.name || 'None';
    } else if (level === 'galaxy' && selectedGalaxy) {
      return selectedGalaxy.systems.find(s => s.id === id)?.name || 'None';
    } else if (level === 'system' && selectedSystem) {
      if (id === selectedSystem.id) return `${selectedSystem.name} Star`;
      return selectedSystem.planets.find(p => p.id === id)?.name || 'None';
    }
    return 'None';
  };
  return (
    <div className="fixed top-24 left-6 z-40 flex flex-col gap-3 items-start">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2 border border-indigo-400/30 w-36 justify-center"
      >
        <Network className="w-4 h-4" />
        <span className="font-mono text-[10px] font-bold tracking-wider">ADA TOOLS</span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-slate-950/85 backdrop-blur-xl border border-slate-700/60 rounded-xl w-[340px] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-400" />
                  ADA Tools
                </h2>
                <p className="text-[10px] text-slate-400">Analysis & Design of Algorithms</p>
              </div>
              <button
                onClick={onOpenTheory}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-all border border-indigo-500/20"
                title="View Algorithm Pseudocode & Theory"
              >
                <Code className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto">
              {/* Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Algorithm</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {algorithms.map((algo) => {
                    const Icon = algo.icon;
                    const isSelected = selectedAlgorithm === algo.id;
                    return (
                      <button
                        key={algo.id}
                        onClick={() => setAlgorithm(algo.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${
                          isSelected 
                            ? 'bg-indigo-500/25 border-indigo-500/50 text-white' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? algo.color : ''}`} />
                        <span className="text-[9px] font-medium text-center truncate w-full">{algo.name.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Algorithm Details */}
              <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-800">
                <h3 className={`text-sm font-semibold mb-1 ${activeAlgoConfig.color}`}>{activeAlgoConfig.name}</h3>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  {activeAlgoConfig.description}
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-950/60 rounded p-1.5 border border-slate-800">
                    <span className="text-slate-500 block mb-0.5 font-mono text-[9px]">Time Complexity</span>
                    <span className="text-emerald-400 font-mono font-medium">{activeAlgoConfig.timeComplexity}</span>
                  </div>
                  <div className="bg-slate-950/60 rounded p-1.5 border border-slate-800">
                    <span className="text-slate-500 block mb-0.5 font-mono text-[9px]">Space Complexity</span>
                    <span className="text-emerald-400 font-mono font-medium">{activeAlgoConfig.spaceComplexity}</span>
                  </div>
                </div>
              </div>

              {/* Node selection buttons (Only for Dijkstra/A*) */}
              {selectedAlgorithm !== 'kruskal' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Start Node</label>
                    <button
                      onClick={() => setSelectionMode(selectionMode === 'start' ? 'navigate' : 'start')}
                      className={`w-full py-1.5 px-2 rounded border flex items-center justify-between text-xs transition-all ${
                        selectionMode === 'start'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 font-medium'
                      }`}
                    >
                      <span className="truncate max-w-[80px]">{getSystemName(startNodeId)}</span>
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Node</label>
                    <button
                      onClick={() => setSelectionMode(selectionMode === 'end' ? 'navigate' : 'end')}
                      className={`w-full py-1.5 px-2 rounded border flex items-center justify-between text-xs transition-all ${
                        selectionMode === 'end'
                          ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 font-medium'
                      }`}
                    >
                      <span className="truncate max-w-[80px]">{getSystemName(endNodeId)}</span>
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Selection Mode status overlay */}
              {selectionMode !== 'navigate' && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-2 text-center text-xs text-indigo-400 font-mono">
                  Select a node directly on the 3D map to target it.
                </div>
              )}

              {/* Statistics & Path Results */}
              {totalDistance > 0 && (
                <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800 text-[11px] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Path Length:</span>
                    <span className="text-emerald-400 font-bold font-mono">{totalDistance.toFixed(2)} LY</span>
                  </div>
                  {selectedAlgorithm !== 'kruskal' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-mono">Frontier Queue:</span>
                        <span className="text-amber-400 font-bold font-mono">{frontierCount} nodes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-mono">Evaluated:</span>
                        <span className="text-indigo-400 font-bold font-mono">{visitedCount} nodes</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2">
                <button 
                  onClick={handleRun}
                  disabled={selectedAlgorithm !== 'kruskal' && (!startNodeId || !endNodeId)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 ${
                    isRunning 
                      ? 'bg-red-500/25 text-red-400 hover:bg-red-500/40 border border-red-500/40' 
                      : 'bg-emerald-500/25 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/40'
                  }`}
                >
                  {isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isRunning ? 'Reset Sim' : 'Execute Pathfind'}
                </button>
                <button 
                  onClick={resetAlgorithm}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
