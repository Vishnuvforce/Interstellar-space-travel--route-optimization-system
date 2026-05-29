import { create } from 'zustand';
import * as THREE from 'three';
import { ExplorationLevel, Galaxy, StarSystem } from '../types/universe';
import { UNIVERSE_DATA } from '../data/universeData';
import { useUniverseStore } from './universeStore';

export type AlgorithmType = 'dijkstra' | 'astar' | 'kruskal';
export type SelectionMode = 'start' | 'end' | 'navigate';

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export interface VisitedNodeState {
  nodeId: string;
  status: 'unvisited' | 'frontier' | 'visited' | 'path' | 'unreachable';
  distance: number;
  parent: string | null;
}

interface AlgorithmState {
  selectedAlgorithm: AlgorithmType;
  startNodeId: string | null;
  endNodeId: string | null;
  selectionMode: SelectionMode;
  isRunning: boolean;
  courseLocked: boolean;

  // Route Options
  useWormholes: boolean;
  avoidAnomalies: boolean;
  optimiseFuel: boolean;
  highSpeedCorridors: boolean;

  // Asteroids & Threat Detection
  asteroids: { id: string; position: [number, number, number]; radius: number }[];
  asteroidAlert: boolean;

  // Camera Mode
  cameraMode: 'chase' | 'overhead' | 'cockpit' | 'flyby' | 'orbit' | 'adas';

  // Alternative Path Trajectories
  alternativePaths: Record<AlgorithmType, string[]>;

  // Rocket Traversal State
  isFlying: boolean;
  rocketProgress: number;
  currentSegmentIndex: number;
  fuel: number;
  maxFuelRange: number;
  isRefueling: boolean;
  rocketPosition: [number, number, number] | null;
  unreachableNodes: string[];
  rocketSpeedFactor: number;
  cinematicCamera: boolean;
  shieldActive: boolean;
  engineColor: 'orange' | 'cyan' | 'purple';
  gravityOverdrive: boolean;

  edges: GraphEdge[];
  nodesState: Record<string, VisitedNodeState>;
  traversalSteps: { nodeId: string; status: 'frontier' | 'visited' | 'path' | 'unreachable'; parent: string | null }[];
  currentStepIndex: number;
  shortestPath: string[]; 
  mstEdges: string[]; 
  activeEdge: string | null;

  setAlgorithm: (algo: AlgorithmType) => void;
  setStartNode: (id: string | null) => void;
  setEndNode: (id: string | null) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  generateGraph: (level: ExplorationLevel, selectedGalaxy: Galaxy | null, selectedSystem: StarSystem | null) => void;
  runAlgorithm: () => void;
  stepForward: () => boolean;
  resetAlgorithm: () => void;
  clearCourse: () => void;
  setRocketSpeedFactor: (val: number) => void;
  setCinematicCamera: (val: boolean) => void;
  setCameraMode: (mode: 'chase' | 'overhead' | 'cockpit' | 'flyby' | 'orbit' | 'adas') => void;
  setShieldActive: (val: boolean) => void;
  setEngineColor: (val: 'orange' | 'cyan' | 'purple') => void;
  setGravityOverdrive: (val: boolean) => void;
  toggleRouteOption: (option: 'useWormholes' | 'avoidAnomalies' | 'optimiseFuel' | 'highSpeedCorridors', level: ExplorationLevel, selectedGalaxy: Galaxy | null, selectedSystem: StarSystem | null) => void;
  generateAsteroidsForPath: (path: string[], positions: Record<string, [number, number, number]>) => void;

  // Flight Actions
  setCourse: (startNodePos: [number, number, number] | null) => void;
  lockCourse: (val: boolean) => void;
  startFlight: () => void;
  updateFlight: (delta: number, positions: Record<string, [number, number, number]>) => void;
  stopFlight: () => void;
}

class UnionFind {
  parent: Record<string, string> = {};

  constructor(elements: string[]) {
    elements.forEach(el => {
      this.parent[el] = el;
    });
  }

  find(i: string): string {
    if (this.parent[i] === i) return i;
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  union(i: string, j: string): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootI] = rootJ;
      return true;
    }
    return false;
  }
}

// ----------------- HIERARCHICAL ROUTING UTILITIES -----------------

export function findHierarchy(nodeId: string): string[] | null {
  const gal = UNIVERSE_DATA.find(g => g.id === nodeId);
  if (gal) return [gal.id];
  
  for (const g of UNIVERSE_DATA) {
    const sys = g.systems.find(s => s.id === nodeId);
    if (sys) return [g.id, sys.id];
  }
  
  for (const g of UNIVERSE_DATA) {
    for (const s of g.systems) {
      const p = s.planets.find(pl => pl.id === nodeId);
      if (p) return [g.id, s.id, p.id];
    }
  }
  return null;
}

export function getNodeWorldPosition(nodeId: string): [number, number, number] {
  const gal = UNIVERSE_DATA.find(g => g.id === nodeId);
  if (gal) return gal.position;

  for (const g of UNIVERSE_DATA) {
    const sys = g.systems.find(s => s.id === nodeId);
    if (sys) return sys.position;
  }

  for (const g of UNIVERSE_DATA) {
    for (const s of g.systems) {
      const idx = s.planets.findIndex(p => p.id === nodeId);
      if (idx !== -1) {
        const planet = s.planets[idx];
        const angle = idx * Math.PI * 0.7;
        return [
          Math.cos(angle) * planet.orbitRadius,
          0,
          Math.sin(angle) * planet.orbitRadius
        ];
      }
    }
  }
  return [0, 0, 0];
}

