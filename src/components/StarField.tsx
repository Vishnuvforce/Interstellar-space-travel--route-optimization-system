import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSharedCircleTexture } from '../lib/textureCache';

interface StarFieldProps {
  count?: number;
  spread?: number;
  size?: number;
  opacity?: number;
  speed?: number;
}

export default function StarField({ count = 4000, spread = 200, size = 0.15, opacity = 0.9, speed = 0 }: StarFieldProps) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorOptions = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#ffe8c0'),
      new THREE.Color('#c0d8ff'),
      new THREE.Color('#ffd0a0'),
      new THREE.Color('#b0e0ff'),
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;

      const c = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, [count, spread]);

  const circleTexture = useMemo(() => getSharedCircleTexture(), []);

  useFrame((_, delta) => {
    if (ref.current && speed !== 0) {
      ref.current.rotation.y += delta * speed * 0.01;
      ref.current.rotation.x += delta * speed * 0.005;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        map={circleTexture}
      />
    </points>
  );
}
