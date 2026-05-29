import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StarField from './StarField';
import NebulaCloud from './NebulaCloud';
import StarSystemMesh from './StarSystemMesh';
import RouteVisualizer from './RouteVisualizer';
import RocketMesh from './RocketMesh';
import { useUniverseStore } from '../store/universeStore';

export default function GalaxyScene() {
  const { selectedGalaxy, hoveredId } = useUniverseStore();
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && hoveredId === null) {
      groupRef.current.rotation.y += delta * 0.002;
    }
  });

  if (!selectedGalaxy) return null;

  return (
    <>
      <ambientLight intensity={0.5} color="#8899ff" />
      <pointLight position={[0, 0, 0]} intensity={2} color={selectedGalaxy.coreColor} distance={30} />
      <pointLight position={[5, 3, -5]} intensity={0.8} color="#4466cc" distance={25} />

      <StarField count={6000} spread={60} size={0.08} opacity={0.8} speed={0.02} />

      <NebulaCloud position={[3, 1, -4]} color={selectedGalaxy.armColor} scale={4} opacity={0.08} />
      <NebulaCloud position={[-4, -1, 3]} color={selectedGalaxy.coreColor} scale={3} opacity={0.06} />
      <NebulaCloud position={[0, 2, 5]} color={selectedGalaxy.color} scale={5} opacity={0.05} />

      <group ref={groupRef} name="galaxy-group">
        {selectedGalaxy.systems.map((system, i) => (
          <StarSystemMesh key={system.id} system={system} index={i} />
        ))}
        <RouteVisualizer />
        <RocketMesh />
      </group>
    </>
  );
}
