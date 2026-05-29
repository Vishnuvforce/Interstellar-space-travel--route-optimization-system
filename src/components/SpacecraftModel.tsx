import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpacecraftModelProps {
  isFlying: boolean;
  isRefueling: boolean;
  asteroidAlert: boolean;
  scale?: number;
  engineFlameRef?: React.RefObject<THREE.Mesh>;
  warpActive?: boolean;
  shieldActiveOverride?: boolean;
  engineColorOverride?: 'orange' | 'cyan' | 'purple';
  gravityOverdrive?: boolean;
}

export default function SpacecraftModel({ 
  isFlying, 
  isRefueling, 
  asteroidAlert, 
  scale = 1,
  engineFlameRef,
  warpActive = false,
  shieldActiveOverride = false,
  engineColorOverride = 'orange',
  gravityOverdrive = false
}: SpacecraftModelProps) {
  const warpRing1Ref = useRef<THREE.Mesh>(null);
  const warpRing2Ref = useRef<THREE.Mesh>(null);
  const leftStrobeRef = useRef<THREE.Mesh>(null);
  const rightStrobeRef = useRef<THREE.Mesh>(null);
  const noseStrobeRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const leftFlameRef = useRef<THREE.Mesh>(null);
  const rightFlameRef = useRef<THREE.Mesh>(null);

  // Derive flame colors
  const getFlameColors = () => {
    switch (engineColorOverride) {
      case 'cyan':
        return { emissive: '#06b6d4', color: '#22d3ee', core: '#e0f7fa' };
      case 'purple':
        return { emissive: '#a855f7', color: '#c084fc', core: '#f3e8ff' };
      case 'orange':
      default:
        return { emissive: '#f97316', color: '#fb923c', core: '#fff7ed' };
    }
  };

  const flameColors = getFlameColors();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Dual Counter-Rotating Warp Rings
    const ringSpeedMultiplier = gravityOverdrive ? 2.5 : 1.0;
    if (warpRing1Ref.current) {
      warpRing1Ref.current.rotation.y = time * (isFlying ? 3.0 : 0.8) * ringSpeedMultiplier;
      warpRing1Ref.current.rotation.x = Math.sin(time * 0.3) * 0.08;
    }
    if (warpRing2Ref.current) {
      warpRing2Ref.current.rotation.y = -time * (isFlying ? 2.2 : 0.6) * ringSpeedMultiplier;
      warpRing2Ref.current.rotation.z = Math.cos(time * 0.4) * 0.08;
    }

    // 2. Pulsing Warp Reactor Core
    if (coreRef.current) {
      const pulse = 1.0 + Math.sin(time * (isFlying ? 15 : 4)) * 0.25;
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = (isFlying ? 2.5 : 0.8) * pulse;
    }

    // 3. Sequential RCS & Navigation Beacons
    const blinkCycle = Math.floor(time * 5.0) % 3;
    if (leftStrobeRef.current) leftStrobeRef.current.visible = blinkCycle === 0;
    if (rightStrobeRef.current) rightStrobeRef.current.visible = blinkCycle === 1;
    if (noseStrobeRef.current) noseStrobeRef.current.visible = blinkCycle === 2;

    // 4. Energy Shield Bubble Intensity
    if (shieldRef.current) {
      const isActive = asteroidAlert || warpActive || shieldActiveOverride;
      const pulseSpeed = warpActive ? 24 : 10;
      const shieldGlow = 0.08 + Math.sin(time * pulseSpeed) * 0.08;
      const baseOpacity = isActive ? 0.35 : 0.005;
      (shieldRef.current.material as THREE.MeshBasicMaterial).opacity = baseOpacity + shieldGlow;
    }

    // 5. Auxiliary Flames Scaling
    const auxPulse = 1.0 + Math.sin(time * 40) * 0.4;
    if (leftFlameRef.current) {
      leftFlameRef.current.scale.set(auxPulse, auxPulse * 1.4, auxPulse);
      leftFlameRef.current.visible = isFlying && !isRefueling;
    }
    if (rightFlameRef.current) {
      rightFlameRef.current.scale.set(auxPulse, auxPulse * 1.4, auxPulse);
      rightFlameRef.current.visible = isFlying && !isRefueling;
    }
  });

  return (
    <group scale={[scale, scale, scale]}>
      {/* ================= 1. FORWARD COMMAND CABIN ================= */}
      {/* Sleek Tapered Cockpit Hull */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.04, 0.075, 0.28, 10]} />
        <meshStandardMaterial color="#334155" roughness={0.12} metalness={0.9} />
      </mesh>
      
      {/* Front Nose Cone */}
      <mesh position={[0, 0.35, 0]}>
        <coneGeometry args={[0.04, 0.08, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.15} metalness={0.95} />
      </mesh>

      {/* Holographic Sensor Eye (Glowing cyan lens) */}
      <mesh position={[0, 0.28, 0.042]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshBasicMaterial color="#06b6d4" toneMapped={false} />
      </mesh>

      {/* Sensor Antennas */}
      {[-1, 1].map((dir, i) => (
        <group key={i} position={[0.025 * dir, 0.33, 0]}>
          <mesh rotation={[0, 0, (Math.PI / 10) * -dir]}>
            <cylinderGeometry args={[0.003, 0.002, 0.08, 4]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Nose Strobe Light */}
      <mesh ref={noseStrobeRef} position={[0, 0.395, 0]}>
        <sphereGeometry args={[0.007, 6, 6]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>


      {/* ================= 2. STRUCTURAL TRUSS & REACTOR CORE ================= */}
      {/* 4 Scaffold Support Rails */}
      {[-0.048, 0.048].map((x) => 
        [-0.048, 0.048].map((z, idx) => (
          <mesh key={`${x}-${z}-${idx}`} position={[x, -0.04, z]}>
            <cylinderGeometry args={[0.006, 0.006, 0.22, 4]} />
            <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
          </mesh>
        ))
      )}

      {/* Diagonal Cross Braces */}
      {[-1, 1].map((dir) => (
        <group key={dir} position={[0, -0.04, 0]}>
          <mesh rotation={[0, 0, (Math.PI / 6) * dir]}>
            <boxGeometry args={[0.004, 0.24, 0.004]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Pulsing FTL Plasma Reactor Core */}
      <mesh ref={coreRef} position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.16, 16]} />
        <meshStandardMaterial 
          color="#1e1b4b" 
          emissive="#d946ef" 
          emissiveIntensity={1.2} 
          roughness={0.1} 
        />
      </mesh>


      {/* ================= 3. DUAL COUNTER-ROTATING WARP RINGS ================= */}
      <group position={[0, -0.04, 0]}>
        {/* Ring 1 (Inner, rotating clockwise) */}
        <mesh ref={warpRing1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.012, 8, 36]} />
          <meshStandardMaterial color="#0ea5e9" roughness={0.15} metalness={0.9} />
          {/* Glowing Ring Emitters */}
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const angle = (idx / 6) * Math.PI * 2;
            return (
              <mesh key={idx} position={[Math.cos(angle) * 0.16, Math.sin(angle) * 0.16, 0]}>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshBasicMaterial color="#06b6d4" toneMapped={false} />
              </mesh>
            );
          })}
        </mesh>

        {/* Ring 2 (Outer, rotating counter-clockwise) */}
        <mesh ref={warpRing2Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.225, 0.01, 8, 48]} />
          <meshStandardMaterial color="#6366f1" roughness={0.2} metalness={0.95} />
          {/* Glowing Ring Emitters */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
            const angle = (idx / 8) * Math.PI * 2;
            return (
              <mesh key={idx} position={[Math.cos(angle) * 0.225, Math.sin(angle) * 0.225, 0]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#a855f7" toneMapped={false} />
              </mesh>
            );
          })}
        </mesh>
      </group>


      {/* ================= 4. RADIATOR WINGS & NAV BEACONS ================= */}
      {[-1, 1].map((dir, i) => (
        <group key={i} position={[0.17 * dir, -0.06, 0]}>
          {/* Main wing connection truss */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.01, 0.01, 0.18, 4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.95} />
          </mesh>

          {/* Ribbed Radiator / Solar Panels */}
          <group position={[0.13 * dir, 0, 0]}>
            {/* Base panel */}
            <mesh rotation={[0.18 * dir, 0, 0]}>
              <boxGeometry args={[0.16, 0.006, 0.32]} />
              <meshStandardMaterial 
                color="#2e1065" 
                emissive="#6366f1" 
                emissiveIntensity={isFlying ? 0.9 : 0.2} 
                roughness={0.08} 
              />
            </mesh>
            {/* Rib lines for texture details */}
            {[-0.12, -0.06, 0, 0.06, 0.12].map((zOffset, idx) => (
              <mesh key={idx} position={[0, 0.005, zOffset]} rotation={[0.18 * dir, 0, 0]}>
                <boxGeometry args={[0.15, 0.003, 0.008]} />
                <meshStandardMaterial color="#a78bfa" emissive="#c084fc" emissiveIntensity={0.6} />
              </mesh>
            ))}
          </group>

          {/* Wingtip strobe light */}
          <mesh 
            ref={dir === -1 ? leftStrobeRef : rightStrobeRef}
            position={[0.23 * dir, 0, 0.16]}
          >
            <sphereGeometry args={[0.014, 6, 6]} />
            <meshBasicMaterial color={dir === -1 ? "#ef4444" : "#10b981"} toneMapped={false} />
          </mesh>
        </group>
      ))}


      {/* ================= 5. PROPULSION ARRAY & TRIPLE FLAMES ================= */}
      {/* Main engine casing bulkhead */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.07, 0.085, 0.08, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.9} />
      </mesh>

      {/* Main Heavy Center Nozzle */}
      <mesh position={[0, -0.26, 0]}>
        <cylinderGeometry args={[0.042, 0.054, 0.06, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Auxiliary Left and Right Nozzles */}
      {[-0.055, 0.055].map((x, idx) => (
        <mesh key={idx} position={[x, -0.23, 0]}>
          <cylinderGeometry args={[0.022, 0.03, 0.05, 6]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}

      {/* Main engine flame (Cone) */}
      {isFlying && !isRefueling && (
        <mesh ref={engineFlameRef} position={[0, -0.42, 0]}>
          <coneGeometry args={[0.054, 0.28, 10]} />
          <meshBasicMaterial color={flameColors.emissive} toneMapped={false} />
        </mesh>
      )}

      {/* Auxiliary left engine flame */}
      <mesh ref={leftFlameRef} position={[-0.055, -0.34, 0]}>
        <coneGeometry args={[0.024, 0.16, 6]} />
        <meshBasicMaterial color={flameColors.color} toneMapped={false} />
      </mesh>

      {/* Auxiliary right engine flame */}
      <mesh ref={rightFlameRef} position={[0.055, -0.34, 0]}>
        <coneGeometry args={[0.024, 0.16, 6]} />
        <meshBasicMaterial color={flameColors.color} toneMapped={false} />
      </mesh>

      {/* Refueling energy ion beam */}
      {isRefueling && (
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.075, 0.09, 0.2, 8, 1, true]} />
          <meshBasicMaterial 
            color="#10b981" 
            wireframe 
            transparent 
            opacity={0.4} 
            depthWrite={false}
          />
        </mesh>
      )}


      {/* ================= 6. HOLOGRAPHIC SHIELD BUBBLE ================= */}
      <mesh ref={shieldRef}>
        <sphereGeometry args={[0.48, 20, 20]} />
        <meshBasicMaterial 
          color="#06b6d4" 
          wireframe 
          transparent 
          opacity={0.015} 
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