export function solveFlatPath(
  get: () => AlgorithmState,
  level: ExplorationLevel,
  contextId: string | null,
  startId: string,
  endId: string
): string[] {
  const state = get();
  const edges: { from: string; to: string; weight: number }[] = [];
  const edgeSet = new Set<string>();
  let nodesList: string[] = [];

  const getAdjustedWeight = (fromId: string, toId: string, baseDist: number) => {
    let w = baseDist;
    const { useWormholes, avoidAnomalies, optimiseFuel, highSpeedCorridors } = state;
    if (useWormholes && baseDist > (level === 'universe' ? 8.0 : 3.5)) {
      w = baseDist * 0.45;
    }
    const isAnomalyNode = (id: string) => {
      return id.includes('andromeda') || id.includes('sombrero') || id.includes('mars') || id.includes('jupiter') || id.includes('alpha');
    };
    if (avoidAnomalies && (isAnomalyNode(fromId) || isAnomalyNode(toId))) {
      w = w * 2.2;
    }
    const isEcoStation = (id: string) => {
      return id.includes('sol') || id.includes('earth') || id === (contextId || '');
    };
    if (optimiseFuel && (isEcoStation(fromId) || isEcoStation(toId))) {
      w = w * 0.75;
    }
    if (highSpeedCorridors) {
      const isCorridor = (id: string) => id.includes('milky') || id.includes('sol') || id.includes('earth');
      if (isCorridor(fromId) && isCorridor(toId)) {
        w = w * 0.6;
      }
    }
    return parseFloat(w.toFixed(2));
  };

  if (level === 'universe') {
    nodesList = UNIVERSE_DATA.map(g => g.id);
    UNIVERSE_DATA.forEach((gal) => {
      const p1 = new THREE.Vector3(...gal.position);
      const distances = UNIVERSE_DATA
        .filter((g) => g.id !== gal.id)
        .map((g) => {
          const p2 = new THREE.Vector3(...g.position);
          return { id: g.id, dist: p1.distanceTo(p2) };
        })
        .sort((a, b) => a.dist - b.dist);

      const neighbors = distances.slice(0, 2);
      neighbors.forEach((n) => {
        const pairId = [gal.id, n.id].sort().join('-');
        if (!edgeSet.has(pairId)) {
          edgeSet.add(pairId);
          edges.push({
            from: gal.id,
            to: n.id,
            weight: getAdjustedWeight(gal.id, n.id, n.dist),
          });
        }
      });
    });
  } else if (level === 'galaxy' && contextId) {
    const galaxy = UNIVERSE_DATA.find(g => g.id === contextId);
    if (!galaxy) return [];
    nodesList = galaxy.systems.map(s => s.id);
    galaxy.systems.forEach((sys) => {
      const p1 = new THREE.Vector3(...sys.position);
      const distances = galaxy.systems
        .filter((s) => s.id !== sys.id)
        .map((s) => {
          const p2 = new THREE.Vector3(...s.position);
          return { id: s.id, dist: p1.distanceTo(p2) };
        })
        .sort((a, b) => a.dist - b.dist);

      const neighbors = distances.slice(0, 3);
      neighbors.forEach((n) => {
        const pairId = [sys.id, n.id].sort().join('-');
        if (!edgeSet.has(pairId)) {
          edgeSet.add(pairId);
          edges.push({
            from: sys.id,
            to: n.id,
            weight: getAdjustedWeight(sys.id, n.id, n.dist),
          });
        }
      });
    });
  } else if (level === 'system' && contextId) {
    let selectedSys: any = null;
    for (const g of UNIVERSE_DATA) {
      const sys = g.systems.find(s => s.id === contextId);
      if (sys) {
        selectedSys = sys;
        break;
      }
    }
    if (!selectedSys) return [];

    const centralNode = { id: selectedSys.id, position: [0, 0, 0] as [number, number, number] };
    const planetNodes = selectedSys.planets.map((planet: any, idx: number) => {
      const angle = idx * Math.PI * 0.7;
      return {
        id: planet.id,
        position: [
          parseFloat((Math.cos(angle) * planet.orbitRadius).toFixed(2)),
          0,
          parseFloat((Math.sin(angle) * planet.orbitRadius).toFixed(2)),
        ] as [number, number, number],
      };
    });

    nodesList = [centralNode.id, ...planetNodes.map((p: any) => p.id)];

    planetNodes.slice(0, Math.min(planetNodes.length, 3)).forEach((p: any) => {
      const dist = new THREE.Vector3(...centralNode.position).distanceTo(new THREE.Vector3(...p.position));
      const pairId = [centralNode.id, p.id].sort().join('-');
      edges.push({
        from: centralNode.id,
        to: p.id,
        weight: getAdjustedWeight(centralNode.id, p.id, dist),
      });
      edgeSet.add(pairId);
    });

    for (let i = 0; i < planetNodes.length; i++) {
      const p1 = planetNodes[i];
      if (i < planetNodes.length - 1) {
        const p2 = planetNodes[i + 1];
        const dist = new THREE.Vector3(...p1.position).distanceTo(new THREE.Vector3(...p2.position));
        const pairId = [p1.id, p2.id].sort().join('-');
        if (!edgeSet.has(pairId)) {
          edges.push({
            from: p1.id,
            to: p2.id,
            weight: getAdjustedWeight(p1.id, p2.id, dist),
          });
          edgeSet.add(pairId);
        }
      }
      if (i < planetNodes.length - 2) {
        const p3 = planetNodes[i + 2];
        const dist = new THREE.Vector3(...p1.position).distanceTo(new THREE.Vector3(...p3.position));
        const pairId = [p1.id, p3.id].sort().join('-');
        if (!edgeSet.has(pairId)) {
          edges.push({
            from: p1.id,
            to: p3.id,
            weight: getAdjustedWeight(p1.id, p3.id, dist),
          });
          edgeSet.add(pairId);
        }
      }
    }
  }

  const adj: Record<string, { to: string; weight: number }[]> = {};
  nodesList.forEach(n => adj[n] = []);
  edges.forEach(e => {
    adj[e.from]?.push({ to: e.to, weight: e.weight });
    adj[e.to]?.push({ to: e.from, weight: e.weight });
  });

  const dist: Record<string, number> = {};
  const parent: Record<string, string | null> = {};
  const visited = new Set<string>();
  
  nodesList.forEach(n => {
    dist[n] = Infinity;
    parent[n] = null;
  });
  dist[startId] = 0;

  const pq: { id: string; priority: number }[] = [{ id: startId, priority: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.priority - b.priority);
    const { id: u } = pq.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    if (u === endId) break;

    adj[u]?.forEach(edge => {
      const v = edge.to;
      if (!visited.has(v)) {
        const newDist = dist[u] + edge.weight;
        if (newDist < dist[v]) {
          dist[v] = newDist;
          parent[v] = u;
          pq.push({ id: v, priority: newDist });
        }
      }
    });
  }

  const pathIds: string[] = [];
  let curr: string | null = endId;
  while (curr) {
    pathIds.unshift(curr);
    curr = parent[curr];
  }
  return pathIds[0] === startId ? pathIds : [];
}

