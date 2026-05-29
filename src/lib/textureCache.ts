import * as THREE from 'three';

let sharedCircleTexture: THREE.CanvasTexture | null = null;

export function getSharedCircleTexture(): THREE.CanvasTexture {
  if (!sharedCircleTexture) {
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
    sharedCircleTexture = new THREE.CanvasTexture(canvas);
  }
  return sharedCircleTexture;
}
