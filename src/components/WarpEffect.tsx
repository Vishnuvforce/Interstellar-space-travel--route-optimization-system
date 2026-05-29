import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSharedCircleTexture } from '../lib/textureCache';

export default function WarpEffect({ active }: { active: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const progressRef = useRef(0);

  const { positions, velocities } = useMemo(() => {
    const count = 1500;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 6 + 0.5;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(theta) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      vel[i] = 0.3 + Math.random() * 0.7;
    }
    return { positions: pos, velocities: vel };
  }, []);

  const posRef = useRef(positions.slice());

  useFrame((_, delta) => {
    if (!ref.current || !active) {
      progressRef.current = 0;
      return;
    }
    progressRef.current = Math.min(progressRef.current + delta, 3);
    const speed = Math.min(progressRef.current * 15, 60);
    const arr = posRef.current;
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3 + 2] -= delta * speed * velocities[i];
      if (arr[i * 3 + 2] < -60) {
        arr[i * 3 + 2] = 20;
      }
    }
    const geo = ref.current.geometry;
    const attr = geo.attributes.position as THREE.BufferAttribute;
    attr.array.set(arr);
    attr.needsUpdate = true;
  });

  const circleTexture = useMemo(() => getSharedCircleTexture(), []);

  if (!active) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posRef.current, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#88ccff"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        map={circleTexture}
      />
    </points>
  );
}