export function getSegmentLevel(u: string, v: string): {
  level: ExplorationLevel;
  galaxy: Galaxy | null;
  system: StarSystem | null;
} {
  const hU = findHierarchy(u);
  const hV = findHierarchy(v);
  if (!hU || !hV) return { level: 'universe', galaxy: null, system: null };

  const gId = hU[0];
  const galaxy = UNIVERSE_DATA.find(g => g.id === gId) || null;

  // Case 1: Both are at planet/star system level in same system
  if (hU.length === 3 && hV.length === 3 && hU[1] === hV[1]) {
    const system = galaxy?.systems.find(s => s.id === hU[1]) || null;
    return { level: 'system', galaxy, system };
  }
  if ((hU.length === 3 && hV.length === 2 && hU[1] === hV[1]) ||
      (hU.length === 2 && hV.length === 3 && hU[1] === hV[1])) {
    const system = galaxy?.systems.find(s => s.id === hU[1]) || null;
    return { level: 'system', galaxy, system };
  }

  // Case 2: Galaxy level (system-to-system or system-to-galaxy)
  if (hU.length === 2 && hV.length === 2 && hU[0] === hV[0]) {
    return { level: 'galaxy', galaxy, system: null };
  }
  if ((hU.length === 2 && hV.length === 1 && hU[0] === hV[0]) ||
      (hU.length === 1 && hV.length === 2 && hU[0] === hV[0])) {
    return { level: 'galaxy', galaxy, system: null };
  }

  // Case 3: Universe level (galaxy-to-galaxy or cross-galaxy)
  return { level: 'universe', galaxy: null, system: null };
}

export function solveHierarchicalPath(
  get: () => AlgorithmState,
  startId: string,
  endId: string
): string[] {
  const startH = findHierarchy(startId);
  const endH = findHierarchy(endId);
  if (!startH || !endH) return [];

  const G_A = startH[0];
  const S_A = startH[1] || null;
  const P_A = startH[2] || null;

  const G_B = endH[0];
  const S_B = endH[1] || null;
  const P_B = endH[2] || null;

  // Case 1: Same Galaxy
  if (G_A === G_B) {
    // Case 1a: Same Star System
    if (S_A === S_B) {
      if (S_A === null) {
        return [startId];
      }
      return solveFlatPath(get, 'system', S_A, startId, endId);
    }

    // Case 1b: Different Star Systems in same Galaxy
    const p1: string[] = [];
    if (P_A && S_A) {
      p1.push(...solveFlatPath(get, 'system', S_A, startId, S_A));
    } else {
      p1.push(startId);
    }

    const startSysNode = S_A || G_A;
    const endSysNode = S_B || G_B;
    let p2: string[] = [];
    if (startSysNode !== endSysNode) {
      p2 = solveFlatPath(get, 'galaxy', G_A, startSysNode, endSysNode);
    }

    const p3: string[] = [];
    if (P_B && S_B) {
      p3.push(...solveFlatPath(get, 'system', S_B, S_B, endId));
    } else {
      p3.push(endId);
    }

    const stitched: string[] = [];
    const addNodes = (nodes: string[]) => {
      nodes.forEach(node => {
        if (stitched.length === 0 || stitched[stitched.length - 1] !== node) {
          stitched.push(node);
        }
      });
    };
    addNodes(p1);
    addNodes(p2);
    addNodes(p3);
    return stitched;
  }

  // Case 2: Different Galaxies
  const p1: string[] = [];
  if (P_A && S_A) {
    p1.push(...solveFlatPath(get, 'system', S_A, startId, S_A));
  } else {
    p1.push(startId);
  }

  const galaxyA = UNIVERSE_DATA.find(g => g.id === G_A);
  const exitSysA = (galaxyA && galaxyA.systems.length > 0) 
    ? galaxyA.systems[galaxyA.systems.length - 1].id 
    : null;

  const startSysNode = S_A || G_A;
  let p2: string[] = [];
  if (exitSysA && startSysNode !== exitSysA) {
    p2 = solveFlatPath(get, 'galaxy', G_A, startSysNode, exitSysA);
  }

  const p_exit: string[] = [];
  if (exitSysA) {
    p_exit.push(exitSysA);
  }
  p_exit.push(G_A);

  const p3 = solveFlatPath(get, 'universe', null, G_A, G_B);

  const galaxyB = UNIVERSE_DATA.find(g => g.id === G_B);
  const entrySysB = (galaxyB && galaxyB.systems.length > 0)
    ? galaxyB.systems[0].id
    : null;

  const p_entry: string[] = [G_B];
  if (entrySysB) {
    p_entry.push(entrySysB);
  }

  const endSysNode = S_B || G_B;
  let p4: string[] = [];
  if (entrySysB && endSysNode !== entrySysB) {
    p4 = solveFlatPath(get, 'galaxy', G_B, entrySysB, endSysNode);
  }

  const p5: string[] = [];
  if (P_B && S_B) {
    p5.push(...solveFlatPath(get, 'system', S_B, S_B, endId));
  } else {
    p5.push(endId);
  }

  const stitched: string[] = [];
  const addNodes = (nodes: string[]) => {
    nodes.forEach(node => {
      if (stitched.length === 0 || stitched[stitched.length - 1] !== node) {
        stitched.push(node);
      }
    });
  };

  addNodes(p1);
  addNodes(p2);
  addNodes(p_exit);
  addNodes(p3);
  addNodes(p_entry);
  addNodes(p4);
  addNodes(p5);

  return stitched;
}

