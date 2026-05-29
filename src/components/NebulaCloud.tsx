import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSharedCircleTexture } from '../lib/textureCache';

interface NebulaCloudProps {
  position: [number, number, number];
  color: string;
  scale?: number;
  opacity?: number;
}

export default function NebulaCloud({ position, color, scale = 1, opacity = 0.08 }: NebulaCloudProps) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 4 * scale;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [scale]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.005;
    }
  });

  const circleTexture = useMemo(() => getSharedCircleTexture(), []);

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.3 * scale}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        map={circleTexture}
      />
    </points>
  );
}
