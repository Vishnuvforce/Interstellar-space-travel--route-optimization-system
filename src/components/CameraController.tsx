import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore } from '../store/algorithmStore';

const LEVEL_CONFIGS = {
  universe: { pos: new THREE.Vector3(0, 8, 22), target: new THREE.Vector3(0, 0, 0) },
  galaxy: { pos: new THREE.Vector3(0, 5, 12), target: new THREE.Vector3(0, 0, 0) },
  system: { pos: new THREE.Vector3(0, 14, 0), target: new THREE.Vector3(0, 0, 0) },
  planet: { pos: new THREE.Vector3(0, 4, 10), target: new THREE.Vector3(0, 0, 0) },
};

export default function CameraController() {
  const { camera, scene } = useThree();
  const { level, isTransitioning, warpEffect, selectedGalaxy, selectedSystem, selectedPlanet } = useUniverseStore();
  const { isFlying } = useAlgorithmStore();
  const targetPos = useRef(new THREE.Vector3(0, 8, 22));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const idleTimer = useRef(0);

  useEffect(() => {
    const cfg = LEVEL_CONFIGS[level];
    targetPos.current.copy(cfg.pos);
    targetLook.current.copy(cfg.target);
  }, [level]);

  // Disable cinematic tracking when user interacts manually with OrbitControls
  useEffect(() => {
    const handleManualControl = () => {
      const state = useAlgorithmStore.getState();
      if (state.isFlying && state.cinematicCamera) {
        useAlgorithmStore.setState({ cinematicCamera: false });
      }
    };
    window.addEventListener('pointerdown', handleManualControl);
    window.addEventListener('wheel', handleManualControl, { passive: true });
    window.addEventListener('touchstart', handleManualControl, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleManualControl);
      window.removeEventListener('wheel', handleManualControl);
      window.removeEventListener('touchstart', handleManualControl);
    };
  }, []);

  useFrame((state, delta) => {
    idleTimer.current += delta;
    const pCam = camera as THREE.PerspectiveCamera;
    const controls = (state as any).controls;

    if (isFlying) {
      return;
    }

    if (isTransitioning) {
      if (warpEffect && selectedGalaxy) {
        // Warp zoom towards selected galaxy
        const galPos = new THREE.Vector3(...selectedGalaxy.position);
        targetLook.current.copy(galPos);
        targetPos.current.copy(galPos).add(new THREE.Vector3(0, 1, 2.5));
        
        // Stretch FOV for warp effect
        if (pCam.isPerspectiveCamera) {
          pCam.fov = THREE.MathUtils.lerp(pCam.fov, 105, 1 - Math.exp(-3.5 * delta));
          pCam.updateProjectionMatrix();
        }
      } else if (selectedSystem && level === 'galaxy') {
        // Transitioning from galaxy to system - zoom in on system's rotated world position
        const sysNode = scene.getObjectByName(`galaxy-node-${selectedSystem.id}`);
        if (sysNode) {
          const worldPos = new THREE.Vector3();
          sysNode.getWorldPosition(worldPos);
          targetLook.current.copy(worldPos);
          targetPos.current.copy(worldPos).add(new THREE.Vector3(0, 0.5, 1.3));
        } else {
          const fallbackPos = new THREE.Vector3(...selectedSystem.position);
          targetLook.current.copy(fallbackPos);
          targetPos.current.copy(fallbackPos).add(new THREE.Vector3(0, 0.5, 1.3));
        }
        
        if (pCam.isPerspectiveCamera) {
          pCam.fov = THREE.MathUtils.lerp(pCam.fov, 85, 1 - Math.exp(-4 * delta));
          pCam.updateProjectionMatrix();
        }
      } else if (selectedPlanet && level === 'system') {
        // Transitioning from system to planet - zoom in on planet's dynamic world position
        const planetNode = scene.getObjectByName(`system-node-${selectedPlanet.id}`);
        if (planetNode) {
          const worldPos = new THREE.Vector3();
          planetNode.getWorldPosition(worldPos);
          targetLook.current.copy(worldPos);
          targetPos.current.copy(worldPos).add(new THREE.Vector3(0, selectedPlanet.radius * 0.45, selectedPlanet.radius * 1.1));
        }
        
        if (pCam.isPerspectiveCamera) {
          pCam.fov = THREE.MathUtils.lerp(pCam.fov, 85, 1 - Math.exp(-4 * delta));
          pCam.updateProjectionMatrix();
        }
      }

      // Fast, fluid approach zoom lerp
      camera.position.lerp(targetPos.current, 1 - Math.exp(-3.5 * delta));
      
      // Look at target smoothly
      const currentLook = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
      currentLook.lerp(targetLook.current, 1 - Math.exp(-4 * delta));
      camera.lookAt(currentLook);
      return;
    }

    // Restore normal FOV smoothly
    if (pCam.isPerspectiveCamera) {
      pCam.fov = THREE.MathUtils.lerp(pCam.fov, 60, 1 - Math.exp(-4 * delta));
      pCam.updateProjectionMatrix();
    }

    // Sync OrbitControls target on level transitions completion
    if (controls) {
      const cfg = LEVEL_CONFIGS[level];
      if (controls.target.distanceTo(cfg.target) > 0.1 && !isTransitioning) {
        controls.target.lerp(cfg.target, 1 - Math.exp(-2.0 * delta));
        controls.update();
      }
    }
  });

  return null;
}
