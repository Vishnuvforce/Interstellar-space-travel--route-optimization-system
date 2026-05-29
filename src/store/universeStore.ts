import { create } from 'zustand';
import { ExplorationLevel, Galaxy, StarSystem, Planet } from '../types/universe';

interface NavigationEntry {
  level: ExplorationLevel;
  label: string;
}

interface UniverseState {
  level: ExplorationLevel;
  selectedGalaxy: Galaxy | null;
  selectedSystem: StarSystem | null;
  selectedPlanet: Planet | null;
  isTransitioning: boolean;
  transitionPhase: number;
  breadcrumbs: NavigationEntry[];
  hoveredId: string | null;
  cameraTarget: [number, number, number];
  warpEffect: boolean;

  setLevel: (level: ExplorationLevel) => void;
  selectGalaxy: (galaxy: Galaxy) => void;
  selectSystem: (system: StarSystem) => void;
  selectPlanet: (planet: Planet) => void;
  goBack: () => void;
  setHovered: (id: string | null) => void;
  setTransitioning: (v: boolean) => void;
  setTransitionPhase: (v: number) => void;
  setWarpEffect: (v: boolean) => void;
  navigateToGalaxy: (galaxy: Galaxy) => void;
  navigateToSystem: (system: StarSystem) => void;
  navigateToPlanet: (planet: Planet) => void;
}

export const useUniverseStore = create<UniverseState>((set, get) => ({
  level: 'universe',
  selectedGalaxy: null,
  selectedSystem: null,
  selectedPlanet: null,
  isTransitioning: false,
  transitionPhase: 0,
  breadcrumbs: [{ level: 'universe', label: 'Universe' }],
  hoveredId: null,
  cameraTarget: [0, 0, 20],
  warpEffect: false,

  setLevel: (level) => set({ level }),

  selectGalaxy: (galaxy) => {
    set({
      selectedGalaxy: galaxy,
      selectedSystem: null,
      selectedPlanet: null,
      isTransitioning: true,
      warpEffect: true,
      breadcrumbs: [
        { level: 'universe', label: 'Universe' },
        { level: 'galaxy', label: galaxy.name },
      ],
    });
    setTimeout(() => set({ isTransitioning: false, level: 'galaxy', warpEffect: false }), 2800);
  },

  selectSystem: (system) => {
    set({
      selectedSystem: system,
      selectedPlanet: null,
      isTransitioning: true,
      breadcrumbs: [
        { level: 'universe', label: 'Universe' },
        { level: 'galaxy', label: get().selectedGalaxy?.name || 'Galaxy' },
        { level: 'system', label: system.name },
      ],
    });
    setTimeout(() => set({ isTransitioning: false, level: 'system' }), 2000);
  },

  selectPlanet: (planet) => {
    set({
      selectedPlanet: planet,
      isTransitioning: true,
      breadcrumbs: [
        { level: 'universe', label: 'Universe' },
        { level: 'galaxy', label: get().selectedGalaxy?.name || 'Galaxy' },
        { level: 'system', label: get().selectedSystem?.name || 'System' },
        { level: 'planet', label: planet.name },
      ],
    });
    setTimeout(() => set({ isTransitioning: false, level: 'planet' }), 1800);
  },

  goBack: () => {
    const { level } = get();
    if (level === 'planet') {
      set({
        level: 'system',
        selectedPlanet: null,
        isTransitioning: true,
        breadcrumbs: get().breadcrumbs.slice(0, -1),
      });
      setTimeout(() => set({ isTransitioning: false }), 1200);
    } else if (level === 'system') {
      set({
        level: 'galaxy',
        selectedSystem: null,
        isTransitioning: true,
        breadcrumbs: get().breadcrumbs.slice(0, -1),
      });
      setTimeout(() => set({ isTransitioning: false }), 1200);
    } else if (level === 'galaxy') {
      set({
        level: 'universe',
        selectedGalaxy: null,
        isTransitioning: true,
        warpEffect: true,
        breadcrumbs: [{ level: 'universe', label: 'Universe' }],
      });
      setTimeout(() => set({ isTransitioning: false, warpEffect: false }), 2000);
    }
  },

  setHovered: (id) => set({ hoveredId: id }),
  setTransitioning: (v) => set({ isTransitioning: v }),
  setTransitionPhase: (v) => set({ transitionPhase: v }),
  setWarpEffect: (v) => set({ warpEffect: v }),

  // Navigation helpers for bookmarks
  navigateToGalaxy: (galaxy) => {
    set({
      selectedGalaxy: galaxy,
      selectedSystem: null,
      selectedPlanet: null,
      isTransitioning: true,
      warpEffect: true,
      breadcrumbs: [
        { level: 'universe', label: 'Universe' },
        { level: 'galaxy', label: galaxy.name },
      ],
    });
    setTimeout(() => set({ isTransitioning: false, level: 'galaxy', warpEffect: false }), 2800);
  },

  navigateToSystem: async (system) => {
    set({
      selectedSystem: system,
      selectedPlanet: null,
      isTransitioning: true,
      breadcrumbs: [
        { level: 'universe', label: 'Universe' },
        { level: 'galaxy', label: get().selectedGalaxy?.name || 'Galaxy' },
        { level: 'system', label: system.name },
      ],
    });
    setTimeout(() => set({ isTransitioning: false, level: 'system' }), 2000);
  },

  navigateToPlanet: (planet) => {
    set({
      selectedPlanet: planet,
      isTransitioning: true,
      breadcrumbs: [
        { level: 'universe', label: 'Universe' },
        { level: 'galaxy', label: get().selectedGalaxy?.name || 'Galaxy' },
        { level: 'system', label: get().selectedSystem?.name || 'System' },
        { level: 'planet', label: planet.name },
      ],
    });
    setTimeout(() => set({ isTransitioning: false, level: 'planet' }), 1800);
  },
}));
