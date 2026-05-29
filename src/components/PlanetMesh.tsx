import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Planet } from '../types/universe';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore } from '../store/algorithmStore';

interface PlanetMeshProps {
  planet: Planet;
  index: number;
  orbitAngle?: React.MutableRefObject<number[]>;
}

export default function PlanetMesh({ planet, index }: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { selectPlanet, isTransitioning, setHovered: setGlobalHovered } = useUniverseStore();
  const { 
    selectionMode, 
    setStartNode, 
    setEndNode, 
    setSelectionMode,
    startNodeId,
    endNodeId,
    courseLocked,
    shortestPath
  } = useAlgorithmStore();

  const angleRef = useRef((index / 8) * Math.PI * 2);
  const leaveTimeoutRef = useRef<any>(null);
  const isHoveringHtml = useRef(false);

  const handlePointerEnter = () => {
    if (isTransitioning) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHovered(true);
    setGlobalHovered(planet.id);
  };

  const handlePointerLeave = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = setTimeout(() => {
      if (!isHoveringHtml.current) {
        setHovered(false);
        setGlobalHovered(null);
      }
    }, 350); // 350ms window to transition mouse to UI
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

  useFrame((_, delta) => {
    if (!hovered && !isTransitioning) {
      angleRef.current += delta * planet.orbitSpeed * 0.035;
    }
    const x = Math.cos(angleRef.current) * planet.orbitRadius;
    const z = Math.sin(angleRef.current) * planet.orbitRadius;
    if (groupRef.current) {
      groupRef.current.position.set(x, 0, z);
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * planet.rotationSpeed * 0.03;
    }
    if (atmRef.current) {
      const pulse = 1 + Math.sin(Date.now() * 0.002 + index) * 0.02;
      atmRef.current.scale.setScalar(pulse);
    }
  });

  const isSaturn = planet.id === 'saturn';
  const isGasGiant = planet.type === 'gas_giant';
  const isStart = startNodeId === planet.id;
  const isEnd = endNodeId === planet.id;
  const isPathNode = courseLocked && shortestPath.includes(planet.id);

  return (
    <group
      ref={groupRef}
      name={`system-node-${planet.id}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={(e) => {
        e.stopPropagation();
        if (isTransitioning) return;
        if (selectionMode === 'start') {
          setStartNode(planet.id);
          setSelectionMode('navigate');
        } else if (selectionMode === 'end') {
          setEndNode(planet.id);
          setSelectionMode('navigate');
        } else {
          selectPlanet(planet);
        }
      }}
    >
      {/* Selection indicators */}
      {(isStart || isEnd || isPathNode) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.radius * 0.5, planet.radius * 0.62, 32]} />
          <meshBasicMaterial 
            color={isStart || isPathNode ? '#10b981' : '#ef4444'} 
            transparent 
            opacity={0.7} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}
      {/* Planet body */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[planet.radius * 0.4, 32, 32]} />
        <meshStandardMaterial
          color={planet.color}
          roughness={isGasGiant ? 0.3 : 0.8}
          metalness={isGasGiant ? 0.1 : 0}
        />
      </mesh>

      {/* Atmosphere */}
      <mesh ref={atmRef}>
        <sphereGeometry args={[planet.radius * 0.46, 32, 32]} />
        <meshBasicMaterial
          color={planet.atmosphereColor}
          transparent
          opacity={planet.atmosphereIntensity * (hovered ? 1.4 : 1)}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {/* Saturn rings */}
      {isSaturn && (
        <>
          {[1.4, 1.7, 2.0, 2.25].map((r, ri) => (
            <mesh key={ri} rotation={[Math.PI / 2 + 0.2, 0, 0]}>
              <ringGeometry args={[planet.radius * r * 0.4, planet.radius * (r + 0.15) * 0.4, 64]} />
              <meshBasicMaterial
                color={ri % 2 === 0 ? '#c8b870' : '#a89850'}
                transparent
                opacity={0.6 - ri * 0.1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
        </>
      )}

      {/* Moons */}
      {planet.moons.map((moon, mi) => {
        const moonAngle = (mi / planet.moons.length) * Math.PI * 2;
        const mx = Math.cos(moonAngle) * moon.orbitRadius;
        const mz = Math.sin(moonAngle) * moon.orbitRadius;
        return (
          <group key={moon.id} position={[mx, 0, mz]}>
            <mesh>
              <sphereGeometry args={[moon.radius * 0.2, 16, 16]} />
              <meshStandardMaterial color={moon.color} roughness={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* Hover indicator */}
      {hovered && (
        <>
          <Billboard position={[0, planet.radius * 0.6, 0]}>
            <Text fontSize={0.15} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
              {planet.name}
            </Text>
            <Text fontSize={0.09} color="#88ddff" anchorX="center" anchorY="middle" position={[0, -0.2, 0]}>
              {planet.type.replace('_', ' ')} • {planet.moons.length} moons
            </Text>
          </Billboard>

          {/* 3D Context Menu Overlay */}
          <Html position={[0, planet.radius * 0.6 + 0.35, 0]} center>
            <div 
              onMouseEnter={handleHtmlMouseEnter}
              onMouseLeave={handleHtmlMouseLeave}
              className="bg-slate-950/90 backdrop-blur-xl border-2 border-cyan-400/50 p-4 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.35)] flex flex-col gap-2.5 items-center min-w-[170px] pointer-events-auto select-none"
            >
              <span className="text-xs font-extrabold text-white font-mono tracking-wider text-center">{planet.name}</span>
              <div className="flex gap-2 w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStartNode(planet.id);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-400 font-mono text-[10px] font-black uppercase transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                  title="Set as Origin Planet"
                >
                  Start
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEndNode(planet.id);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-red-500/20 border border-red-500 hover:bg-red-500 hover:text-black text-red-400 font-mono text-[10px] font-black uppercase transition-all shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                  title="Set as Target Planet"
                >
                  Target
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectPlanet(planet);
                }}
                className="w-full py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 hover:bg-cyan-500 hover:text-black text-cyan-300 font-mono text-[9px] uppercase tracking-widest font-black transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              >
                Focus Planet
              </button>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