export const useAlgorithmStore = create<AlgorithmState>((set, get) => ({
  selectedAlgorithm: 'dijkstra',
  startNodeId: null,
  endNodeId: null,
  selectionMode: 'navigate',
  isRunning: false,
  courseLocked: false,

  // Route Options Default State
  useWormholes: false,
  avoidAnomalies: false,
  optimiseFuel: false,
  highSpeedCorridors: false,

  // Asteroids & Threat detection
  asteroids: [],
  asteroidAlert: false,

  // Camera Mode
  cameraMode: 'chase',

  // Precalculated path alternatives
  alternativePaths: {
    dijkstra: [],
    astar: [],
    kruskal: []
  },

  // Rocket Traversal Default State
  isFlying: false,
  rocketProgress: 0,
  currentSegmentIndex: 0,
  fuel: 100,
  maxFuelRange: 5.5,
  isRefueling: false,
  rocketPosition: null,
  unreachableNodes: [],
  rocketSpeedFactor: 1.0,
  cinematicCamera: true,
  shieldActive: false,
  engineColor: 'orange',
  gravityOverdrive: false,

  edges: [],
  nodesState: {},
  traversalSteps: [],
  currentStepIndex: -1,
  shortestPath: [],
  mstEdges: [],
  activeEdge: null,

  setAlgorithm: (algo) => {
    set({ selectedAlgorithm: algo, shortestPath: get().alternativePaths[algo] || [] });
  },

  setSelectionMode: (mode) => set({ selectionMode: mode }),

  setStartNode: (id) => {
    set({ 
      startNodeId: id, 
      shortestPath: [], 
      currentStepIndex: -1, 
      isFlying: false, 
      rocketPosition: null, 
      courseLocked: false, 
      asteroids: [], 
      asteroidAlert: false,
      alternativePaths: { dijkstra: [], astar: [], kruskal: [] }
    });
    get().resetAlgorithm();
  },

  setEndNode: (id) => {
    set({ 
      endNodeId: id, 
      shortestPath: [], 
      currentStepIndex: -1, 
      isFlying: false, 
      rocketPosition: null, 
      courseLocked: false, 
      asteroids: [], 
      asteroidAlert: false,
      alternativePaths: { dijkstra: [], astar: [], kruskal: [] }
    });
    get().resetAlgorithm();
  },

  lockCourse: (val) => set({ courseLocked: val }),
  setRocketSpeedFactor: (val) => set({ rocketSpeedFactor: val }),
  setCinematicCamera: (val) => set({ cinematicCamera: val }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setShieldActive: (val) => set({ shieldActive: val }),
  setEngineColor: (val) => set({ engineColor: val }),
  setGravityOverdrive: (val) => set({ gravityOverdrive: val }),

  toggleRouteOption: (option, level, selectedGalaxy, selectedSystem) => {
    set((state) => ({ [option]: !state[option] }));
    get().generateGraph(level, selectedGalaxy, selectedSystem);
    if (get().startNodeId && get().endNodeId) {
      get().runAlgorithm();
    }
  },

  generateAsteroidsForPath: (path, positions) => {
    if (path.length < 2) {
      set({ asteroids: [] });
      return;
    }
    const generated: { id: string; position: [number, number, number]; radius: number }[] = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const pU = positions[u];
      const pV = positions[v];
      if (!pU || !pV) continue;

      const pU_vec = new THREE.Vector3(...pU);
      const pV_vec = new THREE.Vector3(...pV);
      const dist = pU_vec.distanceTo(pV_vec);

      const count = Math.max(1, Math.round(dist * 0.4));
      for (let j = 0; j < count; j++) {
        const t = 0.2 + (j + 1) / (count + 1) * 0.6 + (Math.random() - 0.5) * 0.08;
        const basePoint = new THREE.Vector3().lerpVectors(pU_vec, pV_vec, t);
        
        const segmentDir = new THREE.Vector3().subVectors(pV_vec, pU_vec).normalize();
        const randomVec = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        const perpDir = new THREE.Vector3().crossVectors(segmentDir, randomVec).normalize();
        
        const offsetDist = 0.2 + Math.random() * 0.35;
        const asteroidPos = basePoint.add(perpDir.multiplyScalar(offsetDist));
        
        const radius = 0.06 + Math.random() * 0.12;

        generated.push({
          id: `asteroid-${i}-${j}-${Math.random().toString(36).substr(2, 4)}`,
          position: [asteroidPos.x, asteroidPos.y, asteroidPos.z],
          radius
        });
      }
    }
    set({ asteroids: generated, asteroidAlert: false });
  },

  generateGraph: (level, selectedGalaxy, selectedSystem) => {
    const edges: GraphEdge[] = [];
    const edgeSet = new Set<string>();
    const initialNodesState: Record<string, VisitedNodeState> = {};
    
    let nodesList: { id: string; name: string; position: [number, number, number] }[] = [];
    let fuelRange = 5.5;
    let defaultStart: string | null = null;
    let defaultEnd: string | null = null;

    const getAdjustedWeight = (fromId: string, toId: string, baseDist: number) => {
      let w = baseDist;
      const { useWormholes, avoidAnomalies, optimiseFuel, highSpeedCorridors } = get();
      
      if (useWormholes && baseDist > (level === 'universe' ? 8.0 : 3.5)) {
        w = baseDist * 0.45; // 55% discount
      }
      
      const isAnomalyNode = (id: string) => {
        return id.includes('andromeda') || id.includes('sombrero') || id.includes('mars') || id.includes('jupiter') || id.includes('alpha');
      };
      
      if (avoidAnomalies && (isAnomalyNode(fromId) || isAnomalyNode(toId))) {
        w = w * 2.2; // 120% penalty
      }
      
      const isEcoStation = (id: string) => {
        return id.includes('sol') || id.includes('earth') || id === (selectedSystem?.id || '');
      };
      
      if (optimiseFuel && (isEcoStation(fromId) || isEcoStation(toId))) {
        w = w * 0.75; // 25% discount
      }

      if (highSpeedCorridors) {
        const isCorridor = (id: string) => id.includes('milky') || id.includes('sol') || id.includes('earth');
        if (isCorridor(fromId) && isCorridor(toId)) {
          w = w * 0.6; // 40% highway discount
        }
      }

      return parseFloat(w.toFixed(2));
    };

    if (level === 'universe') {
      fuelRange = 15.0;
      nodesList = UNIVERSE_DATA.map(galaxy => ({
        id: galaxy.id,
        name: galaxy.name,
        position: galaxy.position,
      }));

      // Connect each galaxy to its 2 closest neighbors
      nodesList.forEach((gal) => {
        const p1 = new THREE.Vector3(...gal.position);
        const distances = nodesList
          .filter((g) => g.id !== gal.id)
          .map((g) => {
            const p2 = new THREE.Vector3(...g.position);
            return { id: g.id, dist: p1.distanceTo(p2) };
          })
          .sort((a, b) => a.dist - b.dist);

        const neighbors = distances.slice(0, 2);
        neighbors.forEach((n) => {
          const pairId = [gal.id, n.id].sort().join('-');
          if (!edgeSet.has(pairId)) {
            edgeSet.add(pairId);
            edges.push({
              id: pairId,
              from: gal.id,
              to: n.id,
              weight: getAdjustedWeight(gal.id, n.id, n.dist),
            });
          }
        });
      });

      defaultStart = nodesList[0]?.id || null;
      defaultEnd = nodesList[nodesList.length - 1]?.id || null;

    } else if (level === 'galaxy') {
      if (!selectedGalaxy || !selectedGalaxy.systems) return;
      fuelRange = 5.5;
      nodesList = selectedGalaxy.systems.map(sys => ({
        id: sys.id,
        name: sys.name,
        position: sys.position,
      }));

      // Connect each star system to its 3 closest neighbors
      nodesList.forEach((sys) => {
        const p1 = new THREE.Vector3(...sys.position);
        const distances = nodesList
          .filter((s) => s.id !== sys.id)
          .map((s) => {
            const p2 = new THREE.Vector3(...s.position);
            return { id: s.id, dist: p1.distanceTo(p2) };
          })
          .sort((a, b) => a.dist - b.dist);

        const neighbors = distances.slice(0, 3);
        neighbors.forEach((n) => {
          const pairId = [sys.id, n.id].sort().join('-');
          if (!edgeSet.has(pairId)) {
            edgeSet.add(pairId);
            edges.push({
              id: pairId,
              from: sys.id,
              to: n.id,
              weight: getAdjustedWeight(sys.id, n.id, n.dist),
            });
          }
        });
      });

      defaultStart = nodesList[0]?.id || null;
      defaultEnd = nodesList[nodesList.length - 1]?.id || null;

    } else if (level === 'system') {
      if (!selectedSystem || !selectedSystem.planets) return;
      fuelRange = 6.0;

      // The nodes are the Central Star (using selectedSystem.id) and all planets
      const centralNode = {
        id: selectedSystem.id,
        name: `${selectedSystem.name} Star`,
        position: [0, 0, 0] as [number, number, number],
      };

      const planetNodes = selectedSystem.planets.map((planet, idx) => {
        // Scatter planets around orbit at distinct angles for an interesting path grid
        const angle = idx * Math.PI * 0.7;
        return {
          id: planet.id,
          name: planet.name,
          position: [
            parseFloat((Math.cos(angle) * planet.orbitRadius).toFixed(2)),
            0,
            parseFloat((Math.sin(angle) * planet.orbitRadius).toFixed(2)),
          ] as [number, number, number],
        };
      });

      nodesList = [centralNode, ...planetNodes];

      // Build edges connecting star to the inner 3 planets
      planetNodes.slice(0, Math.min(planetNodes.length, 3)).forEach(p => {
        const dist = new THREE.Vector3(...centralNode.position).distanceTo(new THREE.Vector3(...p.position));
        const pairId = [centralNode.id, p.id].sort().join('-');
        edges.push({
          id: pairId,
          from: centralNode.id,
          to: p.id,
          weight: getAdjustedWeight(centralNode.id, p.id, dist),
        });
        edgeSet.add(pairId);
      });

      // Chain planets sequentially and create some cross edges
      for (let i = 0; i < planetNodes.length; i++) {
        const p1 = planetNodes[i];
        if (i < planetNodes.length - 1) {
          const p2 = planetNodes[i + 1];
          const dist = new THREE.Vector3(...p1.position).distanceTo(new THREE.Vector3(...p2.position));
          const pairId = [p1.id, p2.id].sort().join('-');
          if (!edgeSet.has(pairId)) {
            edges.push({
              id: pairId,
              from: p1.id,
              to: p2.id,
              weight: getAdjustedWeight(p1.id, p2.id, dist),
            });
            edgeSet.add(pairId);
          }
        }
        // Cross jump (skip-1) to build optional shortcuts
        if (i < planetNodes.length - 2) {
          const p3 = planetNodes[i + 2];
          const dist = new THREE.Vector3(...p1.position).distanceTo(new THREE.Vector3(...p3.position));
          const pairId = [p1.id, p3.id].sort().join('-');
          if (!edgeSet.has(pairId)) {
            edges.push({
              id: pairId,
              from: p1.id,
              to: p3.id,
              weight: getAdjustedWeight(p1.id, p3.id, dist),
            });
            edgeSet.add(pairId);
          }
        }
      }

      defaultStart = centralNode.id;
      defaultEnd = planetNodes[planetNodes.length - 1]?.id || null;
    }

    nodesList.forEach((n) => {
      initialNodesState[n.id] = {
        nodeId: n.id,
        status: 'unvisited',
        distance: Infinity,
        parent: null,
      };
    });

    if (get().courseLocked) {
      // If course is locked, only update background graph elements for the new level
      // and do not overwrite the active course lock or flight telemetry state
      set({
        edges,
        nodesState: initialNodesState,
        maxFuelRange: fuelRange,
      });
      return;
    }

    set({
      edges,
      nodesState: initialNodesState,
      startNodeId: defaultStart,
      endNodeId: defaultEnd,
      shortestPath: [],
      traversalSteps: [],
      currentStepIndex: -1,
      mstEdges: [],
      activeEdge: null,
      isRunning: false,
      isFlying: false,
      courseLocked: false,
      maxFuelRange: fuelRange,
      rocketPosition: nodesList[0] ? nodesList[0].position : null,
      unreachableNodes: [],
    });
  },

  resetAlgorithm: () => {
    const { nodesState } = get();
    const resetNodes: Record<string, VisitedNodeState> = {};
    Object.keys(nodesState).forEach((key) => {
      resetNodes[key] = {
        nodeId: key,
        status: 'unvisited',
        distance: Infinity,
        parent: null,
      };
    });

    set({
      nodesState: resetNodes,
      shortestPath: [],
      traversalSteps: [],
      currentStepIndex: -1,
      mstEdges: [],
      activeEdge: null,
      isRunning: false,
      isFlying: false,
      courseLocked: false,
      fuel: 100,
      isRefueling: false,
      unreachableNodes: [],
    });
  },

  clearCourse: () => {
    set({
      startNodeId: null,
      endNodeId: null,
      shortestPath: [],
      courseLocked: false,
      isFlying: false,
      rocketPosition: null,
    });
    
    // Reset nodesState to unvisited
    const { nodesState } = get();
    const resetNodes: Record<string, VisitedNodeState> = {};
    Object.keys(nodesState).forEach((key) => {
      resetNodes[key] = {
        nodeId: key,
        status: 'unvisited',
        distance: Infinity,
        parent: null,
      };
    });
    set({ nodesState: resetNodes });
  },

  runAlgorithm: () => {
    const { selectedAlgorithm, edges, nodesState, maxFuelRange } = get();
    let { startNodeId, endNodeId } = get();
    const nodes = Object.keys(nodesState);

    // Fallbacks if start or end target is missing, or start equals end
    if (nodes.length >= 2) {
      if (!startNodeId) {
        startNodeId = nodes[0];
        set({ startNodeId: nodes[0] });
      }
      if (!endNodeId) {
        const fallbackEnd = nodes.find(id => id !== startNodeId) || nodes[nodes.length - 1];
        endNodeId = fallbackEnd;
        set({ endNodeId: fallbackEnd });
      }
      if (startNodeId === endNodeId) {
        const fallbackEnd = nodes.find(id => id !== startNodeId) || nodes[nodes.length - 1];
        endNodeId = fallbackEnd;
        set({ endNodeId: fallbackEnd });
      }
    }

    if (!startNodeId) return;

    if (startNodeId && endNodeId) {
      const startH = findHierarchy(startNodeId);
      const endH = findHierarchy(endNodeId);
      const isSameContext = startH && endH && 
        (startH[0] === endH[0]) && 
        (startH[1] === endH[1] || (startH.length === 1 && endH.length === 1));

      if (!isSameContext) {
        const fullPath = solveHierarchicalPath(get, startNodeId, endNodeId);
        set({
          shortestPath: fullPath,
          courseLocked: true,
          isRunning: false,
          isFlying: false,
          rocketProgress: 0,
          currentSegmentIndex: 0,
          fuel: 100,
          isRefueling: false,
        });
        const startPos = getNodeWorldPosition(startNodeId);
        set({ rocketPosition: startPos });
        return;
      }
    }

    get().resetAlgorithm();
    set({ isRunning: true });

    // Helper: Dijkstra/A* pathfinder
    const solvePath = (algo: 'dijkstra' | 'astar'): { path: string[], steps: any[] } => {
      if (!endNodeId) return { path: [], steps: [] };

      const stepsList: any[] = [];
      const adj: Record<string, { to: string; weight: number }[]> = {};
      nodes.forEach(n => adj[n] = []);
      edges.forEach(e => {
        if (e.weight <= maxFuelRange) {
          adj[e.from].push({ to: e.to, weight: e.weight });
          adj[e.to].push({ to: e.from, weight: e.weight });
        }
      });

      const dist: Record<string, number> = {};
      const parent: Record<string, string | null> = {};
      const visited = new Set<string>();
      
      nodes.forEach(n => {
        dist[n] = Infinity;
        parent[n] = null;
      });
      dist[startNodeId] = 0;

      const pq: { id: string; priority: number }[] = [{ id: startNodeId, priority: 0 }];

      while (pq.length > 0) {
        pq.sort((a, b) => a.priority - b.priority);
        const { id: u } = pq.shift()!;

        if (visited.has(u)) continue;
        visited.add(u);
        
        stepsList.push({ nodeId: u, status: 'visited', parent: parent[u] });

        if (u === endNodeId) break;

        adj[u].forEach(edge => {
          const v = edge.to;
          if (!visited.has(v)) {
            const newDist = dist[u] + edge.weight;
            let priority = newDist;
            
            if (algo === 'astar') {
              priority += 0.45 * edge.weight;
            }

            if (newDist < dist[v]) {
              dist[v] = newDist;
              parent[v] = u;
              pq.push({ id: v, priority });
              stepsList.push({ nodeId: v, status: 'frontier', parent: u });
            }
          }
        });
      }

      const pathIds: string[] = [];
      let curr: string | null = endNodeId;
      while (curr) {
        pathIds.unshift(curr);
        curr = parent[curr];
      }
      if (pathIds[0] !== startNodeId) {
        return { path: [], steps: stepsList };
      }
      return { path: pathIds, steps: stepsList };
    };

    // Calculate Kruskal MST and path
    const solveKruskal = (): { path: string[], mstEdges: string[], steps: any[] } => {
      const stepsList: any[] = [];
      const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
      const uf = new UnionFind(nodes);
      const mstEdgeIds: string[] = [];

      sortedEdges.forEach((edge) => {
        if (edge.weight <= maxFuelRange && uf.find(edge.from) !== uf.find(edge.to)) {
          uf.union(edge.from, edge.to);
          mstEdgeIds.push(edge.id);
          stepsList.push({ nodeId: edge.from, status: 'path', parent: edge.to });
        }
      });

      const pathIds: string[] = [];
      if (endNodeId) {
        const activeEdges = edges.filter(e => mstEdgeIds.includes(e.id));
        const adj: Record<string, string[]> = {};
        activeEdges.forEach(e => {
          if (!adj[e.from]) adj[e.from] = [];
          if (!adj[e.to]) adj[e.to] = [];
          adj[e.from].push(e.to);
          adj[e.to].push(e.from);
        });

        if (adj[startNodeId] && adj[endNodeId]) {
          const queue: string[] = [startNodeId];
          const visited = new Set<string>([startNodeId]);
          const parent: Record<string, string | null> = { [startNodeId]: null };

          while (queue.length > 0) {
            const curr = queue.shift()!;
            if (curr === endNodeId) break;

            (adj[curr] || []).forEach(neighbor => {
              if (!visited.has(neighbor)) {
                visited.add(neighbor);
                parent[neighbor] = curr;
                queue.push(neighbor);
              }
            });
          }

          if (visited.has(endNodeId)) {
            let curr: string | null = endNodeId;
            while (curr) {
              pathIds.unshift(curr);
              curr = parent[curr];
            }
          }
        }
      }

      return { path: pathIds, mstEdges: mstEdgeIds, steps: stepsList };
    };

    const dijkstraRes = solvePath('dijkstra');
    const astarRes = solvePath('astar');
    const kruskalRes = solveKruskal();

    const alternatives = {
      dijkstra: dijkstraRes.path,
      astar: astarRes.path,
      kruskal: kruskalRes.path
    };

    let activeSteps: any[] = [];
    if (selectedAlgorithm === 'dijkstra') {
      activeSteps = dijkstraRes.steps;
    } else if (selectedAlgorithm === 'astar') {
      activeSteps = astarRes.steps;
    } else {
      activeSteps = kruskalRes.steps;
    }

    const reachable = new Set<string>();
    const q: string[] = [startNodeId];
    reachable.add(startNodeId);
    const filteredAdj: Record<string, string[]> = {};
    nodes.forEach(n => filteredAdj[n] = []);
    edges.forEach(e => {
      if (e.weight <= maxFuelRange) {
        filteredAdj[e.from].push(e.to);
        filteredAdj[e.to].push(e.from);
      }
    });
    while (q.length > 0) {
      const curr = q.shift()!;
      filteredAdj[curr].forEach(neighbor => {
        if (!reachable.has(neighbor)) {
          reachable.add(neighbor);
          q.push(neighbor);
        }
      });
    }
    const unreachableNodesList = nodes.filter(n => !reachable.has(n));

    unreachableNodesList.forEach(n => {
      activeSteps.push({ nodeId: n, status: 'unreachable', parent: null });
    });

    set({
      alternativePaths: alternatives,
      shortestPath: alternatives[selectedAlgorithm],
      mstEdges: kruskalRes.mstEdges,
      traversalSteps: activeSteps,
      currentStepIndex: 0,
      unreachableNodes: unreachableNodesList,
    });
  },

  stepForward: () => {
    const { traversalSteps, currentStepIndex, nodesState, isRunning } = get();
    if (!isRunning || currentStepIndex < 0 || currentStepIndex >= traversalSteps.length) {
      set({ isRunning: false });
      return false;
    }

    const step = traversalSteps[currentStepIndex];
    const newNodesState = { ...nodesState };

    if (newNodesState[step.nodeId]) {
      newNodesState[step.nodeId] = {
        ...newNodesState[step.nodeId],
        status: step.status as any,
        parent: step.parent,
      };
    }

    set({
      nodesState: newNodesState,
      currentStepIndex: currentStepIndex + 1,
    });

    return true;
  },

  // Flight Actions
  setCourse: (startNodePos) => {
    const { startNodeId } = get();
    if (!startNodeId) return;

    // Zoom/scale to the start node
    const startH = findHierarchy(startNodeId);
    if (startH) {
      const gId = startH[0];
      const sId = startH[1] || null;
      const pId = startH[2] || null;
      const galaxy = UNIVERSE_DATA.find(g => g.id === gId) || null;
      const system = galaxy?.systems.find(s => s.id === sId) || null;
      const planet = system?.planets.find(p => p.id === pId) || null;

      useUniverseStore.setState({
        level: pId ? 'system' : sId ? 'galaxy' : 'universe',
        selectedGalaxy: galaxy,
        selectedSystem: system,
        selectedPlanet: planet,
        isTransitioning: true
      });
      setTimeout(() => useUniverseStore.setState({ isTransitioning: false }), 1200);
    }
    
    set({
      isFlying: false,
      rocketProgress: 0,
      currentSegmentIndex: 0,
      fuel: 100,
      isRefueling: false,
      courseLocked: true,
      rocketPosition: startNodePos,
      cinematicCamera: true, // Auto focus cinematic view!
    });
  },

  startFlight: () => {
    const { shortestPath } = get();
    if (shortestPath.length < 2) return;

    // Transition immediately to the first segment's scale level
    const u = shortestPath[0];
    const v = shortestPath[1];
    const segContext = getSegmentLevel(u, v);
    
    useUniverseStore.setState({
      level: segContext.level,
      selectedGalaxy: segContext.galaxy,
      selectedSystem: segContext.system,
      selectedPlanet: null,
      isTransitioning: true
    });
    setTimeout(() => useUniverseStore.setState({ isTransitioning: false }), 1200);

    set({
      isFlying: true,
      rocketProgress: 0,
      currentSegmentIndex: 0,
      fuel: 100,
      isRefueling: false,
      cinematicCamera: true, // Auto focus cinematic view!
    });
  },

  stopFlight: () => {
    set({ isFlying: false });
  },

  updateFlight: (delta, positions) => {
    const { 
      isFlying, 
      isRefueling, 
      shortestPath, 
      currentSegmentIndex, 
      rocketProgress, 
      fuel,
      edges,
      rocketSpeedFactor,
      asteroids
    } = get();

    if (!isFlying) return;

    if (isRefueling) {
      const newFuel = Math.min(fuel + delta * 50, 100); // refill rate
      set({ fuel: newFuel });
      if (newFuel >= 100) {
        set({ isRefueling: false });
      }
      return;
    }

    if (currentSegmentIndex >= shortestPath.length - 1) {
      set({ isFlying: false, asteroidAlert: false }); // target reached!
      return;
    }

    const u = shortestPath[currentSegmentIndex];
    const v = shortestPath[currentSegmentIndex + 1];
    
    const pU = positions[u];
    const pV = positions[v];

    if (!pU || !pV) return;

    const edge = edges.find(
      e => (e.from === u && e.to === v) || (e.from === v && e.to === u)
    );
    const weight = edge ? edge.weight : 3.0;

    // Flight speed multiplier based on edge cost and speed factor
    const speedMultiplier = (1.0 / Math.max(weight * 0.4, 0.5)) * rocketSpeedFactor;
    const nextProgress = rocketProgress + delta * speedMultiplier;

    // Ideal Bezier arc path
    const idealPos: [number, number, number] = [
      pU[0] + (pV[0] - pU[0]) * Math.min(nextProgress, 1),
      pU[1] + (pV[1] - pU[1]) * Math.min(nextProgress, 1) + Math.sin(Math.min(nextProgress, 1) * Math.PI) * (weight * 0.15),
      pU[2] + (pV[2] - pU[2]) * Math.min(nextProgress, 1),
    ];

    // Proximity obstacle check & detour avoidance displacement
    const rocketPosVec = new THREE.Vector3(...idealPos);
    let detectedAlert = false;

    asteroids.forEach((ast) => {
      const astVec = new THREE.Vector3(...ast.position);
      const dist = rocketPosVec.distanceTo(astVec);
      const safetyDist = ast.radius + 0.38;

      if (dist < safetyDist) {
        detectedAlert = true;
        const penetration = safetyDist - dist;
        const diffDir = new THREE.Vector3().subVectors(rocketPosVec, astVec);
        if (diffDir.lengthSq() === 0) {
          diffDir.set(0, 1, 0);
        }
        diffDir.normalize();

        // Evade asteroid by displacing spacecraft coordinates
        const detourDisplacement = diffDir.multiplyScalar(penetration * 1.6);
        rocketPosVec.add(detourDisplacement);
      }
    });

    const finalPos: [number, number, number] = [rocketPosVec.x, rocketPosVec.y, rocketPosVec.z];

    if (nextProgress >= 1) {
      const fuelCost = weight * 12; // burn rate
      const remainingFuel = Math.max(fuel - fuelCost, 0);

      const nextSegmentIndex = currentSegmentIndex + 1;
      let nextRefuelNeeded = remainingFuel < 30; // safety refuel margin
      
      if (nextSegmentIndex < shortestPath.length - 1) {
        const nextU = shortestPath[nextSegmentIndex];
        const nextV = shortestPath[nextSegmentIndex + 1];
        const nextEdge = edges.find(
          e => (e.from === nextU && e.to === nextV) || (e.from === nextV && e.to === nextU)
        );
        const nextWeight = nextEdge ? nextEdge.weight : 3.0;
        if (remainingFuel < nextWeight * 12) {
          nextRefuelNeeded = true;
        }
      }

      // Auto scale level switching on node arrival
      if (nextSegmentIndex < shortestPath.length - 1) {
        const nextU = shortestPath[nextSegmentIndex];
        const nextV = shortestPath[nextSegmentIndex + 1];
        const nextSegContext = getSegmentLevel(nextU, nextV);
        
        const universeState = useUniverseStore.getState();
        if (universeState.level !== nextSegContext.level ||
            universeState.selectedGalaxy?.id !== nextSegContext.galaxy?.id ||
            universeState.selectedSystem?.id !== nextSegContext.system?.id) {
          
          useUniverseStore.setState({
            level: nextSegContext.level,
            selectedGalaxy: nextSegContext.galaxy,
            selectedSystem: nextSegContext.system,
            selectedPlanet: null,
            isTransitioning: true
          });
          setTimeout(() => useUniverseStore.setState({ isTransitioning: false }), 1200);
        }
      } else {
        // Final destination target arrival
        const targetNodeId = shortestPath[shortestPath.length - 1];
        const targetH = findHierarchy(targetNodeId);
        if (targetH) {
          const gId = targetH[0];
          const sId = targetH[1] || null;
          const pId = targetH[2] || null;
          const galaxy = UNIVERSE_DATA.find(g => g.id === gId) || null;
          const system = galaxy?.systems.find(s => s.id === sId) || null;
          const planet = system?.planets.find(p => p.id === pId) || null;
          
          useUniverseStore.setState({
            level: pId ? 'system' : sId ? 'galaxy' : 'universe',
            selectedGalaxy: galaxy,
            selectedSystem: system,
            selectedPlanet: planet,
            isTransitioning: true
          });
          setTimeout(() => useUniverseStore.setState({ isTransitioning: false }), 1200);
        }
      }

      set({
        rocketProgress: 0,
        currentSegmentIndex: nextSegmentIndex,
        fuel: remainingFuel,
        rocketPosition: positions[v] || get().rocketPosition,
        isRefueling: nextRefuelNeeded,
        asteroidAlert: false
      });
    } else {
      set({
        rocketProgress: nextProgress,
        rocketPosition: finalPos,
        asteroidAlert: detectedAlert
      });
    }
  },
}));
