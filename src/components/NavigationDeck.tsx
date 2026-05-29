import { useState, useEffect, useRef } from 'react';
import { Star, Map, ShieldAlert } from 'lucide-react';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore } from '../store/algorithmStore';
import { useAuthStore } from '../store/authStore';
import { UNIVERSE_DATA } from '../data/universeData';
import { createBookmark, fetchBookmarks, deleteBookmark } from '../lib/api';

export default function NavigationDeck() {
  const { level, selectedGalaxy, selectedSystem, selectedPlanet, goBack } = useUniverseStore();
  const { startNodeId, endNodeId, shortestPath } = useAlgorithmStore();
  const { user } = useAuthStore();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  const miniMapCanvasRef = useRef<HTMLCanvasElement>(null);
  const radarAngleRef = useRef(0);

  // Check bookmarks
  useEffect(() => {
    const checkBookmark = async () => {
      if (!user) {
        setIsBookmarked(false);
        return;
      }
      const currentId = level === 'planet' ? selectedPlanet?.id
        : level === 'system' ? selectedSystem?.id
        : level === 'galaxy' ? selectedGalaxy?.id
        : null;

      if (!currentId) {
        setIsBookmarked(false);
        return;
      }
      try {
        const bookmarks = await fetchBookmarks(user.id);
        const existing = bookmarks.find(b => b.item_id === currentId);
        setIsBookmarked(!!existing);
        setBookmarkId(existing?.id || null);
      } catch {
        setIsBookmarked(false);
      }
    };
    checkBookmark();
  }, [user, level, selectedGalaxy?.id, selectedSystem?.id, selectedPlanet?.id]);

  // Mini Map Radar Rendering Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = miniMapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get nodes coordinates at current scale
    let points: { x: number; y: number; name: string; active: boolean }[] = [];
    if (level === 'universe') {
      points = UNIVERSE_DATA.map(g => ({
        x: g.position[0] * 5,
        y: g.position[2] * 5,
        name: g.name,
        active: startNodeId === g.id || endNodeId === g.id || shortestPath.includes(g.id)
      }));
    } else if (level === 'galaxy' && selectedGalaxy) {
      points = selectedGalaxy.systems.map(s => ({
        x: s.position[0] * 12,
        y: s.position[2] * 12,
        name: s.name,
        active: startNodeId === s.id || endNodeId === s.id || shortestPath.includes(s.id)
      }));
    } else if (level === 'system' && selectedSystem) {
      points = [
        { x: 0, y: 0, name: selectedSystem.name, active: startNodeId === selectedSystem.id || endNodeId === selectedSystem.id },
        ...selectedSystem.planets.map((p, idx) => {
          const angle = idx * Math.PI * 0.7;
          return {
            x: Math.cos(angle) * p.orbitRadius * 12,
            y: Math.sin(angle) * p.orbitRadius * 12,
            name: p.name,
            active: startNodeId === p.id || endNodeId === p.id || shortestPath.includes(p.id)
          };
        })
      ];
    }

    const render = () => {
      radarAngleRef.current = (radarAngleRef.current + 0.015) % (Math.PI * 2);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw radar background rings
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      for (let r = 20; r <= 80; r += 20) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - 90, cy); ctx.lineTo(cx + 90, cy);
      ctx.moveTo(cx, cy - 90); ctx.lineTo(cx, cy + 90);
      ctx.stroke();

      // Draw scanning beam
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const sweepX = cx + Math.cos(radarAngleRef.current) * 90;
      const sweepY = cy + Math.sin(radarAngleRef.current) * 90;
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.stroke();

      // Draw nodes on radar screen
      points.forEach(p => {
        // Map points to canvas center
        const px = cx + p.x;
        const py = cy + p.y;
        if (px < 0 || px > canvas.width || py < 0 || py > canvas.height) return;

        ctx.beginPath();
        ctx.arc(px, py, p.active ? 3.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = p.active ? '#10b981' : '#06b6d4';
        ctx.fill();

        // Node ring glow
        if (p.active) {
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [level, selectedGalaxy, selectedSystem, startNodeId, endNodeId, shortestPath]);

  const handleBookmark = async () => {
    if (!user) return;
    const itemType = level as 'galaxy' | 'system' | 'planet';
    const itemId = level === 'planet' ? selectedPlanet?.id
      : level === 'system' ? selectedSystem?.id
      : level === 'galaxy' ? selectedGalaxy?.id
      : null;

    if (!itemId) return;

    if (isBookmarked && bookmarkId) {
      await deleteBookmark(bookmarkId);
      setIsBookmarked(false);
      setBookmarkId(null);
    } else {
      const bm = await createBookmark(user.id, itemType, itemId);
      setBookmarkId(bm.id);
      setIsBookmarked(true);
    }
  };

  // Get current detailed node data
  const details = selectedPlanet && level === 'planet' ? {
    title: selectedPlanet.name,
    subtitle: `${selectedPlanet.type.replace('_', ' ')} World`,
    desc: selectedPlanet.description,
    fields: [
      { label: 'DISCOVERED', val: selectedPlanet.discovered },
      { label: 'TEMPERATURE', val: selectedPlanet.temperature },
      { label: 'MASS', val: selectedPlanet.mass },
      { label: 'MOONS COUNT', val: selectedPlanet.moons.length }
    ],
    action: () => goBack(),
    actionLabel: 'LEAVE PLANET'
  } : selectedSystem && level === 'system' ? {
    title: selectedSystem.name,
    subtitle: `Type ${selectedSystem.starType} Star System`,
    desc: selectedSystem.description,
    fields: [
      { label: 'PLANETS', val: selectedSystem.planets.length },
      { label: 'STAR TYPE', val: selectedSystem.starType },
      { label: 'GALAXY', val: selectedGalaxy?.name || 'Milky Way' },
      { label: 'SECTOR HEIGHT', val: '0.45 Light Years' }
    ],
    action: () => goBack(),
    actionLabel: 'EXIT STAR SYSTEM'
  } : selectedGalaxy && level === 'galaxy' ? {
    title: selectedGalaxy.name,
    subtitle: `${selectedGalaxy.type.replace('_', ' ')} Galaxy`,
    desc: selectedGalaxy.description,
    fields: [
      { label: 'DISTANCE', val: selectedGalaxy.distance },
      { label: 'STARS TOTAL', val: selectedGalaxy.starCount },
      { label: 'ACTIVE SYSTEM NODES', val: selectedGalaxy.systems.length },
      { label: 'EXPLORATION INDEX', val: '78%' }
    ],
    action: () => goBack(),
    actionLabel: 'EXIT GALAXY VIEW'
  } : {
    title: 'Milky Way Galaxy',
    subtitle: 'Home Barred Spiral Galaxy',
    desc: 'Our home galaxy, containing billions of systems and our solar system.',
    fields: [
      { label: 'NEIGHBOR GALAXIES', val: UNIVERSE_DATA.length },
      { label: 'EXPLORATION STATUS', val: 'HIGH OBSERVED' },
      { label: 'VELOCITY ACCURACY', val: '99.98%' },
      { label: 'DATA REPLICATION', val: 'NOMINAL' }
    ],
    action: null,
    actionLabel: ''
  };

  // SVG Radar Chart Data calculations
  // Dimensions: Speed, Safety, Cost, Stability, Efficiency
  // A* (cyan), Dijkstra (indigo), Kruskal (pink)
  const radarChartParams = {
    astar: { speed: 85, safety: 70, cost: 45, stability: 75, efficiency: 80 },
    dijkstra: { speed: 65, safety: 90, cost: 70, stability: 85, efficiency: 60 },
    kruskal: { speed: 45, safety: 50, cost: 95, stability: 60, efficiency: 90 }
  };

  const getRadarPath = (values: { speed: number, safety: number, cost: number, stability: number, efficiency: number }) => {
    const center = 75;
    const maxRadius = 55;
    
    // Angles: Speed = -PI/2, Safety = -PI/2 + 72deg, Cost = ..., etc.
    const angles = [-Math.PI/2, -Math.PI/2 + Math.PI*2/5, -Math.PI/2 + Math.PI*4/5, -Math.PI/2 + Math.PI*6/5, -Math.PI/2 + Math.PI*8/5];
    const vals = [values.speed, values.safety, values.cost, values.stability, values.efficiency];
    
    const coords = angles.map((angle, idx) => {
      const radius = (vals[idx] / 100) * maxRadius;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      return `${x},${y}`;
    });
    
    return `M ${coords.join(' L ')} Z`;
  };

  return (
    <div className="relative w-full h-full bg-slate-950/75 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-2xl pointer-events-auto">
      {/* Top laser line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Galaxy / System Details Card */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-3 space-y-2 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[8px] text-cyan-300 font-mono tracking-widest uppercase">{details.subtitle}</div>
            <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">{details.title}</h3>
          </div>
          {user && details.action && (
            <button 
              onClick={handleBookmark}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-cyan-400 text-cyan-400' : 'text-slate-500'}`} />
            </button>
          )}
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed font-mono">{details.desc}</p>
        
        {/* Field metrics */}
        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/5">
          {details.fields.map((f, idx) => (
            <div key={idx} className="bg-slate-950/50 rounded p-1.5 border border-slate-900 text-[8px] font-mono">
              <span className="text-slate-500 block">{f.label}</span>
              <span className="text-white font-bold">{f.val}</span>
            </div>
          ))}
        </div>

        {details.action && (
          <button 
            onClick={details.action}
            className="w-full mt-2 py-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white transition-colors font-mono text-[9px] font-black uppercase tracking-wider"
          >
            {details.actionLabel}
          </button>
        )}
      </div>

      {/* Mini Map Canvas Section */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-2.5 flex flex-col items-center relative z-10 space-y-1.5">
        <div className="w-full flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1">
          <span className="flex items-center gap-1">
            <Map className="w-3.5 h-3.5 text-cyan-400" />
            Tactical Minimap
          </span>
          <span className="text-cyan-400">Scan Active</span>
        </div>
        <div className="w-full flex justify-center relative bg-slate-950/80 rounded-lg border border-slate-900/50 p-2">
          <canvas 
            ref={miniMapCanvasRef} 
            width={180} 
            height={180}
            className="rounded-full shadow-[0_0_20px_rgba(6,182,212,0.06)]"
          />
        </div>
      </div>

      {/* Analysis Overview Radar Chart Section */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-2.5 flex flex-col items-center relative z-10 space-y-1.5">
        <div className="w-full flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            Analysis Overview
          </span>
        </div>

        <div className="flex items-center w-full justify-between gap-1.5">
          {/* SVG radar graph */}
          <div className="w-36 h-36 bg-slate-950/50 rounded-xl border border-slate-900/50 flex items-center justify-center p-1 relative">
            <svg width="130" height="130" viewBox="0 0 150 150" className="opacity-90">
              {/* Pentagonal grids */}
              {[20, 40, 60, 80, 100].map((scaleLevel) => {
                const r = (scaleLevel / 100) * 55;
                const center = 75;
                const angles = [-Math.PI/2, -Math.PI/2 + Math.PI*2/5, -Math.PI/2 + Math.PI*4/5, -Math.PI/2 + Math.PI*6/5, -Math.PI/2 + Math.PI*8/5];
                const pointsStr = angles.map(a => `${center + Math.cos(a)*r},${center + Math.sin(a)*r}`).join(' ');
                return (
                  <polygon 
                    key={scaleLevel}
                    points={pointsStr}
                    fill="none"
                    stroke="rgba(6,182,212,0.08)"
                    strokeWidth="0.8"
                  />
                );
              })}

              {/* Axial lines */}
              {Array.from({ length: 5 }).map((_, idx) => {
                const angle = -Math.PI/2 + (idx * Math.PI * 2 / 5);
                return (
                  <line 
                    key={idx}
                    x1="75" y1="75"
                    x2={75 + Math.cos(angle)*55}
                    y2={75 + Math.sin(angle)*55}
                    stroke="rgba(6,182,212,0.08)"
                    strokeWidth="0.8"
                  />
                );
              })}

              {/* Polygon paths for computed algorithm values */}
              <polygon points={getRadarPath(radarChartParams.astar)} fill="rgba(6,182,212,0.06)" stroke="#06b6d4" strokeWidth="1.2" />
              <polygon points={getRadarPath(radarChartParams.dijkstra)} fill="rgba(99,102,241,0.06)" stroke="#6366f1" strokeWidth="1.2" />
              <polygon points={getRadarPath(radarChartParams.kruskal)} fill="rgba(236,72,153,0.06)" stroke="#ec4899" strokeWidth="1.2" />
            </svg>
            <div className="absolute top-1 text-[6px] font-mono text-slate-500">SPEED</div>
            <div className="absolute right-0 text-[6px] font-mono text-slate-500" style={{ top: '42%' }}>SAFETY</div>
            <div className="absolute bottom-1 right-2 text-[6px] font-mono text-slate-500">COST</div>
            <div className="absolute bottom-1 left-2 text-[6px] font-mono text-slate-500">STABILITY</div>
            <div className="absolute left-0 text-[6px] font-mono text-slate-500" style={{ top: '42%' }}>EFFICIENCY</div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1.5 font-mono text-[7px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>A* ALGORITHM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>DIJKSTRA / BF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
              <span>GENETIC / MST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
