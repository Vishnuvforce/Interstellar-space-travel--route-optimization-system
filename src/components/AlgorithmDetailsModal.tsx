import { motion } from 'framer-motion';
import { X, Code, Clock, ShieldAlert, Cpu } from 'lucide-react';
import { AlgorithmType } from '../store/algorithmStore';

interface AlgorithmDetailsModalProps {
  algorithmId: AlgorithmType;
  onClose: () => void;
}

const ALGO_DETAILS = {
  dijkstra: {
    name: "Dijkstra's Shortest Path Algorithm",
    description: "Computes the shortest path from a single source node to all other nodes in a weighted graph. It uses a greedy approach, always selecting the unvisited node with the smallest tentative distance.",
    pseudoCode: `function Dijkstra(Graph, source):
    create vertex set Q
    for each vertex v in Graph:
        dist[v] := INFINITY
        prev[v] := UNDEFINED
        add v to Q
    dist[source] := 0
    
    while Q is not empty:
        u := vertex in Q with min dist[u]
        remove u from Q
        
        for each neighbor v of u still in Q:
            alt := dist[u] + Graph.Edges(u, v)
            if alt < dist[v]:
                dist[v] := alt
                prev[v] := u
    return dist, prev`,
    vtuContext: "VTU ADA Syllabus Unit 3: Greedy technique, single-source shortest path problem. Showcases greedy choice property and optimal substructure.",
    timeComplexity: "O(|V|²) with simple arrays, can be optimized to O(|E| log |V|) using a Binary Heap/Priority Queue.",
    spaceComplexity: "O(|V|) to store distances, parents, and queue states."
  },
  astar: {
    name: "A* Pathfinding Algorithm",
    description: "An extension of Dijkstra's algorithm that uses heuristics to guide the search. It calculates f(n) = g(n) + h(n), where g(n) is the exact cost from start to n, and h(n) is the heuristic estimate from n to the goal.",
    pseudoCode: `function AStar(start, goal):
    openSet := {start}
    cameFrom := empty map
    gScore[start] := 0
    fScore[start] := heuristic(start, goal)
    
    while openSet is not empty:
        current := node in openSet with lowest fScore
        if current = goal:
            return reconstruct_path(cameFrom, current)
            
        openSet.remove(current)
        for each neighbor of current:
            tentative_gScore := gScore[current] + dist(current, neighbor)
            if tentative_gScore < gScore[neighbor]:
                cameFrom[neighbor] := current
                gScore[neighbor] := tentative_gScore
                fScore[neighbor] := gScore[neighbor] + heuristic(neighbor, goal)
                if neighbor not in openSet:
                    openSet.add(neighbor)
    return failure`,
    vtuContext: "Heuristic Search Strategies: Demonstrates informed search, reducing state space tree nodes compared to blind algorithms like Dijkstra.",
    timeComplexity: "O(|E|), bound by the quality of the heuristic function (worst case matches Dijkstra O(|E| log |V|)).",
    spaceComplexity: "O(|V|) to keep track of all generated nodes in open and closed sets."
  },
  kruskal: {
    name: "Kruskal's Minimum Spanning Tree",
    description: "A greedy algorithm that finds a Minimum Spanning Tree (MST) for a connected weighted graph. It sorts all edges by weight and adds them one-by-one to the tree, ensuring no cycle is formed.",
    pseudoCode: `function Kruskal(Graph):
    A := empty set (MST)
    for each vertex v in Graph:
        makeSet(v)
    sort edges of Graph by weight in non-decreasing order
    
    for each edge (u, v) in sorted edges:
        if find(u) != find(v):
            A := A union {(u, v)}
            union(u, v)
    return A`,
    vtuContext: "VTU ADA Syllabus Unit 3: Greedy technique, Minimum Spanning Tree using Union-Find (Disjoint Set) data structure with path compression.",
    timeComplexity: "O(|E| log |E|) or O(|E| log |V|) to sort edges. Union-Find operations take almost linear time O(|E| α(|V|)).",
    spaceComplexity: "O(|V| + |E|) to maintain disjoint sets and edge queues."
  }
};

export default function AlgorithmDetailsModal({ algorithmId, onClose }: AlgorithmDetailsModalProps) {
  const details = ALGO_DETAILS[algorithmId];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-900 bg-slate-900/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">{details.name}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Description</span>
            <p className="leading-relaxed text-slate-300">{details.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-900 flex items-start gap-3">
              <Clock className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-0.5">Time Complexity</span>
                <code className="text-emerald-400 font-mono font-medium">{details.timeComplexity}</code>
              </div>
            </div>
            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-900 flex items-start gap-3">
              <Cpu className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-0.5">Space Complexity</span>
                <code className="text-cyan-400 font-mono font-medium">{details.spaceComplexity}</code>
              </div>
            </div>
          </div>

          {/* Pseudo Code */}
          <div>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1.5">VTU Syllabus Algorithm Specification</span>
            <pre className="bg-slate-900 border border-slate-800/80 rounded-lg p-4 overflow-x-auto text-[11px] font-mono text-indigo-300 leading-relaxed max-h-56">
              {details.pseudoCode}
            </pre>
          </div>

          {/* Academic Notes */}
          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-indigo-400 block mb-1">ADA Academic Focus (VTU Coursework)</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                {details.vtuContext}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
