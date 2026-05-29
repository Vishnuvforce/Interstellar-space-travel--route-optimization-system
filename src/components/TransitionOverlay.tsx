import { motion, AnimatePresence } from 'framer-motion';
import { useUniverseStore } from '../store/universeStore';

export default function TransitionOverlay() {
  const { isTransitioning, warpEffect, level, selectedGalaxy, selectedSystem, selectedPlanet } = useUniverseStore();

  const getMessage = () => {
    if (warpEffect) return 'Initiating Warp Drive...';
    if (level === 'galaxy' && selectedGalaxy) return `Entering ${selectedGalaxy.name}`;
    if (level === 'system' && selectedSystem) return `Approaching ${selectedSystem.name}`;
    if (level === 'planet' && selectedPlanet) return `Entering orbit of ${selectedPlanet.name}`;
    return 'Navigating...';
  };

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center"
        >
          {/* Warp vignette */}
          <div className="absolute inset-0"
            style={{
              background: warpEffect
                ? 'radial-gradient(ellipse at center, transparent 20%, rgba(0,20,60,0.7) 100%)'
                : 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
            }}
          />

          {/* Scan lines */}
          {warpEffect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(100,180,255,0.03) 2px, rgba(100,180,255,0.03) 4px)',
              }}
            />
          )}

          {/* Status message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative flex flex-col items-center gap-4"
          >
            {/* Loading ring */}
            <div className="relative w-12 h-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 border-r-blue-400/50"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-1 rounded-full border border-transparent border-t-cyan-400/60"
              />
              <div className="absolute inset-3 rounded-full bg-blue-400/10" />
            </div>

            <div className="text-center">
              <div className="text-sm font-medium text-white/90 tracking-widest uppercase">
                {getMessage()}
              </div>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs text-blue-400/70 mt-1 tracking-wider"
              >
                {warpEffect ? 'Engaging FTL propulsion' : 'Computing trajectory'}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
