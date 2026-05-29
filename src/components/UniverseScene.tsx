import StarField from './StarField';
import NebulaCloud from './NebulaCloud';
import GalaxyMesh from './GalaxyMesh';
import WarpEffect from './WarpEffect';
import RouteVisualizer from './RouteVisualizer';
import RocketMesh from './RocketMesh';
import { UNIVERSE_DATA } from '../data/universeData';
import { useUniverseStore } from '../store/universeStore';

export default function UniverseScene() {
  const { warpEffect } = useUniverseStore();

  return (
    <>
      <RouteVisualizer />
      <RocketMesh />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#6688ff" />

      <StarField count={5000} spread={220} size={0.12} />
      <StarField count={2000} spread={80} size={0.08} opacity={0.6} />

      <NebulaCloud position={[5, 2, -10]} color="#4466cc" scale={3} opacity={0.06} />
      <NebulaCloud position={[-8, -3, 5]} color="#cc4488" scale={4} opacity={0.05} />
      <NebulaCloud position={[2, -5, 8]} color="#44aacc" scale={2.5} opacity={0.07} />
      <NebulaCloud position={[-4, 6, -6]} color="#88cc44" scale={3.5} opacity={0.04} />

      {UNIVERSE_DATA.map((galaxy) => (
        <GalaxyMesh key={galaxy.id} galaxy={galaxy} />
      ))}

      <WarpEffect active={warpEffect} />
    </>
  );
}
