import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { StarSystem } from '../types/universe';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore } from '../store/algorithmStore';

const STAR_COLORS: Record<string, string> = {
  O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
  G: '#fff4e8', K: '#ffd2a1', M: '#ffcc6f',
};

interface StarSystemMeshProps {
  system: StarSystem;
  index: number;
}

export default function StarSystemMesh({ system, index }: StarSystemMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { selectSystem, isTransitioning, setHovered: setGlobalHovered } = useUniverseStore();
  const { 
    startNodeId, 
    endNodeId, 
    selectionMode, 
    setStartNode, 
    setEndNode, 
    setSelectionMode,
    nodesState,
    courseLocked,
    shortestPath
  } = useAlgorithmStore();

  const leaveTimeoutRef = useRef<any>(null);
  const isHoveringHtml = useRef(false);

  const handlePointerEnter = () => {
    if (isTransitioning) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHovered(true);
    setGlobalHovered(system.id);
  };

  const handlePointerLeave = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = setTimeout(() => {
      if (!isHoveringHtml.current) {
        setHovered(false);
        setGlobalHovered(null);
      }
    }, 350); // 350ms window
  };

  const handleHtmlMouseEnter = () => {
    isHoveringHtml.current = true;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handleHtmlMouseLeave = () => {
    isHoveringHtml.current = false;
    handlePointerLeave();
  };

  const isStart = startNodeId === system.id;
  const isEnd = endNodeId === system.id;
  const isPathNode = courseLocked && shortestPath.includes(system.id);
  const nodeState = nodesState[system.id];

  // Dynamic color for nodes depending on state
  let nodeGlowColor = '#ffffff';
  let hasGlow = false;

  if (isStart) {
    nodeGlowColor = '#10b981'; // green for Start
    hasGlow = true;
  } else if (isEnd) {
    nodeGlowColor = '#ef4444'; // red for End
    hasGlow = true;
  } else if (isPathNode) {
    nodeGlowColor = '#10b981'; // green for path node
    hasGlow = true;
  } else if (nodeState) {
    if (nodeState.status === 'path') {
      nodeGlowColor = '#10b981'; // emerald path
      hasGlow = true;
    } else if (nodeState.status === 'visited') {
      nodeGlowColor = '#6366f1'; // indigo visited
      hasGlow = true;
    } else if (nodeState.status === 'frontier') {
      nodeGlowColor = '#f59e0b'; // amber frontier
      hasGlow = true;
    }
  }

  const orbitAngles = useRef(system.planets.map((_, i) => (i / system.planets.length) * Math.PI * 2));


  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!hovered) {
      groupRef.current.rotation.y += delta * (0.025 + index * 0.006);
    }

    orbitAngles.current = orbitAngles.current.map((a, i) => {
      const speed = system.planets[i].orbitSpeed * 0.08;
      return a + delta * speed;
    });

    if (starRef.current) {
      const basePulse = 1 + Math.sin(Date.now() * 0.003) * 0.05;
      const scaleMultiplier = isStart || isEnd ? 1.3 : 1.0;
      starRef.current.scale.setScalar(basePulse * scaleMultiplier);
    }
  });


  const starColor = STAR_COLORS[system.starType] || '#ffffff';

  return (
    <group
      ref={groupRef}
      name={`galaxy-node-${system.id}`}
      position={system.position}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={(e) => {
        e.stopPropagation();
        if (isTransitioning) return;

        // Custom onClick routing selector mode
        if (selectionMode === 'start') {
          setStartNode(system.id);
          setSelectionMode('navigate');
        } else if (selectionMode === 'end') {
          setEndNode(system.id);
          setSelectionMode('navigate');
        } else {
          // Standard explore select
          selectSystem(system);
        }
      }}
    >
      {/* Star */}
      <mesh ref={starRef}>
        <sphereGeometry args={[system.starRadius * 0.18, 16, 16]} />
        <meshBasicMaterial color={hasGlow ? nodeGlowColor : starColor} />
      </mesh>

      {/* Star corona */}
      <mesh>
        <sphereGeometry args={[system.starRadius * (hasGlow ? 0.6 : 0.4), 16, 16]} />
        <meshBasicMaterial color={hasGlow ? nodeGlowColor : starColor} transparent opacity={hasGlow ? 0.3 : 0.12} />
      </mesh>

      {/* Mini planet orbits */}
      {system.planets.slice(0, 4).map((planet, i) => {
        const r = 0.5 + i * 0.3;
        return (
          <group key={planet.id}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r - 0.005, r + 0.005, 32]} />
              <meshBasicMaterial color={starColor} transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[Math.cos(orbitAngles.current[i]) * r, 0, Math.sin(orbitAngles.current[i]) * r]}>
              <sphereGeometry args={[0.04 * (planet.radius + 0.5), 8, 8]} />
              <meshBasicMaterial color={planet.color} />
            </mesh>
          </group>
        );
      })}

      {/* Dust particles removed to declutter scene */}

      {/* Algorithmic Special Markers (START / END Rings) */}
      {(isStart || isEnd) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color={isStart ? '#10b981' : '#ef4444'} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Tooltip on Hover */}
      {(hovered || isStart || isEnd) && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.9, 2.05, 64]} />
            <meshBasicMaterial color={hasGlow ? nodeGlowColor : '#44aaff'} transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
          <Billboard position={[0, 2, 0]}>
            <Text fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
              {system.name} {isStart ? ' (START)' : isEnd ? ' (END)' : ''}
            </Text>
            <Text fontSize={0.10} color="#88bbff" anchorX="center" anchorY="middle" position={[0, -0.25, 0]}>
              {system.planets.length} planets • Type {system.starType}
            </Text>
          </Billboard>
        </>
      )}

      {/* 3D Context Menu Overlay */}
      {hovered && (
        <Html position={[0, 2.5, 0]} center>
          <div 
            onMouseEnter={handleHtmlMouseEnter}
            onMouseLeave={handleHtmlMouseLeave}
            className="bg-slate-950/90 backdrop-blur-xl border-2 border-cyan-400/50 p-4 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.35)] flex flex-col gap-2.5 items-center min-w-[170px] pointer-events-auto select-none"
          >
            <span className="text-xs font-extrabold text-white font-mono tracking-wider text-center">{system.name}</span>
            <div className="flex gap-2 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStartNode(system.id);
                }}
                className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-400 font-mono text-[10px] font-black uppercase transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                title="Set as Start System"
              >
                Start
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEndNode(system.id);
                }}
                className="flex-1 py-1.5 rounded-lg bg-red-500/20 border border-red-500 hover:bg-red-500 hover:text-black text-red-400 font-mono text-[10px] font-black uppercase transition-all shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                title="Set as Target System"
              >
                Target
              </button>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                selectSystem(system);
              }}
              className="w-full py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 hover:bg-cyan-500 hover:text-black text-cyan-300 font-mono text-[9px] uppercase tracking-widest font-black transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            >
              Focus System
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}
