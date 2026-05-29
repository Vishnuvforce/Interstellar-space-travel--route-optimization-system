import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, LogOut, Bookmark, Compass, Database } from 'lucide-react';
import Auth from './Auth';
import Bookmarks from './Bookmarks';
import AdminPanel from './AdminPanel';

export default function UserMenu() {
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const { user, profile, signOut } = useAuthStore();

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuth(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 transition-all"
        >
          <User className="w-4 h-4" />
          <span>Sign In</span>
        </button>
        {showAuth && <Auth onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg text-white transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm">{profile?.username || 'Explorer'}</span>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-700">
                <div className="text-sm text-white font-medium">{profile?.username || 'Explorer'}</div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowBookmarks(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                  Bookmarks
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Compass className="w-4 h-4" />
                  My Sessions
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowAdmin(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Admin
                </button>
              </div>
              <div className="p-2 border-t border-slate-700">
                <button
                  onClick={async () => {
                    setShowMenu(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
      {showBookmarks && <Bookmarks onClose={() => setShowBookmarks(false)} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );
}
