import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAlgorithmStore } from '../store/algorithmStore';
import { useUniverseStore } from '../store/universeStore';
import { UNIVERSE_DATA } from '../data/universeData';
import SpacecraftModel from './SpacecraftModel';

export default function RocketMesh() {
  const { 
    rocketPosition, 
    isFlying, 
    isRefueling, 
    updateFlight, 
    shortestPath, 
    courseLocked,
    fuel,
    rocketSpeedFactor,
    setRocketSpeedFactor,
    startFlight,
    stopFlight,
    asteroids,
    asteroidAlert,
    generateAsteroidsForPath,
    currentSegmentIndex,
    cameraMode,
    cinematicCamera,
    rocketProgress,
    shieldActive,
    engineColor,
    gravityOverdrive
  } = useAlgorithmStore();
  
  const { level, selectedGalaxy, selectedSystem } = useUniverseStore();
  const { scene, camera } = useThree();
  
  const rocketRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const asteroidGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 1), []);
  const asteroidMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#4b535d",
    roughness: 0.9,
    metalness: 0.1
  }), []);

  // Particle plume parameters
  const particleCount = 25;
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < particleCount; i++) {
      arr.push({
        pos: new THREE.Vector3(),
        life: Math.random(),
        speed: 0.15 + Math.random() * 0.2,
      });
    }
    return arr;
  }, []);

  const particleRef = useRef<THREE.Points>(null);
  const posArray = useMemo(() => new Float32Array(particleCount * 3), []);

  useFrame((state, delta) => {
    if (!rocketPosition) return;

    // 1. Resolve dynamic coordinates of nodes at current level
    const positions: Record<string, [number, number, number]> = {};
    if (level === 'universe') {
      UNIVERSE_DATA.forEach((g) => {
        positions[g.id] = g.position;
      });
    } else if (level === 'galaxy' && selectedGalaxy) {
      positions[selectedGalaxy.id] = [0, 0, 0];
      selectedGalaxy.systems.forEach((s) => {
        positions[s.id] = s.position;
      });
    } else if (level === 'system' && selectedSystem) {
      positions[selectedSystem.id] = [0, 0, 0];
      selectedSystem.planets.forEach((p) => {
        const mesh = scene.getObjectByName(`system-node-${p.id}`);
        if (mesh) {
          positions[p.id] = [mesh.position.x, mesh.position.y, mesh.position.z];
        } else {
          // fallback static orbits
          const idx = selectedSystem.planets.findIndex(pl => pl.id === p.id);
          const angle = idx * Math.PI * 0.7;
          positions[p.id] = [
            Math.cos(angle) * p.orbitRadius,
            0,
            Math.sin(angle) * p.orbitRadius
          ];
        }
      });
    }

    // Auto-generate asteroids once when course is locked and asteroids are empty
    if (courseLocked && shortestPath.length >= 2 && asteroids.length === 0) {
      generateAsteroidsForPath(shortestPath, positions);
    }

    // 2. Advance flight simulation in store
    updateFlight(delta, positions);

    if (!rocketRef.current) return;

    // 3. Smoothly move rocket mesh and align nose with the direction of movement
    const currentPos = new THREE.Vector3().copy(rocketRef.current.position);
    const nextPos = new THREE.Vector3(...rocketPosition);

    if (isFlying && !isRefueling && currentPos.distanceTo(nextPos) > 0.005) {
      rocketRef.current.position.lerp(nextPos, 1 - Math.exp(-10 * delta));
      const moveDir = new THREE.Vector3().subVectors(nextPos, currentPos).normalize();
      const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), moveDir);
      rocketRef.current.quaternion.slerp(targetQuat, 1 - Math.exp(-11 * delta));
    } else {
      // Gentle floating/docked behavior
      rocketRef.current.position.lerp(nextPos, 1 - Math.exp(-8 * delta));
      const time = state.clock.getElapsedTime();
      const rotationY = time * 0.25;
      const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0));
      rocketRef.current.quaternion.slerp(targetQuat, 1 - Math.exp(-4 * delta));
      rocketRef.current.position.y += Math.sin(time * 2) * 0.001;
    }

    // 4. Engine flame pulse
    const time = state.clock.getElapsedTime();
    if (flameRef.current) {
      if (isFlying && !isRefueling) {
        const pulse = 1.0 + Math.sin(time * 35) * 0.35;
        flameRef.current.scale.set(pulse, pulse * 1.6, pulse);
        flameRef.current.visible = true;
      } else {
        flameRef.current.visible = false;
      }
    }

    // 5. Update trail particles behind engine
    if (particleRef.current) {
      const geo = particleRef.current.geometry;
      const attr = geo.attributes.position as THREE.BufferAttribute;
      
      particles.forEach((p, idx) => {
        if (isFlying && !isRefueling) {
          p.life -= delta * p.speed * 2.0;
          if (p.life <= 0) {
            p.life = 1.0;
            p.pos.copy(rocketRef.current!.position);
            const offset = new THREE.Vector3(0, -0.22 * scale, 0).applyQuaternion(rocketRef.current!.quaternion);
            p.pos.add(offset);
          } else {
            const driftDir = new THREE.Vector3(0, -0.6 * delta, 0).applyQuaternion(rocketRef.current!.quaternion);
            p.pos.add(driftDir);
            p.pos.x += (Math.random() - 0.5) * 0.04 * scale;
            p.pos.z += (Math.random() - 0.5) * 0.04 * scale;
          }
        } else {
          p.life = Math.max(p.life - delta * 2.5, 0);
        }

        posArray[idx * 3] = p.pos.x;
        posArray[idx * 3 + 1] = p.pos.y;
        posArray[idx * 3 + 2] = p.pos.z;
      });

      attr.array.set(posArray);
      attr.needsUpdate = true;
    }

    // Synchronous camera tracking to eliminate render jitter
    if (isFlying && !isRefueling && rocketRef.current) {
      const pCam = camera as THREE.PerspectiveCamera;
      const controls = (state as any).controls;

      const rocketWorldPos = new THREE.Vector3();
      rocketRef.current.getWorldPosition(rocketWorldPos);

      // If user is manually interacting, just keep OrbitControls centered on ship
      if (controls) {
        controls.target.copy(rocketWorldPos);
        if (!cinematicCamera) {
          controls.update();
        }
      }

      if (cinematicCamera) {
        const rocketWorldQuat = new THREE.Quaternion();
        rocketRef.current.getWorldQuaternion(rocketWorldQuat);

        // Dynamic zoom factor (zooms in as progress increases)
        const progress = rocketProgress || 0;
        const zoom = 1.3 - progress * 0.55; 

        // Slow dynamic camera sweep angle side-to-side
        const sweep = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;

        const localOffset = new THREE.Vector3();
        if (cameraMode === 'adas') {
          localOffset.set(sweep * 0.5, -1.3 * zoom, 0.45 * zoom);
        } else if (cameraMode === 'cockpit') {
          localOffset.set(0, 0.28, 0.08);
        } else if (cameraMode === 'overhead') {
          localOffset.set(0, 0.01, 2.5 * zoom);
        } else if (cameraMode === 'orbit') {
          const angle = state.clock.getElapsedTime() * 0.4;
          localOffset.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0.6);
        } else if (cameraMode === 'flyby') {
          if (shortestPath && shortestPath.length > 1) {
            const v = shortestPath[Math.min(currentSegmentIndex + 1, shortestPath.length - 1)];
            const pV = scene.getObjectByName(`system-node-${v}`)?.position || 
                        scene.getObjectByName(`galaxy-node-${v}`)?.position || [0,0,0];
            const vVec = new THREE.Vector3(...(pV as [number,number,number]));
            const camPos = vVec.clone().add(new THREE.Vector3(1.2, 0.8, 1.2));
            camera.position.lerp(camPos, 1 - Math.exp(-2.5 * delta));
            camera.lookAt(rocketWorldPos);
            if (controls) {
              controls.target.copy(rocketWorldPos);
              controls.update();
            }
          }
        } else {
          localOffset.set(sweep * 1.2, -1.8 * zoom, 0.9 * zoom);
        }

        if (cameraMode !== 'flyby') {
          localOffset.applyQuaternion(rocketWorldQuat);
          const targetCamPos = new THREE.Vector3().addVectors(rocketWorldPos, localOffset);

          // Smoothly lerp camera position
          camera.position.lerp(targetCamPos, 1 - Math.exp(-3.5 * delta));

          // Smoothly look at the rocket
          const targetLookVec = rocketWorldPos.clone();
          const currentLook = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
          currentLook.lerp(targetLookVec, 1 - Math.exp(-4.5 * delta));
          camera.lookAt(currentLook);
        }

        // Keep FOV normal
        if (pCam && pCam.isPerspectiveCamera) {
          pCam.fov = THREE.MathUtils.lerp(pCam.fov, cameraMode === 'adas' ? 70 : 60, 1 - Math.exp(-4 * delta));
          pCam.updateProjectionMatrix();
        }
      }
    }
  });

  if (!rocketPosition || !courseLocked) return null;

  const scale = level === 'universe' ? 1.6 : level === 'galaxy' ? 0.9 : 0.35;

  return (
    <group>
      {/* Ship Model Group */}
      <group 
        ref={rocketRef} 
        name="rocket-mesh"
        scale={[scale, scale, scale]}
        onClick={(e) => {
          e.stopPropagation();
          setShowDashboard(!showDashboard);
        }}
      >
        <SpacecraftModel
          isFlying={isFlying}
          isRefueling={isRefueling}
          asteroidAlert={asteroidAlert}
          engineFlameRef={flameRef}
          shieldActiveOverride={shieldActive}
          engineColorOverride={engineColor}
          gravityOverdrive={gravityOverdrive}
        />

        {/* Tesla ADAS Safety Radar Scanning Cone */}
        {isFlying && !isRefueling && (
          <mesh position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.22, 0.7, 16, 1, true]} />
            <meshBasicMaterial 
              color={asteroidAlert ? "#ef4444" : "#06b6d4"} 
              wireframe 
              transparent 
              opacity={0.25} 
            />
          </mesh>
        )}

        {/* Alert flag in 3D */}
        {asteroidAlert && (
          <Html position={[0, 0.85, 0]} center>
            <div className="bg-red-950/90 border border-red-500 text-red-400 font-mono text-[7px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse uppercase select-none pointer-events-none whitespace-nowrap">
              DETOUR ACTIVE: EVADING ASTEROID
            </div>
          </Html>
        )}

        {/* Floating Cockpit Command Dashboard Menu */}
        {showDashboard && (
          <Html position={[0, 0.45, 0]} center>
            <div className="bg-slate-950/90 backdrop-blur-xl border-2 border-cyan-400/50 p-4 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] flex flex-col gap-2.5 items-center min-w-[200px] pointer-events-auto select-none font-mono text-left">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest text-center w-full block">Starship command deck</span>
              
              <div className="w-full flex flex-col gap-1 bg-slate-900/50 border border-slate-850 rounded-lg p-2">
                <span className="text-[8px] text-slate-400 uppercase font-bold">Warp velocity factor</span>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={rocketSpeedFactor}
                  onChange={(e) => setRocketSpeedFactor(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded accent-cyan-500 cursor-pointer"
                />
                <span className="text-[9px] text-cyan-300 text-center font-bold">{(rocketSpeedFactor * 0.5).toFixed(2)} LY/s</span>
              </div>

              <div className="w-full flex justify-between items-center text-[9px] bg-slate-900/30 border border-slate-850 p-2 rounded-lg">
                <span className="text-slate-400">THRUSTER FUEL:</span>
                <span className={fuel < 30 ? 'text-red-400 animate-pulse font-bold' : 'text-emerald-400 font-bold'}>
                  {fuel.toFixed(0)}%
                </span>
              </div>

              <div className="flex gap-1.5 w-full">
                {isFlying ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stopFlight();
                    }}
                    className="w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[9px] uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                  >
                    Abort Flight
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startFlight();
                    }}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                  >
                    Launch Flight
                  </button>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDashboard(false);
                }}
                className="text-[8px] text-slate-500 hover:text-white uppercase transition-colors w-full text-center"
              >
                [ CLOSE COCKPIT ]
              </button>
            </div>
          </Html>
        )}
      </group>

      {/* Render the 3D Asteroids floating along course */}
      {asteroids.map((ast) => (
        <group key={ast.id} position={ast.position}>
          <mesh 
            geometry={asteroidGeo} 
            material={asteroidMat} 
            scale={[ast.radius, ast.radius, ast.radius]}
          />
        </group>
      ))}

      {/* Thruster Trail Particles */}
      <points ref={particleRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[posArray, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={level === 'universe' ? 0.14 : level === 'galaxy' ? 0.08 : 0.035}
          color="#f97316"
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}
