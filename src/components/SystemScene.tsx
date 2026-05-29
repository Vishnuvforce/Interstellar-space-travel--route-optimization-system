import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StarField from './StarField';
import NebulaCloud from './NebulaCloud';
import OrbitRing from './OrbitRing';
import PlanetMesh from './PlanetMesh';
import RouteVisualizer from './RouteVisualizer';
import RocketMesh from './RocketMesh';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore } from '../store/algorithmStore';

const STAR_COLORS: Record<string, string> = {
  O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
  G: '#fff4e8', K: '#ffd2a1', M: '#ffcc6f',
};

export default function SystemScene() {
  const { selectedSystem, isTransitioning } = useUniverseStore();
  const { selectionMode, setStartNode, setEndNode, setSelectionMode } = useAlgorithmStore();
  const starRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (starRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      starRef.current.scale.setScalar(pulse);
    }
  });

  if (!selectedSystem) return null;

  const starColor = STAR_COLORS[selectedSystem.starType] || '#ffffff';

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={4} color={starColor} distance={50} />
      <pointLight position={[0, 0, 0]} intensity={2} color={starColor} distance={30} />

      <StarField count={4000} spread={80} size={0.07} opacity={0.7} speed={0.05} />
      <NebulaCloud position={[8, 3, -10]} color={starColor} scale={5} opacity={0.06} />
      <NebulaCloud position={[-10, -2, 5]} color="#3366aa" scale={4} opacity={0.05} />

      {/* Central star */}
      <mesh
        ref={starRef}
        name={`system-node-${selectedSystem.id}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isTransitioning) return;
          if (selectionMode === 'start') {
            setStartNode(selectedSystem.id);
            setSelectionMode('navigate');
          } else if (selectionMode === 'end') {
            setEndNode(selectedSystem.id);
            setSelectionMode('navigate');
          }
        }}
      >
        <sphereGeometry args={[selectedSystem.starRadius, 32, 32]} />
        <meshBasicMaterial color={starColor} />
      </mesh>

      {/* Star corona layers */}
      {[2, 3, 4.5].map((r, i) => (
        <mesh key={i}>
          <sphereGeometry args={[r, 16, 16]} />
          <meshBasicMaterial color={starColor} transparent opacity={0.04 - i * 0.01} depthWrite={false} />
        </mesh>
      ))}

      {/* Orbit rings */}
      {selectedSystem.planets.map((planet) => (
        <OrbitRing key={planet.id + '-orbit'} radius={planet.orbitRadius} />
      ))}

      {/* Planets */}
      {selectedSystem.planets.map((planet, i) => (
        <PlanetMesh key={planet.id} planet={planet} index={i} />
      ))}

      <RouteVisualizer />
      <RocketMesh />
    </>
  );
}
