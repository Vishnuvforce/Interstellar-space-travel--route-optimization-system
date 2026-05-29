import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { fetchBookmarks, deleteBookmark, fetchGalaxy, fetchStarSystem, fetchPlanet } from '../lib/api';
import { X, Trash2, Sparkles, Star, Globe } from 'lucide-react';
import { useUniverseStore } from '../store/universeStore';

interface BookmarkItem {
  id: string;
  item_type: 'galaxy' | 'system' | 'planet';
  item_id: string;
  notes: string;
  created_at: string;
}

interface BookmarkDetail {
  id: string;
  name: string;
  type: 'galaxy' | 'system' | 'planet';
}

export default function Bookmarks({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const { navigateToGalaxy, navigateToSystem, navigateToPlanet } = useUniverseStore();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [details, setDetails] = useState<Record<string, BookmarkDetail>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;
    try {
      const data = await fetchBookmarks(user.id);
      setBookmarks(data);
      // Load details for each bookmark
      const detailMap: Record<string, BookmarkDetail> = {};
      for (const b of data) {
        try {
          if (b.item_type === 'galaxy') {
            const g = await fetchGalaxy(b.item_id);
            if (g) detailMap[b.id] = { id: g.id, name: g.name, type: 'galaxy' };
          } else if (b.item_type === 'system') {
            const s = await fetchStarSystem(b.item_id);
            if (s) detailMap[b.id] = { id: s.id, name: s.name, type: 'system' };
          } else if (b.item_type === 'planet') {
            const p = await fetchPlanet(b.item_id);
            if (p) detailMap[b.id] = { id: p.id, name: p.name, type: 'planet' };
          }
        } catch {}
      }
      setDetails(detailMap);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBookmark(id);
      setBookmarks(bookmarks.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to delete bookmark', err);
    }
  };

  const handleNavigate = async (bookmark: BookmarkItem) => {
    try {
      if (bookmark.item_type === 'galaxy') {
        const g = await fetchGalaxy(bookmark.item_id);
        if (g) {
          navigateToGalaxy(g);
        }
      } else if (bookmark.item_type === 'system') {
        const s = await fetchStarSystem(bookmark.item_id);
        if (s) {
          navigateToSystem(s);
        }
      } else if (bookmark.item_type === 'planet') {
        const p = await fetchPlanet(bookmark.item_id);
        if (p) {
          navigateToPlanet(p);
        }
      }
      onClose();
    } catch (err) {
      console.error('Failed to navigate', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'galaxy':
        return <Sparkles className="w-5 h-5 text-blue-400" />;
      case 'system':
        return <Star className="w-5 h-5 text-yellow-400" />;
      case 'planet':
        return <Globe className="w-5 h-5 text-cyan-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Your Bookmarks</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading bookmarks...</div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p>No bookmarks yet</p>
              <p className="text-sm mt-2">Bookmark galaxies, star systems, or planets to save them here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
                >
                  <div className="flex-shrink-0">{getIcon(b.item_type)}</div>
                  <button
                    onClick={() => handleNavigate(b)}
                    className="flex-1 text-left hover:text-blue-400 transition-colors"
                  >
                    <div className="text-white font-medium">{details[b.id]?.name || 'Loading...'}</div>
                    <div className="text-sm text-slate-400 capitalize">{b.item_type}</div>
                    {b.notes && <div className="text-xs text-slate-500 mt-1">{b.notes}</div>}
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
