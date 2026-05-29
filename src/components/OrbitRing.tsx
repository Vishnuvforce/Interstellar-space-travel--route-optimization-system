import * as THREE from 'three';

interface OrbitRingProps {
  radius: number;
  color?: string;
  opacity?: number;
}

export default function OrbitRing({ radius, color = '#334466', opacity = 0.25 }: OrbitRingProps) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.015, radius + 0.015, 96]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}
