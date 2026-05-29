import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Check, X, ShieldX, Play, Square, Video, FastForward, Fuel, Globe, Network, Milestone } from 'lucide-react';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore } from '../store/algorithmStore';
import { UNIVERSE_DATA } from '../data/universeData';
import rocketModelImg from '../assets/rocket_model.png';

export default function CourseConsole() {
  const [isOpen, setIsOpen] = useState(true); // Open by default for visibility
  const { level, selectedGalaxy, selectedSystem } = useUniverseStore();
  const {
    startNodeId,
    endNodeId,
    courseLocked,
    edges,
    shortestPath,
    setCourse,
    clearCourse,
    unreachableNodes,
    maxFuelRange,
    isFlying,
    fuel,
    isRefueling,
    rocketSpeedFactor,
    cinematicCamera,
    setRocketSpeedFactor,
    setCinematicCamera,
    setStartNode,
    setEndNode,
    startFlight,
    stopFlight
  } = useAlgorithmStore();

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

  // Populate dynamic option list depending on active exploration level
  const getAvailableNodes = () => {
    if (level === 'universe') {
      return UNIVERSE_DATA.map(g => ({ id: g.id, name: g.name }));
    }
    if (level === 'galaxy' && selectedGalaxy) {
      return selectedGalaxy.systems.map(s => ({ id: s.id, name: s.name }));
    }
    if (level === 'system' && selectedSystem) {
      return [
        { id: selectedSystem.id, name: `${selectedSystem.name} Star` },
        ...selectedSystem.planets.map(p => ({ id: p.id, name: p.name }))
      ];
    }
    return [];
  };

  const startName = getSystemName(startNodeId);
  const targetName = getSystemName(endNodeId);
  const isTargetUnreachable = unreachableNodes.includes(endNodeId || '');
  const nodesList = getAvailableNodes();

  // Depth adaptive labels and styles
  const getDepthConfig = () => {
    switch (level) {
      case 'universe':
        return {
          title: 'Universe Scale',
          subtitle: 'Galaxies as Graph Nodes',
          badge: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
          icon: Network
        };
      case 'galaxy':
        return {
          title: 'Galaxy Scale',
          subtitle: 'Star Systems as Graph Nodes',
          badge: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
          icon: Milestone
        };
      case 'system':
        return {
          title: 'Solar Scale',
          subtitle: 'Orbiting Planets as Graph Nodes',
          badge: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
          icon: Globe
        };
      default:
        return {
          title: 'Target Deck',
          subtitle: 'Navigating coordinates',
          badge: 'border-slate-800 text-slate-400 bg-slate-900/30',
          icon: Compass
        };
    }
  };

  const depthCfg = getDepthConfig();
  const DepthIcon = depthCfg.icon;

  // Calculate shortest path length/hops
  const totalHops = shortestPath.length > 0 ? shortestPath.length - 1 : 0;
  let totalDistance = 0;
  if (shortestPath.length > 1) {
    for (let i = 0; i < shortestPath.length - 1; i++) {
      const edge = edges.find(
        e => (e.from === shortestPath[i] && e.to === shortestPath[i+1]) || 
             (e.from === shortestPath[i+1] && e.to === shortestPath[i])
      );
      if (edge) totalDistance += edge.weight;
    }
  }

  const handleSetCourse = () => {
    const startPos = getStartNodePosition();
    setCourse(startPos);
  };

  const speedDisplay = () => {
    if (rocketSpeedFactor <= 0.25) {
      return `${(rocketSpeedFactor * 1910).toFixed(0)} km/s (Voyager / Parker Probe)`;
    } else if (rocketSpeedFactor <= 1.0) {
      return `${(rocketSpeedFactor * 0.5).toFixed(2)} LY/s (Standard cruising)`;
    } else {
      return `${(rocketSpeedFactor * 0.5).toFixed(2)} LY/s (FTL Hyperdrive)`;
    }
  };

  if (level === 'planet') return null;

  return (
    <div className="fixed top-24 right-6 z-40 flex flex-col gap-3 items-end">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg shadow-lg shadow-cyan-900/40 transition-all flex items-center gap-2 border border-cyan-400/30 w-44 justify-center"
      >
        <Compass className={`w-4 h-4 ${(isFlying && !isRefueling) ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        <span className="font-mono text-[10px] font-bold tracking-wider">COURSE CONSOLE</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-slate-950/85 backdrop-blur-xl border border-slate-700/60 rounded-xl w-[340px] overflow-hidden shadow-2xl text-left relative"
          >
            {/* Diagnostic Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.01)_1px,transparent_1px)] bg-[size:16px_16px] rounded-xl pointer-events-none" />

            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center relative z-10">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  Course Console
                </h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Starship Navigation Control</p>
              </div>
              <div className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider ${
                courseLocked 
                  ? isFlying 
                    ? isRefueling 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {courseLocked 
                  ? isFlying 
                    ? isRefueling 
                      ? 'REFUELING' 
                      : 'EN ROUTE' 
                    : 'COURSE LOCKED'
                  : 'STANDBY'}
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto relative z-10">
              {/* Depth Scale Adaptability Indicator */}
              <div className={`border rounded-lg p-2.5 flex items-center gap-2.5 font-mono ${depthCfg.badge}`}>
                <DepthIcon className="w-4 h-4" />
                <div>
                  <div className="text-[10px] font-bold uppercase">{depthCfg.title}</div>
                  <div className="text-[8px] opacity-75">{depthCfg.subtitle}</div>
                </div>
              </div>

              {/* Start and Destination Selection HUD - Clutter-Free Dropdowns */}
              {!courseLocked && (
                <div className="space-y-3 bg-slate-900/40 border border-slate-850 rounded-xl p-3">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Target Route Coordinates</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] text-slate-500 font-mono uppercase">Origin (Start)</label>
                      <select
                        value={startNodeId || ''}
                        disabled={isFlying}
                        onChange={(e) => setStartNode(e.target.value || null)}
                        className="bg-slate-950/95 border border-slate-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors cursor-pointer w-full"
                      >
                        <option value="">-- Start Node --</option>
                        {nodesList.map(node => (
                          <option key={node.id} value={node.id}>
                            {node.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] text-slate-500 font-mono uppercase">Destination</label>
                      <select
                        value={endNodeId || ''}
                        disabled={isFlying}
                        onChange={(e) => setEndNode(e.target.value || null)}
                        className="bg-slate-950/95 border border-slate-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors cursor-pointer w-full"
                      >
                        <option value="">-- Target Node --</option>
                        {nodesList.map(node => (
                          <option key={node.id} value={node.id}>
                            {node.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Holographic Nav Telemetry Image Stream */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 my-1">
                <img src={rocketModelImg} alt="Starship Telemetry" className="w-full h-28 object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2.5 right-2.5 flex justify-between items-center font-mono text-[8px] text-cyan-400">
                  <span className="font-extrabold tracking-wider">ACTIVE NAV SENSOR FEED</span>
                  <span className="animate-pulse flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Route Terminals Detail */}
              <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-3 space-y-2 font-mono text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">ORIGIN:</span>
                  <span className="text-white font-bold max-w-[170px] truncate text-right">{startNodeId ? startName : 'Not Configured'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">DESTINATION:</span>
                  <span className={`font-bold max-w-[170px] truncate text-right ${isTargetUnreachable ? 'text-red-400' : endNodeId ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {endNodeId ? targetName : 'Not Configured'}
                  </span>
                </div>
                {courseLocked && (
                  <div className="border-t border-slate-900 pt-2 flex justify-between items-center text-[9px]">
                    <span className="text-slate-500">SECTOR MAX HOP RANGE:</span>
                    <span className="text-slate-400">{maxFuelRange.toFixed(1)} LY</span>
                  </div>
                )}
              </div>

              {/* Status / Path Analysis */}
              {!startNodeId || !endNodeId ? (
                <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-3 text-center text-xs text-slate-400 font-mono">
                  Select origin and target systems directly in the 3D map or via coordinate dropdowns above to initiate simulation.
                </div>
              ) : isTargetUnreachable ? (
                <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3 space-y-2 text-xs">
                  <div className="text-red-400 flex items-center gap-1.5 font-bold">
                    <ShieldX className="w-4 h-4" />
                    Obstructed Graph Route
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                    Distance between components exceeds thruster limit ({maxFuelRange.toFixed(1)} LY). Target system remains unreachable under Dijkstra's reachability logic.
                  </p>
                </div>
              ) : (
                <>
                  {/* Path analysis metrics */}
                  <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-3 space-y-2 font-mono text-[10px]">
                    <div className="flex justify-between text-slate-400">
                      <span>TOTAL FLIGHT DISTANCE:</span>
                      <span className="text-white font-bold">{totalDistance.toFixed(2)} Light Years</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>INTERSTELLAR HOPS:</span>
                      <span className="text-white font-bold">{totalHops} Segments</span>
                    </div>
                  </div>

                  {/* Settings and Telemetry - only when locked */}
                  {courseLocked && (
                    <div className="space-y-4 pt-2 border-t border-slate-850">
                      {/* Telemetry Fuel Meter */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                            FUEL DEPOSIT
                          </span>
                          <span className={`font-bold ${fuel < 30 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                            {fuel.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full transition-all duration-100 ${
                              fuel < 30 ? 'bg-red-500' : fuel < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${fuel}%` }}
                          />
                        </div>
                        {isRefueling && (
                          <div className="text-[9px] text-amber-400 font-mono text-center animate-pulse">
                            RECHARGING BATTERIES / REFILLING DEUTERIUM FUEL TANK
                          </div>
                        )}
                      </div>

                      {/* Speed Controller */}
                      <div className="space-y-1.5 bg-slate-900/40 border border-slate-900 rounded-xl p-3">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
                            WARP SPEED FACTOR
                          </span>
                        </div>
                        
                        <div className="py-2">
                          <input
                            type="range"
                            min="0.1"
                            max="5.0"
                            step="0.1"
                            value={rocketSpeedFactor}
                            onChange={(e) => setRocketSpeedFactor(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
                          />
                          <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1">
                            <span>0.1x (Human Max)</span>
                            <span>1.0x (Cruise)</span>
                            <span>5.0x (FTL Starship)</span>
                          </div>
                        </div>

                        <div className="bg-slate-950/60 rounded p-2 text-center border border-slate-800">
                          <span className="text-[10px] font-mono text-cyan-300 font-bold block">{speedDisplay()}</span>
                        </div>
                      </div>

                      {/* Cinematic Camera Toggle */}
                      <div className="flex items-center justify-between bg-slate-900/30 border border-slate-900 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-cyan-400" />
                          <span className="text-[10px] font-mono text-slate-300">Cinematic Tracking</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cinematicCamera}
                            onChange={(e) => setCinematicCamera(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    {!courseLocked ? (
                      <>
                        <button
                          onClick={clearCourse}
                          className="flex-1 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors text-xs font-mono font-bold flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          CLEAR PATH
                        </button>
                        <button
                          onClick={handleSetCourse}
                          className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50 transition-colors text-xs font-mono font-bold flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          LOCK COURSE
                        </button>
                      </>
                    ) : (
                      <>
                        {!isFlying ? (
                          <>
                            <button
                              onClick={clearCourse}
                              className="flex-1 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors text-xs font-mono font-bold flex items-center justify-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              CLEAR COURSE
                            </button>
                            <button
                              onClick={startFlight}
                              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition-colors text-xs font-mono font-bold flex items-center justify-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              LAUNCH FLIGHT
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={stopFlight}
                            className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/50 transition-colors text-xs font-mono font-bold flex items-center justify-center gap-1"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            ABORT FLIGHT
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
