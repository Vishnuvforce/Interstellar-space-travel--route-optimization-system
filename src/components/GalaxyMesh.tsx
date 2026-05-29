import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getSharedCircleTexture } from '../lib/textureCache';
import { Galaxy } from '../types/universe';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore } from '../store/algorithmStore';

interface GalaxyMeshProps {
  galaxy: Galaxy;
}

export default function GalaxyMesh({ galaxy }: GalaxyMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { selectGalaxy, isTransitioning, setHovered: setGlobalHovered } = useUniverseStore();
  const { selectionMode, setStartNode, setEndNode, setSelectionMode } = useAlgorithmStore();

  const leaveTimeoutRef = useRef<any>(null);
  const isHoveringHtml = useRef(false);

  const handlePointerEnter = () => {
    if (isTransitioning) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHovered(true);
    setGlobalHovered(galaxy.id);
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

  const { armPositions, armColors, dustPositions } = useMemo(() => {
    const armCount = galaxy.type === 'elliptical' ? 0 : 3;
    const starsPerArm = 600;
    const totalStars = armCount > 0 ? starsPerArm * armCount + 300 : 1200;
    const pos = new Float32Array(totalStars * 3);
    const col = new Float32Array(totalStars * 3);
    const dustPos = new Float32Array(400 * 3);

    const armColorBase = new THREE.Color(galaxy.armColor);
    const coreColorBase = new THREE.Color(galaxy.coreColor);

    if (armCount > 0) {
      for (let arm = 0; arm < armCount; arm++) {
        const armAngle = (arm / armCount) * Math.PI * 2;
        for (let i = 0; i < starsPerArm; i++) {
          const idx = (arm * starsPerArm + i) * 3;
          const t = i / starsPerArm;
          const angle = armAngle + t * Math.PI * 3;
          const r = t * 2.5 + 0.2;
          const scatter = (1 - t) * 0.3 + t * 0.15;
          pos[idx] = Math.cos(angle) * r + (Math.random() - 0.5) * scatter;
          pos[idx + 1] = (Math.random() - 0.5) * 0.15;
          pos[idx + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * scatter;

          const blend = t;
          const c = armColorBase.clone().lerp(coreColorBase, 1 - blend);
          col[idx] = c.r + Math.random() * 0.1;
          col[idx + 1] = c.g + Math.random() * 0.1;
          col[idx + 2] = c.b + Math.random() * 0.1;
        }
      }
      // core stars
      for (let i = 0; i < 300; i++) {
        const idx = (armCount * starsPerArm + i) * 3;
        const r = Math.random() * 0.6;
        const a = Math.random() * Math.PI * 2;
        pos[idx] = Math.cos(a) * r;
        pos[idx + 1] = (Math.random() - 0.5) * 0.1;
        pos[idx + 2] = Math.sin(a) * r;
        col[idx] = coreColorBase.r + Math.random() * 0.15;
        col[idx + 1] = coreColorBase.g + Math.random() * 0.1;
        col[idx + 2] = coreColorBase.b + Math.random() * 0.05;
      }
    } else {
      // elliptical
      for (let i = 0; i < totalStars; i++) {
        const r = Math.pow(Math.random(), 0.5) * 2.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
        pos[i * 3 + 2] = r * Math.cos(phi);
        const c = coreColorBase.clone();
        col[i * 3] = c.r + Math.random() * 0.1;
        col[i * 3 + 1] = c.g + Math.random() * 0.05;
        col[i * 3 + 2] = c.b;
      }
    }

    for (let i = 0; i < 400; i++) {
      const r = Math.random() * 2.8;
      const a = Math.random() * Math.PI * 2;
      dustPos[i * 3] = Math.cos(a) * r + (Math.random() - 0.5) * 0.5;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      dustPos[i * 3 + 2] = Math.sin(a) * r + (Math.random() - 0.5) * 0.5;
    }

    return { armPositions: pos, armColors: col, dustPositions: dustPos };
  }, [galaxy]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04;
    }
    if (coreRef.current) {
      const s = hovered ? 1.3 : 1.0;
      coreRef.current.scale.lerp(new THREE.Vector3(s, s, s), delta * 3);
    }
  });

  const circleTexture = useMemo(() => getSharedCircleTexture(), []);

  const scale = hovered ? 1.12 : 1.0;

  return (
    <group
      name={`universe-node-${galaxy.id}`}
      position={galaxy.position}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={(e) => {
        e.stopPropagation();
        if (isTransitioning) return;
        if (selectionMode === 'start') {
          setStartNode(galaxy.id);
          setSelectionMode('navigate');
        } else if (selectionMode === 'end') {
          setEndNode(galaxy.id);
          setSelectionMode('navigate');
        } else {
          selectGalaxy(galaxy);
        }
      }}
    >
      <group ref={groupRef} scale={[scale, scale, scale]}>
        {/* Star arms */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[armPositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[armColors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.025}
            vertexColors
            transparent
            opacity={hovered ? 1 : 0.85}
            sizeAttenuation
            depthWrite={false}
            map={circleTexture}
          />
        </points>

        {/* Dust layer */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.07}
            color={galaxy.color}
            transparent
            opacity={0.12}
            sizeAttenuation
            depthWrite={false}
            map={circleTexture}
          />
        </points>

        {/* Core glow */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color={galaxy.coreColor} transparent opacity={0.9} />
        </mesh>

        {/* Outer core glow */}
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color={galaxy.coreColor} transparent opacity={0.07} />
        </mesh>

        {/* Black hole hint */}
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>

      {/* Label */}
      <Billboard position={[0, 2.1, 0]}>
        <Text
          fontSize={0.22}
          color={hovered ? '#ffffff' : '#aaccff'}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {galaxy.name}
        </Text>
        <Text
          fontSize={0.11}
          color={hovered ? '#88bbff' : '#5588aa'}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.3, 0]}
        >
          {galaxy.distance}
        </Text>
      </Billboard>

      {/* Hover ring & 3D context menu */}
      {hovered && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.6, 2.75, 64]} />
            <meshBasicMaterial color="#4488ff" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>

          {/* 3D Context Menu Overlay */}
          <Html position={[0, 2.7, 0]} center>
            <div 
              onMouseEnter={handleHtmlMouseEnter}
              onMouseLeave={handleHtmlMouseLeave}
              className="bg-slate-950/90 backdrop-blur-xl border-2 border-cyan-400/50 p-4 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.35)] flex flex-col gap-2.5 items-center min-w-[170px] pointer-events-auto select-none"
            >
              <span className="text-xs font-extrabold text-white font-mono tracking-wider text-center">{galaxy.name}</span>
              <div className="flex gap-2 w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStartNode(galaxy.id);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-400 font-mono text-[10px] font-black uppercase transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                  title="Set as Origin Galaxy"
                >
                  Start
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEndNode(galaxy.id);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-red-500/20 border border-red-500 hover:bg-red-500 hover:text-black text-red-400 font-mono text-[10px] font-black uppercase transition-all shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                  title="Set as Target Galaxy"
                >
                  Target
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectGalaxy(galaxy);
                }}
                className="w-full py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 hover:bg-cyan-500 hover:text-black text-cyan-300 font-mono text-[9px] uppercase tracking-widest font-black transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              >
                Focus Galaxy
              </button>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
