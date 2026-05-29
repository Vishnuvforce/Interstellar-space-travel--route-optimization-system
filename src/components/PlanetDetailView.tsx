import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Planet } from '../types/universe';

interface PlanetDetailViewProps {
  planet: Planet;
}

export default function PlanetDetailView({ planet }: PlanetDetailViewProps) {
  const planetRef = useRef<THREE.Mesh>(null);
  const atmRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Points>(null);

  const moonAngles = useRef(planet.moons.map((_, i) => (i / Math.max(planet.moons.length, 1)) * Math.PI * 2));

  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * planet.rotationSpeed * 0.05;
    if (cloudRef.current) cloudRef.current.rotation.y += delta * planet.rotationSpeed * 0.07;
    if (atmRef.current) {
      const pulse = 1 + Math.sin(Date.now() * 0.0015) * 0.015;
      atmRef.current.scale.setScalar(pulse);
    }
    moonAngles.current = moonAngles.current.map((a, i) => a + delta * planet.moons[i].orbitSpeed * 0.15);
  });

  const isSaturn = planet.id === 'saturn';

  const cloudPositions = useMemo(() => {
    if (planet.type !== 'gas_giant' && planet.type !== 'ocean') return null;
    const count = 200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [planet]);

  const circleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  return (
    <group>
      {/* Main planet */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color={planet.color}
          roughness={planet.type === 'gas_giant' ? 0.2 : 0.85}
          metalness={planet.type === 'gas_giant' ? 0.15 : 0}
          emissive={planet.color}
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmRef}>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshBasicMaterial
          color={planet.atmosphereColor}
          transparent
          opacity={planet.atmosphereIntensity * 0.5}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer atmosphere haze */}
      <mesh>
        <sphereGeometry args={[2.6, 32, 32]} />
        <meshBasicMaterial
          color={planet.atmosphereColor}
          transparent
          opacity={planet.atmosphereIntensity * 0.1}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {/* Cloud layer (gas giants & oceans) */}
      {cloudPositions && (
        <points ref={cloudRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[cloudPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.08}
            color={planet.atmosphereColor}
            transparent
            opacity={0.4}
            sizeAttenuation
            depthWrite={false}
            map={circleTexture}
          />
        </points>
      )}

      {/* Saturn rings */}
      {isSaturn && (
        <>
          {[1.3, 1.55, 1.8, 2.05, 2.3].map((r, ri) => (
            <mesh key={ri} rotation={[Math.PI / 2 + 0.2, 0, 0]}>
              <ringGeometry args={[r * 0.95, r * 1.0, 128]} />
              <meshBasicMaterial
                color={ri % 2 === 0 ? '#d4c07a' : '#b09850'}
                transparent
                opacity={0.7 - ri * 0.1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
        </>
      )}

      {/* Moons */}
      {planet.moons.map((moon, mi) => {
        const r = moon.orbitRadius * 1.5 + 1.5;
        const x = Math.cos(moonAngles.current[mi]) * r;
        const z = Math.sin(moonAngles.current[mi]) * r;
        return (
          <group key={moon.id}>
            {/* Moon orbit ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r - 0.015, r + 0.015, 64]} />
              <meshBasicMaterial color="#334466" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            {/* Moon */}
            <mesh position={[x, 0, z]}>
              <sphereGeometry args={[moon.radius * 0.8, 16, 16]} />
              <meshStandardMaterial color={moon.color} roughness={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* Directional light (sun simulation) */}
      <directionalLight position={[10, 5, 5]} intensity={1.5} color="#fffae0" />
      <ambientLight intensity={0.15} />
    </group>
  );
}
