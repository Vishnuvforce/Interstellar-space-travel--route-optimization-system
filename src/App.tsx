import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MainScene from './components/MainScene';
import TransitionOverlay from './components/TransitionOverlay';
import UserMenu from './components/UserMenu';
import MissionControl from './components/MissionControl';
import NavigationDeck from './components/NavigationDeck';
import SelectedRouteBar from './components/SelectedRouteBar';
import AlgorithmDetailsModal from './components/AlgorithmDetailsModal';
import LoadingScreen from './components/LoadingScreen';
import RocketTelemetry from './components/RocketTelemetry';
import { useAuthStore } from './store/authStore';
import { useAlgorithmStore } from './store/algorithmStore';
import { useUniverseStore } from './store/universeStore';
import { Compass, Bell, Search } from 'lucide-react';
import { UNIVERSE_DATA } from './data/universeData';

export default function App() {
  const { initialize } = useAuthStore();
  const { selectedAlgorithm } = useAlgorithmStore();
  const { level, selectGalaxy, selectSystem, selectPlanet } = useUniverseStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNavUI, setShowNavUI] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sequential level backward transition trigger
  const handleTabClick = (targetLevel: string) => {
    const levels = ['universe', 'galaxy', 'system', 'planet'];
    const currentIdx = levels.indexOf(level);
    const targetIdx = levels.indexOf(targetLevel);
    if (targetIdx < currentIdx) {
      const steps = currentIdx - targetIdx;
      for (let i = 0; i < steps; i++) {
        setTimeout(() => {
          useUniverseStore.getState().goBack();
        }, i * 350);
      }
    }
  };

  // Coordinates and system search finder
  const handleSearchSelect = (item: any) => {
    setSearchQuery('');
    setShowSearchResults(false);
    if (item.type === 'galaxy') {
      selectGalaxy(item.ref);
    } else if (item.type === 'system') {
      // Find parent galaxy
      const parentGal = UNIVERSE_DATA.find(g => g.systems.some(s => s.id === item.ref.id));
      if (parentGal) {
        useUniverseStore.setState({ selectedGalaxy: parentGal });
      }
      selectSystem(item.ref);
    } else if (item.type === 'planet') {
      // Find system
      const parentGal = UNIVERSE_DATA.find(g => g.systems.some(s => s.planets.some(p => p.id === item.ref.id)));
      const parentSys = parentGal?.systems.find(s => s.planets.some(p => p.id === item.ref.id));
      if (parentGal && parentSys) {
        useUniverseStore.setState({ selectedGalaxy: parentGal, selectedSystem: parentSys });
      }
      selectPlanet(item.ref);
    }
  };

  // Get search list
  const getSearchList = () => {
    const list: { name: string; type: string; ref: any }[] = [];
    UNIVERSE_DATA.forEach(g => {
      list.push({ name: g.name, type: 'galaxy', ref: g });
      g.systems.forEach(s => {
        list.push({ name: s.name, type: 'system', ref: s });
        s.planets.forEach(p => {
          list.push({ name: p.name, type: 'planet', ref: p });
        });
      });
    });
    return list.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
  };

  const filteredSearchList = searchQuery ? getSearchList() : [];

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#000308] relative select-none">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" onComplete={() => setIsLoading(false)} />
        ) : (
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full relative"
          >
            {/* 3D background view */}
            <MainScene />

            {/* Top Cockpit Header Bar */}
            <motion.div
              key="top-bar"
              initial={{ opacity: 0, y: -80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="fixed top-0 left-0 right-0 h-16 bg-slate-950/70 backdrop-blur-md border-b border-cyan-500/20 px-6 flex items-center justify-between z-30 pointer-events-auto"
            >
              {/* Left Side Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                  <Compass className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-xs font-black text-white uppercase tracking-widest font-mono">Stellar Navigator</h1>
                  <p className="text-[8px] text-cyan-400 font-mono tracking-wider">NAV SYSTEM v4.9.1</p>
                </div>
              </div>

              {/* Center Navigation scale Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-900/30 border border-slate-800 rounded-full p-1">
                {['universe', 'galaxy', 'system', 'planet'].map((l) => {
                  const levels = ['universe', 'galaxy', 'system', 'planet'];
                  const activeIdx = levels.indexOf(level);
                  const thisIdx = levels.indexOf(l);
                  const isActive = l === level;
                  const isClickable = thisIdx < activeIdx;

                  return (
                    <button
                      key={l}
                      disabled={!isClickable && !isActive}
                      onClick={() => handleTabClick(l)}
                      className={`px-4 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-widest transition-all duration-300 ${
                        isActive 
                          ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]' 
                          : isClickable 
                          ? 'text-slate-400 hover:text-white cursor-pointer' 
                          : 'text-slate-650 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>

              {/* Right Search & User controls */}
              <div className="flex items-center gap-4">
                {/* Coordinates Search Input */}
                <div className="relative">
                  <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1.5 w-44">
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => setShowSearchResults(true)}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Coordinates..."
                      className="bg-transparent border-none text-[10px] text-white focus:outline-none placeholder-slate-500 font-mono w-full"
                    />
                  </div>

                  {/* Dropdown list results */}
                  {showSearchResults && filteredSearchList.length > 0 && (
                    <div className="absolute top-10 right-0 w-52 bg-slate-950/95 border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl z-45 font-mono text-[9px]">
                      {filteredSearchList.map(item => (
                        <div
                          key={item.name}
                          onClick={() => handleSearchSelect(item)}
                          className="p-2 border-b border-white/5 hover:bg-cyan-950/20 hover:text-cyan-300 cursor-pointer text-slate-350 flex justify-between uppercase"
                        >
                          <span>{item.name}</span>
                          <span className="text-[7px] text-slate-500 font-bold">{item.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="p-2 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
                  <Bell className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1.5 pl-2 border-l border-white/5">
                  <UserMenu />
                </div>
              </div>
            </motion.div>

            {/* Left Sidebar (Ada Algorithm Controls Toggleable Panel) */}
            <AnimatePresence>
              {showNavUI && (
                <motion.div
                  key="left-sidebar"
                  initial={{ opacity: 0, x: -340 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -340 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="fixed left-4 top-20 bottom-28 w-80 z-30 pointer-events-none"
                >
                  <MissionControl onOpenTheory={() => setIsTheoryOpen(true)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right Sidebar (Navigation Deck Info) - Always Visible */}
            <motion.div
              key="right-sidebar"
              initial={{ opacity: 0, x: 340 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="fixed right-4 top-20 bottom-28 w-80 z-30 pointer-events-none"
            >
              <NavigationDeck />
            </motion.div>

            {/* Bottom Bar (Selected Route Timeline) - Always Visible */}
            <motion.div
              key="bottom-bar"
              initial={{ opacity: 0, y: 160 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="fixed bottom-4 left-24 right-4 h-24 z-30 pointer-events-none"
            >
              <SelectedRouteBar />
            </motion.div>

            {/* Circular Navigation Toggle Button (Map Navigation Style) */}
            <button
              onClick={() => setShowNavUI(!showNavUI)}
              className={`fixed bottom-8 left-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer z-50 transition-all duration-300 hover:scale-105 active:scale-95 pointer-events-auto border-2 ${
                showNavUI 
                  ? 'bg-red-950/90 border-red-500/80 text-red-400 hover:bg-red-500 hover:text-white shadow-red-950/40' 
                  : 'bg-slate-950/90 border-cyan-400/80 text-cyan-400 hover:bg-cyan-500 hover:text-black shadow-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              }`}
              title={showNavUI ? "Hide ADA Mission Control Panel" : "Show ADA Mission Control Panel"}
            >
              {showNavUI ? (
                <motion.span 
                  initial={{ rotate: -90 }} 
                  animate={{ rotate: 0 }} 
                  className="text-lg font-black font-mono leading-none"
                >
                  ✕
                </motion.span>
              ) : (
                <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
              )}
            </button>

            <AnimatePresence>
              {isTheoryOpen && (
                <AlgorithmDetailsModal 
                  algorithmId={selectedAlgorithm} 
                  onClose={() => setIsTheoryOpen(false)} 
                />
              )}
            </AnimatePresence>

            <RocketTelemetry />
            <TransitionOverlay />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
