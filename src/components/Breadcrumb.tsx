import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useUniverseStore } from '../store/universeStore';

export default function Breadcrumb() {
  const { breadcrumbs, goBack, level, isTransitioning } = useUniverseStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-6 left-6 z-50 flex items-center gap-2"
    >
      {level !== 'universe' && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => !isTransitioning && goBack()}
          disabled={isTransitioning}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-200 mr-1"
        >
          <ArrowLeft size={16} />
        </motion.button>
      )}

      <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
        <AnimatePresence mode="popLayout">
          {breadcrumbs.map((crumb, i) => (
            <motion.div
              key={crumb.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center gap-1"
            >
              {i > 0 && <ChevronRight size={12} className="text-white/30" />}
              <span
                className={`text-xs font-medium tracking-wide ${
                  i === breadcrumbs.length - 1
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80 cursor-pointer transition-colors'
                }`}
              >
                {crumb.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
