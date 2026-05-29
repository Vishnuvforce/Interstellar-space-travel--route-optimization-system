import { useState, useEffect, useRef } from 'react';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore } from '../store/algorithmStore';
import { UNIVERSE_DATA } from '../data/universeData';

const STAR_COLORS: Record<string, string> = {
  O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
  G: '#fff4e8', K: '#ffd2a1', M: '#ffcc6f',
};

export default function SelectedRouteBar() {
  const { level, selectedGalaxy, selectedSystem } = useUniverseStore();
  const {
    startNodeId,
    endNodeId,
    edges,
    shortestPath,
    currentSegmentIndex,
    isRefueling,
    cameraMode,
    setCameraMode
  } = useAlgorithmStore();

  const orbitCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  const [currentTime, setCurrentTime] = useState('');
  const [coordinates, setCoordinates] = useState({ x: 125.7, y: -43.2, z: 89.1 });

  // Update clock & slight coordinate drift
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toUTCString().replace('GMT', 'UTC'));
      
      // Dynamic coordinate drift when flying
      if (useAlgorithmStore.getState().isFlying) {
        setCoordinates({
          x: parseFloat((125.7 + Math.sin(Date.now() * 0.001) * 20).toFixed(1)),
          y: parseFloat((-43.2 + Math.cos(Date.now() * 0.0007) * 15).toFixed(1)),
          z: parseFloat((89.1 + Math.sin(Date.now() * 0.0005) * 25).toFixed(1))
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Bottom-Right 2D Solar System Orbit Preview
  useEffect(() => {
    const canvas = orbitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let angle = 0;

    const render = () => {
      angle += 0.012;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Sun
      const starType = selectedSystem?.starType || 'G';
      const starColor = STAR_COLORS[starType] || '#ffd2a1';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = starColor;
      ctx.shadowBlur = 12;
      ctx.shadowColor = starColor;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Planets & Orbits
      const planetsCount = selectedSystem?.planets.length || 4;
      for (let i = 0; i < planetsCount; i++) {
        const orbitRadius = 16 + i * 11;
        
        // Orbit ring
        ctx.beginPath();
        ctx.arc(cx, cy, orbitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Planet
        const pAngle = angle * (1 / (i + 1)) * 1.5;
        const px = cx + Math.cos(pAngle) * orbitRadius;
        const py = cy + Math.sin(pAngle) * orbitRadius;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#b5b5b5' : i === 1 ? '#2d7dd2' : i === 2 ? '#c1440e' : '#c88b3a';
        ctx.fill();
      }

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [selectedSystem]);

  // Bottom-Center Sliding Space Grid Tactical view
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let offset = 0;

    const render = () => {
      // Slides grid backward when spaceship is flying
      const isFlyingActive = useAlgorithmStore.getState().isFlying;
      const cruiseSpeed = useAlgorithmStore.getState().rocketSpeedFactor;
      if (isFlyingActive) {
        offset = (offset + 1.2 * cruiseSpeed) % 25;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines sliding along X/Y
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1;

      // Vertical lines sliding left/right
      for (let x = -25; x < canvas.width + 25; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x - offset, 0);
        ctx.lineTo(x - offset, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw glowing trajectory center lane
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.strokeStyle = isFlyingActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spaceship tactical marker
      ctx.beginPath();
      const sx = canvas.width / 3;
      const sy = canvas.height / 2;
      ctx.moveTo(sx - 8, sy - 5);
      ctx.lineTo(sx + 10, sy);
      ctx.lineTo(sx - 8, sy + 5);
      ctx.closePath();
      ctx.fillStyle = isFlyingActive ? '#10b981' : '#06b6d4';
      ctx.fill();

      // Scanning sweeps ahead of spaceship
      if (isFlyingActive) {
        ctx.beginPath();
        ctx.moveTo(sx + 10, sy);
        ctx.lineTo(sx + 45, sy - 15);
        ctx.lineTo(sx + 45, sy + 15);
        ctx.closePath();
        
        const alertState = useAlgorithmStore.getState().asteroidAlert;
        ctx.fillStyle = alertState ? 'rgba(239, 68, 68, 0.12)' : 'rgba(6, 182, 212, 0.08)';
        ctx.fill();
        ctx.strokeStyle = alertState ? 'rgba(239, 68, 68, 0.35)' : 'rgba(6, 182, 212, 0.25)';
        ctx.stroke();
      }

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, []);

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

  // Compute metrics
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

  const estTime = (totalDistance * 1.8).toFixed(1);
  const fuelCost = (totalDistance * 8).toFixed(0);

  if (level === 'planet' || shortestPath.length === 0) return null;

  return (
    <div className="relative w-full h-full bg-slate-950/75 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-3 flex gap-3 shadow-2xl pointer-events-auto">
      {/* Laser line top */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      {/* 1. Traversal Path Timeline (Bottom Left) */}
      <div className="flex-[2] bg-slate-900/30 border border-slate-900 rounded-xl p-2 flex flex-col justify-between overflow-hidden">
        <div className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Traversal Path timeline</div>
        
        {/* Glow timeline dots */}
        <div className="flex items-center justify-between w-full px-2 py-1.5 relative">
          <div className="absolute left-2.5 right-2.5 h-[2px] bg-slate-800 pointer-events-none" />
          <div 
            className="absolute left-2.5 h-[2px] bg-emerald-500 transition-all duration-300 pointer-events-none"
            style={{ width: `calc(${(currentSegmentIndex / Math.max(1, shortestPath.length - 1)) * 100}% - 5px)` }}
          />

          {shortestPath.map((nodeId, idx) => {
            const isCompleted = idx < currentSegmentIndex;
            const isActive = idx === currentSegmentIndex;
            const name = getSystemName(nodeId).split(' ')[0];
            return (
              <div key={nodeId} className="flex flex-col items-center gap-0.5 relative z-10">
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[7px] font-bold font-mono transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-emerald-500 border-emerald-400 text-black' 
                    : isActive 
                    ? 'bg-cyan-500 border-cyan-400 text-black animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                    : 'bg-slate-950 border-slate-700 text-slate-400'
                }`}>
                  {idx}
                </div>
                <span className="text-[7px] font-mono text-slate-500 mt-0.5 truncate max-w-[48px] uppercase">{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Route Telemetry */}
      <div className="flex-[1.5] bg-slate-900/30 border border-slate-900 rounded-xl p-2 flex flex-col justify-between font-mono text-[9px] text-slate-400">
        <div className="text-[8px] text-slate-500 tracking-widest uppercase">Route Telemetry</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <div className="flex justify-between">
            <span>ROUTE:</span>
            <span className="text-white font-bold truncate max-w-[50px]">{startName.split(' ')[0]}➔{targetName.split(' ')[0]}</span>
          </div>
          <div className="flex justify-between">
            <span>DISTANCE:</span>
            <span className="text-cyan-400 font-bold">{totalDistance.toFixed(1)} LY</span>
          </div>
          <div className="flex justify-between">
            <span>EST TIME:</span>
            <span className="text-white font-bold">{estTime} Days</span>
          </div>
          <div className="flex justify-between">
            <span>FUEL COST:</span>
            <span className="text-cyan-400 font-bold">{fuelCost} Units</span>
          </div>
        </div>
      </div>

      {/* 3. 3D Tactical Vector subview (Grid + scan) */}
      <div className="flex-1 bg-slate-900/30 border border-slate-900 rounded-xl p-1.5 flex flex-col relative overflow-hidden">
        <div className="absolute top-1 left-1.5 right-1.5 flex justify-between items-center text-[7px] font-mono text-cyan-400/80 tracking-widest z-10 pointer-events-none">
          <span>VECTOR FEED</span>
          {isRefueling ? (
            <span className="text-amber-400 animate-pulse font-extrabold">[ RECHARGING ]</span>
          ) : (
            <span>GRID LEVEL</span>
          )}
        </div>
        <canvas ref={gridCanvasRef} width={110} height={42} className="w-full h-full rounded-lg bg-black/60" />
      </div>

      {/* 4. System Orbit Preview (Bottom Right) */}
      <div className="w-24 bg-slate-900/30 border border-slate-900 rounded-xl p-1.5 flex flex-col relative overflow-hidden">
        <div className="absolute top-1 left-1 text-[7px] font-mono text-slate-500 tracking-widest z-10 pointer-events-none">ORBITS</div>
        <canvas ref={orbitCanvasRef} width={80} height={55} className="w-full h-full rounded-lg bg-black/40" />
      </div>

      {/* 5. Starship Controls Panel & HUD Presets */}
      <div className="flex-[1.5] bg-slate-900/30 border border-slate-900 rounded-xl p-2 flex flex-col justify-between">
        <div className="text-[8px] text-slate-500 font-mono tracking-widest uppercase flex justify-between">
          <span>Camera Modes</span>
          <span className="text-cyan-400 font-bold">{cameraMode.toUpperCase()}</span>
        </div>
        
        {/* Presets selectors */}
        <div className="grid grid-cols-5 gap-1.5">
          {['chase', 'adas', 'cockpit', 'overhead', 'orbit'].map(mode => (
            <button
              key={mode}
              onClick={() => setCameraMode(mode as any)}
              className={`py-1.5 rounded-lg border text-[8px] font-mono font-bold uppercase transition-all duration-300 ${
                cameraMode === mode 
                  ? 'border-cyan-400 bg-cyan-950/25 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  : 'border-slate-800 bg-slate-950/50 text-slate-500 hover:border-slate-700 hover:text-white'
              }`}
            >
              {mode.substr(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Status strip */}
      <div className="absolute -bottom-6 left-1 right-1 flex justify-between items-center text-[7px] font-mono text-slate-500 tracking-wider">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          SYSTEM STATUS: NOMINAL
        </span>
        <span>DATA SYNC: LIVE</span>
        <span>TIME: {currentTime || '22:48:36 UTC'}</span>
        <span>COORDINATES: X: {coordinates.x} Y: {coordinates.y} Z: {coordinates.z}</span>
      </div>
    </div>
  );
}
