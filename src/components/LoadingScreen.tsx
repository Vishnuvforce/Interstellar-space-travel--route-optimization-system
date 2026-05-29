import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import SpacecraftModel from './SpacecraftModel';
import { Cpu, Radio, Shield, Zap, Sliders, RotateCw } from 'lucide-react';

// 3D Scene Components for the Loading Screen
interface LoadingSceneContentProps {
  progress: number;
  phase: number;
  isArrived: boolean;
  warpFactor: number;
  shieldActive: boolean;
  engineColor: 'orange' | 'cyan' | 'purple';
  gravityOverdrive: boolean;
}

function LoadingSceneContent({ 
  progress, 
  phase, 
  isArrived, 
  warpFactor, 
  shieldActive, 
  engineColor, 
  gravityOverdrive 
}: LoadingSceneContentProps) {
  const { camera } = useThree();
  const shipRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Points>(null);
  const asteroidsRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  const arrivalFactorRef = useRef(0);

  // Initialize random star positions
  const { starPos, starSpeeds } = useMemo(() => {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 45;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 45;
      pos[i * 3 + 2] = Math.random() * -80 - 10;
      speeds[i] = 0.5 + Math.random() * 1.5;
    }
    return { starPos: pos, starSpeeds: speeds };
  }, []);

  // Initialize asteroid positions for asteroid belt phase
  const asteroids = useMemo(() => {
    const count = 35;
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          Math.random() * -30 - 15
        ),
        rotationSpeed: (Math.random() - 0.5) * 1.5,
        scale: 0.12 + Math.random() * 0.28,
      });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Track arrival transition interpolation factor
    if (isArrived) {
      arrivalFactorRef.current = Math.min(arrivalFactorRef.current + delta * 1.3, 1.0);
    }
    const arrF = arrivalFactorRef.current;

    // 1. Spaceship Animations & Positioning
    if (shipRef.current) {
      shipRef.current.position.set(0, 0, 0);

      if (isArrived) {
        // Ship zooms past the camera towards the viewer (positive Z)
        shipRef.current.position.z = arrF * 14.0;
        shipRef.current.position.y = arrF * -2.0;
        shipRef.current.rotation.set(-0.25, arrF * 0.45, 0.12);
      } else {
        // Phase-specific spacecraft visual behavior
        if (phase === 1) {
          // Launch: shake thruster slightly, climb up slowly
          const shake = Math.sin(time * 65) * 0.005;
          shipRef.current.position.y = -2.5 + (progress / 20) * 2.5 + shake;
          shipRef.current.rotation.set(-0.15, 0, 0);
        } else if (phase === 2) {
          // Cruise: gentle yaw / roll float
          shipRef.current.position.y = Math.sin(time * 1.8) * 0.08;
          shipRef.current.position.x = Math.cos(time * 1.2) * 0.08;
          shipRef.current.rotation.set(
            Math.sin(time * 0.8) * 0.03,
            0,
            Math.cos(time * 1.4) * 0.05
          );
        } else if (phase === 3) {
          // Evasive asteroid dodging curves
          const wave = Math.sin(time * 3.5);
          shipRef.current.position.x = wave * 0.55;
          shipRef.current.position.y = Math.cos(time * 2.5) * 0.18;
          shipRef.current.rotation.set(0.05, wave * 0.18, wave * -0.15);
        } else if (phase === 4) {
          // Warp Drive: intense thrust shake, nose aligns perfectly forward
          const warpShake = (Math.random() - 0.5) * 0.015 * Math.min(warpFactor, 4.0);
          shipRef.current.position.set(warpShake, warpShake, 0);
          shipRef.current.rotation.set(0, 0, 0);
        } else if (phase === 5) {
          // Deceleration near destination planet: tilt sideways, slow orbit float
          shipRef.current.position.x = Math.sin(time * 0.8) * 0.35;
          shipRef.current.position.y = Math.cos(time * 0.6) * 0.12;
          shipRef.current.rotation.set(0.08, -0.22, 0.12);
        }
      }
    }

    // 2. Stars Particle Field flow speed controller
    if (starsRef.current) {
      const geo = starsRef.current.geometry;
      const attr = geo.attributes.position as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;

      // Adjust star flow speed depending on active travel phase & warp factor
      let travelSpeed = 8;
      if (phase === 1) travelSpeed = 4;
      if (phase === 3) travelSpeed = 6;
      if (phase === 4) travelSpeed = 85; // hyper warp speed!
      if (phase === 5) travelSpeed = 1.2; // decelerating approach

      // Multiply by speed slider factor
      travelSpeed = travelSpeed * warpFactor;

      if (isArrived) {
        // Slow down stars to a stop
        travelSpeed = THREE.MathUtils.lerp(travelSpeed, 0.2, arrF);
      }

      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 2] += delta * travelSpeed * starSpeeds[i] * 6;

        // Reset stars once they pass behind camera
        if (arr[i * 3 + 2] > 10) {
          arr[i * 3] = (Math.random() - 0.5) * 45;
          arr[i * 3 + 1] = (Math.random() - 0.5) * 45;
          arr[i * 3 + 2] = -90;
        }
      }
      attr.needsUpdate = true;
    }

    // 3. Move Asteroid field past camera in Phase 3
    if (asteroidsRef.current) {
      asteroidsRef.current.visible = phase === 3 && !isArrived;
      if (phase === 3 && !isArrived) {
        asteroidsRef.current.position.z += delta * 12 * warpFactor;
        if (asteroidsRef.current.position.z > 35) {
          asteroidsRef.current.position.z = -15;
        }
        // Rotate local stones
        asteroidsRef.current.children.forEach((mesh, idx) => {
          mesh.rotation.x += delta * 0.8 * (idx % 2 === 0 ? 1 : -1);
          mesh.rotation.y += delta * 0.5 * (idx % 3 === 0 ? 1 : -1);
        });
      }
    }

    // 4. Destination Planet Approach and Shift on Arrival (Fluid exponential decay)
    if (planetRef.current) {
      planetRef.current.visible = (phase === 5 || isArrived);
      if (ringRef.current) ringRef.current.visible = (phase === 5 || isArrived);

      if (phase === 5 || isArrived) {
        // Target position based on whether arrived or approaching
        const targetPos = new THREE.Vector3();
        if (isArrived) {
          targetPos.set(-1.8, 0.0, -6.8);
        } else {
          const approachFactor = (Math.min(progress, 100) - 95) / 5; // scales 0 to 1
          const approachZ = -30 + approachFactor * 21.5;
          const approachY = -4 + approachFactor * 4.2;
          const approachX = 2.4;
          targetPos.set(approachX, approachY, approachZ);
        }

        // Fluid position interpolation
        planetRef.current.position.lerp(targetPos, 1 - Math.exp(-3.5 * delta));
        
        if (ringRef.current) {
          ringRef.current.position.copy(planetRef.current.position);
          ringRef.current.rotation.x = Math.PI / 2 + 0.35;
          // Spin the ring a bit faster for visual interest
          const ringSpin = isArrived ? 0.6 * (1 - arrF) + 0.08 : 0.08;
          ringRef.current.rotation.y += delta * ringSpin;
        }

        // Planet spin speed increases slightly during move, then settles
        const spinSpeed = isArrived ? 0.35 * (1 - arrF) + 0.04 : 0.04;
        planetRef.current.rotation.y += delta * spinSpeed;

        // Maintain scale at 1.0 on arrival (do not shrink to 0!)
        const targetScaleVal = 1.0;
        planetRef.current.scale.set(targetScaleVal, targetScaleVal, targetScaleVal);
        if (ringRef.current) {
          ringRef.current.scale.set(targetScaleVal, targetScaleVal, targetScaleVal);
        }

        // Morph planet material to golden celestial body
        const mat = planetRef.current.material as THREE.MeshStandardMaterial;
        if (mat) {
          const baseColor = new THREE.Color("#3b82f6");
          const goldColor = new THREE.Color("#fbbf24");
          const currentColor = mat.color.clone();
          const targetColor = baseColor.clone().lerp(goldColor, arrF);
          currentColor.lerp(targetColor, 1 - Math.exp(-4 * delta));
          mat.color.copy(currentColor);

          const baseEmissive = new THREE.Color("#1e3a8a");
          const goldEmissive = new THREE.Color("#d97706");
          const currentEmissive = mat.emissive.clone();
          const targetEmissive = baseEmissive.clone().lerp(goldEmissive, arrF);
          currentEmissive.lerp(targetEmissive, 1 - Math.exp(-4 * delta));
          mat.emissive.copy(currentEmissive);

          const targetEmissiveIntensity = THREE.MathUtils.lerp(0.4, 2.5, arrF);
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissiveIntensity, 1 - Math.exp(-4 * delta));

          const targetMetalness = THREE.MathUtils.lerp(0.2, 0.9, arrF);
          mat.metalness = THREE.MathUtils.lerp(mat.metalness, targetMetalness, 1 - Math.exp(-4 * delta));

          const targetRoughness = THREE.MathUtils.lerp(0.4, 0.1, arrF);
          mat.roughness = THREE.MathUtils.lerp(mat.roughness, targetRoughness, 1 - Math.exp(-4 * delta));
        }

        // Morph ring material to gold
        if (ringRef.current) {
          const ringMat = ringRef.current.material as THREE.MeshBasicMaterial;
          if (ringMat) {
            const baseRingColor = new THREE.Color("#38bdf8");
            const goldRingColor = new THREE.Color("#fbbf24");
            const currentRingColor = ringMat.color.clone();
            const targetRingColor = baseRingColor.clone().lerp(goldRingColor, arrF);
            currentRingColor.lerp(targetRingColor, 1 - Math.exp(-4 * delta));
            ringMat.color.copy(currentRingColor);

            const targetOpacity = THREE.MathUtils.lerp(0.35, 0.75, arrF);
            ringMat.opacity = THREE.MathUtils.lerp(ringMat.opacity, targetOpacity, 1 - Math.exp(-4 * delta));
          }
        }
      }
    }

    // 4b. Atmospheric Halo Animation
    if (atmosphereRef.current && planetRef.current) {
      atmosphereRef.current.position.copy(planetRef.current.position);
      atmosphereRef.current.visible = (phase === 5 || isArrived);

      // Breathing effect
      const atmosBaseScale = 1.06 + Math.sin(time * 2.5) * 0.015;
      const targetAtmosScale = THREE.MathUtils.lerp(1.0, atmosBaseScale, arrF);
      atmosphereRef.current.scale.lerp(new THREE.Vector3(targetAtmosScale, targetAtmosScale, targetAtmosScale), 1 - Math.exp(-5 * delta));

      const atmosMat = atmosphereRef.current.material as THREE.MeshBasicMaterial;
      if (atmosMat) {
        const targetOpacity = THREE.MathUtils.lerp(0.0, 0.35 + Math.sin(time * 3.0) * 0.05, arrF);
        atmosMat.opacity = THREE.MathUtils.lerp(atmosMat.opacity, targetOpacity, 1 - Math.exp(-4 * delta));
      }
    }

    // 5. Cinematic Camera Motion & Sweeping angles
    if (!isArrived) {
      if (phase === 1) {
        // Look up tracking the launch
        camera.position.set(0, -1.2, 5.5);
        camera.lookAt(new THREE.Vector3(0, -2.5 + (progress / 20) * 2.5, 0));
      } else if (phase === 2) {
        // Slow cinematic sweep side-to-side
        const sweepAngle = time * 0.25;
        camera.position.set(Math.sin(sweepAngle) * 3.5, 0.4, Math.cos(sweepAngle) * 3.5 + 2.5);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
      } else if (phase === 3) {
        // Closer Chase camera during asteroid field to emphasize tension
        camera.position.set(0, 0.65, 3.2);
        camera.lookAt(new THREE.Vector3(shipRef.current?.position.x || 0, 0, -0.8));
      } else if (phase === 4) {
        // Warp Camera: far chase back looking straight ahead with random turbulence shake
        const shakeAmp = 0.065 * warpFactor;
        const camShakeX = (Math.random() - 0.5) * shakeAmp;
        const camShakeY = (Math.random() - 0.5) * shakeAmp;
        camera.position.set(camShakeX, 0.7 + camShakeY, 6.0);
        camera.lookAt(new THREE.Vector3(0, 0.1, -2.5));
      } else if (phase === 5) {
        // Deceleration Orbit view: wide panoramic looking at ship and planet
        camera.position.set(-2.2, 0.6, 4.2);
        camera.lookAt(new THREE.Vector3(0.5, 0, -1.5));
      }
    } else {
      // Arrived camera: lock stationary wide shot centering the left-side planet
      camera.position.set(0, 0, 5.0);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 12, 10]} intensity={2.0} color="#93c5fd" />
      <pointLight position={[-8, -5, -15]} intensity={1.5} color="#a78bfa" />
      
      {/* Ship Group - Rotated horizontal by wrapping in a base pitch offset */}
      <group ref={shipRef}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <SpacecraftModel 
            isFlying={true} 
            isRefueling={false} 
            asteroidAlert={phase === 3} 
            scale={1.2}
            warpActive={phase === 4}
            shieldActiveOverride={shieldActive}
            engineColorOverride={engineColor}
            gravityOverdrive={gravityOverdrive}
          />
        </group>
      </group>

      {/* Stars Points Field */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPos, 3]} />
        </bufferGeometry>
        <pointsMaterial 
          size={phase === 4 ? 0.38 : 0.095} 
          color={phase === 4 ? "#93c5fd" : "#ffffff"} 
          transparent 
          opacity={phase === 4 ? 0.95 : 0.8}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Asteroids belt Group */}
      <group ref={asteroidsRef}>
        {asteroids.map((ast) => (
          <mesh key={ast.id} position={ast.pos} scale={[ast.scale, ast.scale, ast.scale]}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#3f444c" roughness={0.9} metalness={0.05} />
          </mesh>
        ))}
      </group>

      {/* Destination Planet */}
      <mesh ref={planetRef} position={[2.5, 0.2, -6]}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          roughness={0.4} 
          metalness={0.2}
          emissive="#1e3a8a"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Atmospheric Halo */}
      <mesh ref={atmosphereRef} position={[2.5, 0.2, -6]}>
        <sphereGeometry args={[1.52, 64, 64]} />
        <meshBasicMaterial 
          color="#fbbf24" 
          transparent 
          opacity={0.0} 
          side={THREE.BackSide} 
        />
      </mesh>
      
      {/* Saturn-style glow ring for destination planet */}
      <mesh ref={ringRef} position={[2.5, 0.2, -6]} rotation={[Math.PI / 2 + 0.35, 0, 0]}>
        <ringGeometry args={[1.9, 3.2, 64]} />
        <meshBasicMaterial 
          color="#38bdf8" 
          transparent 
          opacity={0.35} 
          side={THREE.DoubleSide} 
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// Simulated loader log updates
const BOOT_LOGS = [
  "INITIALIZING FTL NAV CORE... [OK]",
  "SECURE QUANTUM LINK NOMINAL... [OK]",
  "CALIBRATING DIJKSTRA SEARCH ALGORITHM... [OK]",
  "ESTABLISHING A* DISTANCE HEURISTICS... [OK]",
  "SYNCHRONIZING INTERSTELLAR ANOMALY MAPS... [OK]",
  "MAPPING GALAXY EDGE NODE WEIGHTS... [OK]",
  "PREHEATING PLASMA WARP CORE... [OK]",
  "CHARGING TACTICAL THREAT HUD RADAR... [OK]",
  "CAPTURING STARSHIP GRAVITY FIELD... [OK]",
  "ENGAGING INTEL HYPERDRIVE SHIELD CONTROLS... [OK]",
  "FINAL DESTINATION LOCK RESOLVED... [OK]"
];

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(1);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const logIndexRef = useRef(0);

  // Cockpit HUD overrides state
  const [warpFactor, setWarpFactor] = useState(1.0);
  const [shieldActive, setShieldActive] = useState(false);
  const [engineColor, setEngineColor] = useState<'orange' | 'cyan' | 'purple'>('orange');
  const [gravityOverdrive, setGravityOverdrive] = useState(false);

  // Arrival states
  const [isArrived, setIsArrived] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Refs to allow uninterrupted loop
  const progressRef = useRef(0);
  const warpFactorRef = useRef(1.0);
  const isArrivedRef = useRef(false);

  // Synchronize refs on every render
  warpFactorRef.current = warpFactor;
  isArrivedRef.current = isArrived;

  const goldSparks = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3.5 + 1.2,
      delay: Math.random() * 4,
      duration: Math.random() * 6 + 5,
    }));
  }, []);

  // Determine travel phase based on simulated loading progress
  useEffect(() => {
    if (progress < 20) {
      setPhase(1); // Launch (0% - 20%)
    } else if (progress < 50) {
      setPhase(2); // Cruise (20% - 50%)
    } else if (progress < 75) {
      setPhase(3); // Evasive (50% - 75%)
    } else if (progress < 95) {
      setPhase(4); // Warp Hyper Jump (75% - 95%)
    } else {
      setPhase(5); // Decelerate / Arrival (95% - 100%)
    }
  }, [progress]);

  // Handle simulated loading duration and progress updates
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const animateProgress = (time: number) => {
      if (isArrivedRef.current) return;

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const currentProgress = progressRef.current;
      const currentWarp = warpFactorRef.current;

      // Base rate depending on current phase
      let baseRate = 8.5; // ~12 seconds default
      if (currentProgress >= 75 && currentProgress < 95) {
        baseRate = 14.0; // accelerate warp phase quickly
      } else if (currentProgress >= 95) {
        baseRate = 4.5; // decelerate approach phase slowly
      }

      // Multiply rate by manual slider speed factor
      const rate = baseRate * currentWarp;
      
      const nextProgress = Math.min(currentProgress + delta * rate, 100);
      progressRef.current = nextProgress;
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        setIsArrived(true);
        setShowFlash(true); // trigger white flash transition!
        return;
      }

      animationFrameId = requestAnimationFrame(animateProgress);
    };

    animationFrameId = requestAnimationFrame(animateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Feed log stream list
  useEffect(() => {
    if (isArrived) return;

    const interval = setInterval(() => {
      if (logIndexRef.current < BOOT_LOGS.length) {
        setActiveLogs((prev) => [...prev, BOOT_LOGS[logIndexRef.current]].slice(-4));
        logIndexRef.current += 1;
      }
    }, Math.max(250, 950 / warpFactor)); // log write rate speeds up as warp factor increases!
    
    return () => clearInterval(interval);
  }, [warpFactor, isArrived]);

  // Manual Trigger Hyperdrive Boost
  const handleEngageHyperdrive = () => {
    if (isArrived) return;
    
    // Jump straight to Warp speed Phase (75% progress)
    progressRef.current = 75;
    setProgress(75);
    setWarpFactor(7.0); 
    setShieldActive(true);
    setEngineColor('cyan');
    setGravityOverdrive(true);

    setActiveLogs((prev) => [
      ...prev,
      "MANUAL COMMAND SYSTEM OVERRIDE... [ENGAGED]",
      "TACTICAL BOOST: BOOTING QUANTUM PLASMAS... [OK]",
      "SHIELDS REINFORCED FOR COMET FIELDS... [OK]",
      "WARP PROPULSION AT SECTOR WARP FACTOR 7.0... [ENGAGED]"
    ].slice(-4));
  };

  // Logging toggles changes
  const handleShieldToggle = () => {
    const nextVal = !shieldActive;
    setShieldActive(nextVal);
    setActiveLogs((prev) => [
      ...prev,
      `TACTICAL DEFLECTOR SHIELDS: ${nextVal ? 'ONLINE (100% ENERGY)' : 'OFFLINE (ENERGY LOW)'}`
    ].slice(-4));
  };

  const handleEngineColorChange = (color: 'orange' | 'cyan' | 'purple') => {
    setEngineColor(color);
    const names = { orange: 'THERMAL STANDARD', cyan: 'HYDROGEN FUSION', purple: 'QUANTUM ANTIMATTER' };
    setActiveLogs((prev) => [
      ...prev,
      `PROPULSION FLOW PROFILE LOADED: ${names[color]}... [OK]`
    ].slice(-4));
  };

  const handleGravityToggle = () => {
    const nextVal = !gravityOverdrive;
    setGravityOverdrive(nextVal);
    setActiveLogs((prev) => [
      ...prev,
      `FTL RING STABILIZERS ROTATING SPEED: ${nextVal ? 'MAX OVERDRIVE (3500 RPM)' : 'NOMINAL (800 RPM)'}`
    ].slice(-4));
  };

  const getPhaseMessage = () => {
    switch (phase) {
      case 1:
        return "Preheating Hyperdrive Core...";
      case 2:
        return "Cruising Stellar Clusters...";
      case 3:
        return "Evading Local Asteroid Hazard...";
      case 4:
        return "Engaging FTL Hyperspace Warp...";
      case 5:
        return "Approaching Coordinates Destination...";
      default:
        return "Navigating Constellations...";
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000308] z-50 flex flex-col justify-between overflow-hidden select-none font-mono text-white">
      {/* 3D background view */}
      <div className="absolute inset-0 w-full h-full">
        <Canvas camera={{ position: [0, 0, 5.5], fov: 60, near: 0.05, far: 500 }}>
          <LoadingSceneContent 
            progress={progress} 
            phase={phase} 
            isArrived={isArrived}
            warpFactor={warpFactor}
            shieldActive={shieldActive}
            engineColor={engineColor}
            gravityOverdrive={gravityOverdrive}
          />
        </Canvas>
      </div>

      {/* Full screen arrival flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, times: [0, 0.15, 1], ease: "easeInOut" }}
            onAnimationComplete={() => setShowFlash(false)}
            className="absolute inset-0 bg-white z-[60] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Top Header telemetry overlay */}
      <div className="relative w-full p-6 flex justify-between items-start bg-gradient-to-b from-black/90 via-black/40 to-transparent z-40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)] animate-pulse">
            <Radio className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest uppercase text-white font-mono">Interstellar Space Travel Navigation</h1>
            <p className="text-[7.5px] text-cyan-400 font-bold font-mono tracking-widest mt-0.5">LAUNCH SEQUENCE PROTOCOL ENGAGED</p>
          </div>
        </div>

        {/* Tactical Sub-Badge */}
        <div className="flex items-center gap-4 text-right">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2 flex gap-3 text-[8px] font-mono leading-none">
            <div>
              <span className="text-slate-500 block">FTL WARP VELOCITY:</span>
              <span className={warpFactor > 3.0 ? 'text-cyan-400 font-bold animate-pulse' : 'text-emerald-400 font-bold'}>
                {warpFactor.toFixed(1)}x
              </span>
            </div>
            <div className="border-l border-white/5 pl-2">
              <span className="text-slate-500 block">TACTICAL DEF:</span>
              <span className={shieldActive ? 'text-cyan-400 font-bold animate-pulse' : 'text-slate-500 font-bold'}>
                {shieldActive ? 'SHIELD ENGAGED' : 'STANDBY'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={onComplete}
            className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/40 hover:bg-cyan-500/25 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)] pointer-events-auto"
          >
            Skip Intro
          </button>
        </div>
      </div>

      {/* Arrival Title Card Panel overlay (appears when loading finishes) */}
      <AnimatePresence>
        {isArrived && (
          <>
            {/* DreamWorks Atmospheric Space Nebulas */}
            <div className="absolute inset-0 bg-[#000208]/90 overflow-hidden pointer-events-none z-30 transition-all duration-1000">
              <div 
                className="absolute w-[80vw] h-[80vw] rounded-full bg-blue-950/20 blur-[130px] -top-[10%] -left-[10%] animate-pulse" 
                style={{ animationDuration: '18s' }}
              />
              <div 
                className="absolute w-[90vw] h-[90vw] rounded-full bg-indigo-950/20 blur-[140px] -bottom-[20%] -right-[10%] animate-pulse" 
                style={{ animationDuration: '24s', animationDelay: '2s' }}
              />
              <div 
                className="absolute w-[70vw] h-[70vw] rounded-full bg-amber-500/5 blur-[120px] top-[15%] left-[20%] animate-pulse" 
                style={{ animationDuration: '15s', animationDelay: '4s' }}
              />
            </div>

            {/* Glowing Golden Particle Sparks */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-35">
              {goldSparks.map(spark => (
                <motion.div
                  key={spark.id}
                  className="absolute bg-gradient-to-t from-yellow-300 to-amber-500 rounded-full opacity-60 pointer-events-none"
                  style={{
                    left: spark.left,
                    top: spark.top,
                    width: spark.size,
                    height: spark.size,
                    boxShadow: '0 0 8px rgba(251, 191, 36, 0.8)',
                  }}
                  animate={{
                    y: [0, -380],
                    opacity: [0, 0.75, 0],
                  }}
                  transition={{
                    duration: spark.duration,
                    repeat: Infinity,
                    delay: spark.delay,
                    ease: "linear",
                  }}
                />
              ))}
            </div>

            {/* Left Side: DreamWorks Style Space Astronaut Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -70 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
              className="absolute left-[17.5%] top-[50%] -translate-y-1/2 flex flex-col items-center gap-4 z-40 select-none pointer-events-none"
            >
              <svg viewBox="0 0 200 220" className="w-[280px] h-[300px] drop-shadow-[0_0_35px_rgba(245,158,11,0.55)]">
                {/* Glowing crescent moon path - semi-transparent to overlay on the 3D planet */}
                <path 
                  d="M 140,30 A 75,75 0 1,0 140,180 A 62,62 0 1,1 140,30 Z" 
                  fill="url(#goldGradient)" 
                  filter="url(#glow)"
                  opacity="0.65"
                  style={{ mixBlendMode: 'screen' }}
                />
                
                {/* Astronaut silhouette sitting on crescent */}
                <g transform="translate(74, 98) scale(0.48)" fill="#020617">
                  {/* Helmet dome */}
                  <circle cx="30" cy="18" r="9" />
                  <rect x="25.5" y="14" width="9" height="5.5" rx="1.5" fill="#fef08a" opacity="0.85" />
                  {/* Suit backpack */}
                  <rect x="13" y="27" width="10" height="22" rx="3" />
                  {/* Torso */}
                  <path d="M 22,27 L 38,27 L 38,50 L 22,50 Z" />
                  {/* Arm holding fishing rod */}
                  <path d="M 36,32 Q 46,32 52,28" stroke="#020617" strokeWidth="3" strokeLinecap="round" fill="none" />
                  {/* Hanging legs */}
                  <path d="M 25,50 L 25,68 Q 25,72 28,72" stroke="#020617" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                  <path d="M 33,50 L 33,65 Q 33,69 36,69" stroke="#020617" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                  {/* Fishing rod */}
                  <path d="M 50,29 Q 78,5 98,35" stroke="#fbbf24" strokeWidth="1.2" fill="none" />
                </g>

                {/* Line string */}
                <path d="M 121,115 L 121,160" stroke="#fef08a" strokeWidth="0.8" strokeDasharray="1,1" />

                {/* Pulsing Star at the end of the line */}
                <g transform="translate(121, 160)">
                  <polygon points="0,-6 1.8,-1.8 6.3,-1.8 2.7,0.9 4,5.4 0,2.7 -4,5.4 -2.7,0.9 -6.3,-1.8 -1.8,-1.8" fill="#fff" />
                  {/* Double expanding ripples to mesmerize */}
                  <circle cx="0" cy="0" r="10" fill="none" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4" className="animate-ping" style={{ animationDuration: '3s' }} />
                  <circle cx="0" cy="0" r="18" fill="none" stroke="#f59e0b" strokeWidth="0.3" opacity="0.2" className="animate-ping" style={{ animationDuration: '4.5s', animationDelay: '1s' }} />
                </g>

                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="40%" stopColor="#fbbf24" />
                    <stop offset="75%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                  <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
              </svg>
              <span className="text-[7px] text-amber-500/50 uppercase tracking-[0.4em] font-mono animate-pulse">
                &mdash; interstellar voyager &mdash;
              </span>
            </motion.div>

            {/* Right Side: DreamWorks Inspired Golden Title Card */}
            <div className="absolute right-0 top-0 bottom-0 w-[48%] flex flex-col justify-center p-14 bg-gradient-to-l from-black/90 via-black/60 to-transparent z-40">
              <motion.div
                initial={{ opacity: 0, x: 70 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 1.0, ease: "easeOut" }}
                className="space-y-6 text-left"
              >
                <div className="space-y-2">
                  <span className="text-amber-500 font-bold text-[8px] tracking-[0.35em] uppercase block font-mono">
                    NAV SYSTEM CO-ORDINATES RESOLVED
                  </span>
                  
                  {/* Wide Golden Spaced Cinematic Header */}
                  <h2 className="text-3xl font-extrabold text-white leading-tight uppercase font-mono tracking-wide">
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]">
                      Interstellar
                    </span>
                    <span className="block text-[18px] font-black tracking-[0.22em] text-amber-400 mt-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                      Space Travel
                    </span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600 font-black tracking-widest mt-1 drop-shadow-[0_0_15px_rgba(217,119,6,0.35)]">
                      Navigation
                    </span>
                  </h2>
                </div>

                <div className="w-20 h-[1.5px] bg-gradient-to-r from-amber-400 to-transparent" />
                
                <p className="text-[9.5px] text-slate-400 font-sans leading-relaxed tracking-wide">
                  Stellar core coordinate mappings are complete. The FTL hyperdrive engine stabilizers have aligned on target sector. Your command bridge engagement sequence is ready.
                </p>

                {/* Golden Diagnostic Checklist */}
                <div className="border border-amber-900/30 bg-amber-950/15 p-4 rounded-xl space-y-2.5 font-mono text-[8px] text-amber-200/70 relative">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                  <div className="flex justify-between">
                    <span>FTL WARP DENSITY:</span>
                    <span className="text-amber-400 font-bold">1.21 GW [NOMINAL]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GRAVITY STABILIZERS:</span>
                    <span className="text-amber-400 font-bold">{gravityOverdrive ? 'OVERDRIVE ACTIVE (3500 RPM)' : 'NOMINAL STABLE'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SHIELD DAMPENERS:</span>
                    <span className="text-amber-400 font-bold">{shieldActive ? 'PROJECTORS REINFORCED' : 'STANDBY MODE'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DESTINATION MARKER:</span>
                    <span className="text-yellow-400 font-bold uppercase">ARRIVED [G-SOL-3]</span>
                  </div>
                </div>

                {/* Enter Command Deck Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onComplete}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-[9.5px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 pointer-events-auto border border-yellow-300/30 font-mono"
                >
                  <span>Enter Command Deck</span>
                  <span className="text-[12px] font-black font-sans">&rarr;</span>
                </motion.button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Loading Dashboard & Control Deck Overlay */}
      <AnimatePresence>
        {!isArrived && (
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.5 }}
            className="relative w-full p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent space-y-4 z-40"
          >
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
              
              {/* Column 1: Console logs */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[9px] text-cyan-400 font-bold uppercase tracking-widest">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>AI stellar console diagnostic logs</span>
                </div>
                
                <div className="bg-slate-950/90 border border-slate-850 p-3.5 rounded-xl min-h-[96px] font-mono text-[8px] text-slate-400 space-y-1 shadow-2xl relative">
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40" />
                  {activeLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-cyan-500 font-bold">&gt;&gt;</span>
                      <span className={log.includes('[OK]') || log.includes('STABILIZED') ? 'text-slate-300' : 'text-cyan-300 font-semibold'}>{log}</span>
                    </div>
                  ))}
                  {activeLogs.length === 0 && <span className="text-slate-650 italic">AI core logging active...</span>}
                </div>
              </div>

              {/* Column 2: Cockpit interactive overrides */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-850 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-[9px] text-purple-400 font-bold uppercase tracking-widest">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Starship Cockpit Overrides</span>
                </div>

                <div className="space-y-3 text-[8px] font-mono">
                  {/* Slider: Warp velocity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>WARP SPEED FACTOR:</span>
                      <span className="text-cyan-300 font-bold">{warpFactor.toFixed(1)}x SPEED</span>
                    </div>
                    <input 
                      type="range"
                      min="0.5"
                      max="9.9"
                      step="0.2"
                      value={warpFactor}
                      onChange={(e) => setWarpFactor(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded accent-cyan-500 cursor-pointer pointer-events-auto"
                    />
                  </div>

                  {/* Dynamic buttons grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Deflector shield toggle */}
                    <button
                      onClick={handleShieldToggle}
                      className={`py-1.5 px-2 rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer pointer-events-auto ${
                        shieldActive 
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>{shieldActive ? 'SHIELD ON' : 'SHIELD'}</span>
                    </button>

                    {/* Ring Gravity overdrive */}
                    <button
                      onClick={handleGravityToggle}
                      className={`py-1.5 px-2 rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer pointer-events-auto ${
                        gravityOverdrive 
                          ? 'bg-purple-500/20 border-purple-400/50 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.15)]'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <RotateCw className="w-3 h-3 animate-spin" style={{ animationDuration: gravityOverdrive ? '1.5s' : '4s' }} />
                      <span>{gravityOverdrive ? 'STAB MAX' : 'STABILIZER'}</span>
                    </button>

                    {/* hyperdrive boost */}
                    <button
                      onClick={handleEngageHyperdrive}
                      className="py-1.5 px-2 rounded-lg border bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-cyan-400/30 text-white font-bold tracking-wider flex items-center justify-center gap-1 cursor-pointer pointer-events-auto transition-all"
                    >
                      <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                      <span>WARP JUMP</span>
                    </button>
                  </div>

                  {/* Engine Color plasma mix */}
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                    <span className="text-slate-400">ENGINE PLASMA MIX:</span>
                    <div className="flex gap-1.5 pointer-events-auto">
                      {(['orange', 'cyan', 'purple'] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => handleEngineColorChange(color)}
                          className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                            engineColor === color 
                              ? 'ring-2 ring-white scale-110 shadow-lg' 
                              : 'opacity-55 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: color === 'orange' ? '#f97316' : color === 'cyan' ? '#06b6d4' : '#a855f7'
                          }}
                          title={`Swap fuel flow to ${color}`}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Column 3: Loader progress */}
              <div className="w-full flex flex-col gap-2 relative">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest animate-pulse">
                    {getPhaseMessage()}
                  </span>
                  <span className="text-xs font-bold text-white font-mono tracking-wider">
                    {progress.toFixed(1)}%
                  </span>
                </div>

                {/* Glowing progress line */}
                <div className="w-full h-2 bg-slate-950 border border-slate-850 rounded-full overflow-hidden p-0.5 relative shadow-inner">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-white shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                    style={{ width: `${progress}%` }}
                    layoutId="loading-bar-fill"
                  />
                </div>

                {/* Quick Metrics columns */}
                <div className="grid grid-cols-3 gap-2 mt-1 text-[7.5px] font-mono text-slate-500 leading-none">
                  <div>
                    <span>COORDINATES:</span>
                    <span className="text-white font-bold block mt-0.5 uppercase">X:125.7 Y:-43.2 Z:89.1</span>
                  </div>
                  <div className="border-l border-white/5 pl-2">
                    <span>PROPULSION TEMP:</span>
                    <span className={`font-bold block mt-0.5 ${phase === 4 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                      {phase === 4 ? '3820°C' : '480°C'}
                    </span>
                  </div>
                  <div className="border-l border-white/5 pl-2">
                    <span>SECTOR RANGE:</span>
                    <span className="text-white font-bold block mt-0.5 uppercase">14.8M LIGHT YEARS</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
