import { motion, AnimatePresence } from 'framer-motion';
import { Telescope, Navigation, Compass, Layers } from 'lucide-react';
import { useUniverseStore } from '../store/universeStore';

const LEVEL_LABELS: Record<string, { title: string; subtitle: string }> = {
  universe: { title: 'Observable Universe', subtitle: 'Select a galaxy to explore' },
  galaxy: { title: 'Galaxy View', subtitle: 'Select a star system to enter' },
  system: { title: 'Star System', subtitle: 'Select a planet to approach' },
  planet: { title: 'Planetary Orbit', subtitle: 'In orbit — examining surface details' },
};

export default function HUD() {
  const { level } = useUniverseStore();
  const info = LEVEL_LABELS[level];

  return (
    <>
      {/* Bottom left — coordinates / level info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Telescope size={14} className="text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-white/40 uppercase tracking-wider">Current View</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={level}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm font-semibold text-white"
                >
                  {info.title}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={level + '-sub'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-white/40 leading-relaxed max-w-48"
            >
              {info.subtitle}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bottom right — depth indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={12} className="text-white/40" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Depth Level</span>
          </div>
          <div className="flex gap-1.5">
            {['universe', 'galaxy', 'system', 'planet'].map((l) => (
              <div
                key={l}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  l === level
                    ? 'w-8 bg-blue-400'
                    : ['universe', 'galaxy', 'system', 'planet'].indexOf(l) <
                      ['universe', 'galaxy', 'system', 'planet'].indexOf(level)
                    ? 'w-3 bg-blue-600/60'
                    : 'w-3 bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <Navigation size={10} className="text-white/30" />
            <span className="text-xs text-white/30 capitalize">{level}</span>
          </div>
        </div>
      </motion.div>

      {/* Top center — compass/title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-5 py-2">
          <Compass size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-white/80 tracking-widest uppercase">
            Stellar Navigator
          </span>
        </div>
      </motion.div>
    </>
  );
}
