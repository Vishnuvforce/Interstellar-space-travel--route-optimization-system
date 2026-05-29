import { useState, useEffect } from 'react';
import { X, Database, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState({
    galaxies: 0,
    systems: 0,
    planets: 0,
    moons: 0,
    bookmarks: 0,
    sessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    setRefreshing(true);
    try {
      const [g, s, p, m, b, sess] = await Promise.all([
        supabase.from('galaxies').select('id', { count: 'exact', head: true }),
        supabase.from('star_systems').select('id', { count: 'exact', head: true }),
        supabase.from('planets').select('id', { count: 'exact', head: true }),
        supabase.from('moons').select('id', { count: 'exact', head: true }),
        supabase.from('user_bookmarks').select('id', { count: 'exact', head: true }),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        galaxies: g.count || 0,
        systems: s.count || 0,
        planets: p.count || 0,
        moons: m.count || 0,
        bookmarks: b.count || 0,
        sessions: sess.count || 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Admin Dashboard</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading statistics...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">{stats.galaxies}</div>
                  <div className="text-sm text-slate-400 mt-1">Galaxies</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">{stats.systems}</div>
                  <div className="text-sm text-slate-400 mt-1">Star Systems</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-cyan-400">{stats.planets}</div>
                  <div className="text-sm text-slate-400 mt-1">Planets</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-gray-400">{stats.moons}</div>
                  <div className="text-sm text-slate-400 mt-1">Moons</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{stats.bookmarks}</div>
                  <div className="text-sm text-slate-400 mt-1">User Bookmarks</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-orange-400">{stats.sessions}</div>
                  <div className="text-sm text-slate-400 mt-1">Sessions</div>
                </div>
              </div>

              <button
                onClick={loadStats}
                disabled={refreshing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Statistics
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-center text-xs text-slate-500">
          Database connected via Supabase
        </div>
      </div>
    </div>
  );
}
