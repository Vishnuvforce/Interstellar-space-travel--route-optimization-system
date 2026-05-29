import StarField from './StarField';
import NebulaCloud from './NebulaCloud';
import PlanetDetailView from './PlanetDetailView';
import { useUniverseStore } from '../store/universeStore';

export default function PlanetScene() {
  const { selectedPlanet, selectedSystem } = useUniverseStore();

  if (!selectedPlanet) return null;

  const starColorMap: Record<string, string> = {
    O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
    G: '#fff4e8', K: '#ffd2a1', M: '#ffcc6f',
  };
  const starColor = selectedSystem ? (starColorMap[selectedSystem.starType] || '#fff4e8') : '#fff4e8';

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[20, 10, 5]} intensity={2.5} color={starColor} />
      <pointLight position={[-5, 5, -10]} intensity={0.3} color="#4466aa" />

      <StarField count={3000} spread={100} size={0.06} opacity={0.75} speed={0.02} />
      <NebulaCloud position={[15, 5, -20]} color={starColor} scale={8} opacity={0.04} />
      <NebulaCloud position={[-12, -8, 10]} color="#334488" scale={10} opacity={0.03} />

      <PlanetDetailView planet={selectedPlanet} />
    </>
  );
}
