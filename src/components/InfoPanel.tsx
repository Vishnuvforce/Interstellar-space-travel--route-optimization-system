import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Thermometer, Weight, Calendar, Moon, Star, Atom, Bookmark, BookmarkCheck } from 'lucide-react';
import { useUniverseStore } from '../store/universeStore';
import { useAuthStore } from '../store/authStore';
import { createBookmark, fetchBookmarks, deleteBookmark } from '../lib/api';
import { useState, useEffect } from 'react';

export default function InfoPanel() {
  const { level, selectedGalaxy, selectedSystem, selectedPlanet } = useUniverseStore();
  const { user } = useAuthStore();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  // Check if current item is bookmarked
  useEffect(() => {
    const checkBookmark = async () => {
      if (!user) {
        setIsBookmarked(false);
        return;
      }

      const currentId = level === 'planet' ? selectedPlanet?.id
        : level === 'system' ? selectedSystem?.id
        : level === 'galaxy' ? selectedGalaxy?.id
        : null;

      if (!currentId) {
        setIsBookmarked(false);
        return;
      }

      try {
        const bookmarks = await fetchBookmarks(user.id);
        const existing = bookmarks.find(b => b.item_id === currentId);
        setIsBookmarked(!!existing);
        setBookmarkId(existing?.id || null);
      } catch {
        setIsBookmarked(false);
      }
    };
    checkBookmark();
  }, [user, level, selectedGalaxy?.id, selectedSystem?.id, selectedPlanet?.id]);

  const handleBookmark = async () => {
    if (!user) return;

    const itemType = level as 'galaxy' | 'system' | 'planet';
    const itemId = level === 'planet' ? selectedPlanet?.id
      : level === 'system' ? selectedSystem?.id
      : level === 'galaxy' ? selectedGalaxy?.id
      : null;

    if (!itemId) return;

    if (isBookmarked && bookmarkId) {
      await deleteBookmark(bookmarkId);
      setIsBookmarked(false);
      setBookmarkId(null);
    } else {
      const bm = await createBookmark(user.id, itemType, itemId);
      setBookmarkId(bm.id);
      setIsBookmarked(true);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {level === 'planet' && selectedPlanet && (
        <motion.div
          key="planet-panel"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-6 right-6 z-50 w-80"
        >
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            {/* Planet header */}
            <div
              className="h-24 relative flex items-end p-4"
              style={{ background: `linear-gradient(135deg, ${selectedPlanet.color}33, ${selectedPlanet.atmosphereColor}22)` }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: `radial-gradient(circle at 30% 50%, ${selectedPlanet.atmosphereColor}, transparent 70%)` }}
              />
              <div className="relative flex-1">
                <div className="text-xs text-white/50 uppercase tracking-widest mb-1">
                  {selectedPlanet.type.replace('_', ' ')} World
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedPlanet.name}</h2>
              </div>
              {user && (
                <button
                  onClick={handleBookmark}
                  className="relative z-10 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <Bookmark className="w-5 h-5 text-white/60" />
                  )}
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-white/70 leading-relaxed">{selectedPlanet.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer size={12} className="text-orange-400" />
                    <span className="text-xs text-white/50">Temperature</span>
                  </div>
                  <div className="text-sm font-medium text-white">{selectedPlanet.temperature}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Weight size={12} className="text-blue-400" />
                    <span className="text-xs text-white/50">Mass</span>
                  </div>
                  <div className="text-sm font-medium text-white">{selectedPlanet.mass}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Moon size={12} className="text-gray-300" />
                    <span className="text-xs text-white/50">Moons</span>
                  </div>
                  <div className="text-sm font-medium text-white">{selectedPlanet.moons.length}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={12} className="text-green-400" />
                    <span className="text-xs text-white/50">Discovered</span>
                  </div>
                  <div className="text-sm font-medium text-white">{selectedPlanet.discovered}</div>
                </div>
              </div>

              {selectedPlanet.moons.length > 0 && (
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Known Moons</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlanet.moons.map((moon) => (
                      <span key={moon.id} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/70">
                        {moon.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {level === 'system' && selectedSystem && (
        <motion.div
          key="system-panel"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-6 right-6 z-50 w-72"
        >
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Star System</div>
                <h2 className="text-xl font-bold text-white">{selectedSystem.name}</h2>
              </div>
              {user && (
                <button
                  onClick={handleBookmark}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-white/60" />
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <Star size={12} className="text-yellow-400" />
                <span className="text-xs text-white/70">Type {selectedSystem.starType}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <Globe size={12} className="text-blue-400" />
                <span className="text-xs text-white/70">{selectedSystem.planets.length} planets</span>
              </div>
            </div>

            <p className="text-sm text-white/60 leading-relaxed">{selectedSystem.description}</p>

            <div>
              <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Planets</div>
              <div className="space-y-2">
                {selectedSystem.planets.map((planet) => (
                  <div key={planet.id} className="flex items-center gap-3 group">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: planet.color }}
                    />
                    <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                      {planet.name}
                    </span>
                    <span className="text-xs text-white/30 ml-auto">
                      {planet.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {level === 'galaxy' && selectedGalaxy && (
        <motion.div
          key="galaxy-panel"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-6 right-6 z-50 w-72"
        >
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Galaxy</div>
                <h2 className="text-xl font-bold text-white">{selectedGalaxy.name}</h2>
              </div>
              {user && (
                <button
                  onClick={handleBookmark}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-white/60" />
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <Atom size={12} className="text-cyan-400" />
                <span className="text-xs text-white/70">{selectedGalaxy.type.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <Star size={12} className="text-yellow-400" />
                <span className="text-xs text-white/70">{selectedGalaxy.systems.length} systems</span>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">{selectedGalaxy.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-white/40 mb-1">Distance</div>
                <div className="text-sm font-medium text-white">{selectedGalaxy.distance}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-white/40 mb-1">Stars</div>
                <div className="text-sm font-medium text-white">{selectedGalaxy.starCount}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
