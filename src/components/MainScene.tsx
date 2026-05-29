import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { OrbitControls } from '@react-three/drei';
import CameraController from './CameraController';
import UniverseScene from './UniverseScene';
import GalaxyScene from './GalaxyScene';
import SystemScene from './SystemScene';
import PlanetScene from './PlanetScene';
import { useUniverseStore } from '../store/universeStore';

function SceneContent() {
  const { level, isTransitioning } = useUniverseStore();

  return (
    <>
      <CameraController />

      {/* OrbitControls enables manual pan, zoom, and orbit when not flying through space */}
      {!isTransitioning && (
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={1.5}
          maxDistance={
            level === 'universe' ? 120 :
            level === 'galaxy' ? 80 :
            level === 'system' ? 50 : 25
          }
          makeDefault
        />
      )}

      {/* 
        We keep components mounted when they are the active level, 
        or when transitioning to/from them to allow visual continuity 
      */}
      {(level === 'universe' || (isTransitioning && level === 'galaxy')) && <UniverseScene />}
      {(level === 'galaxy' || (isTransitioning && (level === 'system' || level === 'universe'))) && <GalaxyScene />}
      {(level === 'system' || (isTransitioning && (level === 'planet' || level === 'galaxy'))) && <SystemScene />}
      {(level === 'planet' || (isTransitioning && level === 'system')) && <PlanetScene />}

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={level === 'universe' ? 1.2 : level === 'planet' ? 0.6 : 0.9}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.8}
          mipmapBlur={false}
        />
        <Vignette offset={0.3} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

export default function MainScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 8, 22], fov: 60, near: 0.01, far: 2000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: '#000308' }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
