import { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';
import { UNIVERSE_DATA } from '../data/universeData';
import { useUniverseStore } from '../store/universeStore';
import { useAlgorithmStore, getSegmentLevel, getNodeWorldPosition } from '../store/algorithmStore';

function RouteArc({ 
  fromId, 
  toId, 
  weight,
  status,
  level,
  selectedGalaxy,
  selectedSystem
}: { 
  fromId: string; 
  toId: string; 
  weight: number;
  status: 'unvisited' | 'frontier' | 'visited' | 'path' | 'mst';
  level: string;
  selectedGalaxy: any;
  selectedSystem: any;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const leftLineRef = useRef<THREE.Line>(null);
  const rightLineRef = useRef<THREE.Line>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);
  const dotsGroupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();
  const dotGeo = useMemo(() => new THREE.BoxGeometry(0.035, 0.035, 0.035), []);
  const dotMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#10b981", toneMapped: false }), []);

  const colors = {
    unvisited: '#1e293b',
    frontier: '#f59e0b',
    visited: '#6366f1',
    path: '#10b981',
    mst: '#8b5cf6',
  };

  const color = colors[status];
  const opacity = status === 'unvisited' ? 0.12 : status === 'path' || status === 'mst' ? 0.85 : 0.45;
  const isActivePath = status === 'path' || status === 'mst';

  // Pre-calculate static curve points to avoid allocations and calculations inside useFrame
  const staticPoints = useMemo(() => {
    if (level === 'system') return null;

    const pStart = new THREE.Vector3();
    const pEnd = new THREE.Vector3();

    if (level === 'universe') {
      const g1 = UNIVERSE_DATA.find(g => g.id === fromId);
      const g2 = UNIVERSE_DATA.find(g => g.id === toId);
      if (g1) pStart.set(g1.position[0], g1.position[1], g1.position[2]);
      if (g2) pEnd.set(g2.position[0], g2.position[1], g2.position[2]);
    } else if (level === 'galaxy') {
      if (fromId === selectedGalaxy?.id) {
        pStart.set(0, 0, 0);
      } else {
        const s1 = selectedGalaxy?.systems.find((s: any) => s.id === fromId);
        if (s1) pStart.set(s1.position[0], s1.position[1], s1.position[2]);
      }

      if (toId === selectedGalaxy?.id) {
        pEnd.set(0, 0, 0);
      } else {
        const s2 = selectedGalaxy?.systems.find((s: any) => s.id === toId);
        if (s2) pEnd.set(s2.position[0], s2.position[1], s2.position[2]);
      }
    }

    const midPoint = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
    const distance = pStart.distanceTo(pEnd);
    midPoint.y += distance * 0.12; // curvature height
    const curve = new THREE.QuadraticBezierCurve3(pStart, midPoint, pEnd);
    const points = curve.getPoints(20);

    const leftPoints = status === 'path' ? points.map(p => new THREE.Vector3(p.x - 0.045, p.y, p.z + 0.015)) : null;
    const rightPoints = status === 'path' ? points.map(p => new THREE.Vector3(p.x + 0.045, p.y, p.z - 0.015)) : null;

    const labelPos = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
    labelPos.y += distance * 0.06 + 0.1;

    return { points, leftPoints, rightPoints, labelPos, curve };
  }, [fromId, toId, level, selectedGalaxy, status]);

  // Set static geometries once on mount/change
  useEffect(() => {
    if (staticPoints) {
      if (lineRef.current) {
        lineRef.current.geometry.setFromPoints(staticPoints.points);
      }
      if (leftLineRef.current && staticPoints.leftPoints) {
        leftLineRef.current.geometry.setFromPoints(staticPoints.leftPoints);
      }
      if (rightLineRef.current && staticPoints.rightPoints) {
        rightLineRef.current.geometry.setFromPoints(staticPoints.rightPoints);
      }
      if (labelRef.current) {
        labelRef.current.position.copy(staticPoints.labelPos);
      }
      if (dotsGroupRef.current && status === 'path') {
        const children = dotsGroupRef.current.children;
        for (let i = 0; i < children.length; i++) {
          const t = i / (children.length - 1);
          const pos = staticPoints.curve.getPoint(t);
          children[i].position.copy(pos);
        }
      }
    }
  }, [staticPoints, status]);

  // Reusable vectors for system-level dynamic calculations to avoid garbage collection
  const dynamicVectors = useRef({
    pStart: new THREE.Vector3(),
    pEnd: new THREE.Vector3(),
    midPoint: new THREE.Vector3(),
    labelPos: new THREE.Vector3()
  });

  useFrame((state) => {
    if (level === 'system') {
      const { pStart, pEnd, midPoint, labelPos } = dynamicVectors.current;
      pStart.set(0, 0, 0);
      pEnd.set(0, 0, 0);

      // Fetch dynamic system positions
      if (fromId === selectedSystem?.id) {
        pStart.set(0, 0, 0); // star
      } else {
        const mesh = scene.getObjectByName(`system-node-${fromId}`);
        if (mesh) pStart.copy(mesh.position);
        else {
          const p = selectedSystem?.planets.find((pl: any) => pl.id === fromId);
          if (p) pStart.set(p.orbitRadius, 0, 0);
        }
      }

      if (toId === selectedSystem?.id) {
        pEnd.set(0, 0, 0); // star
      } else {
        const mesh = scene.getObjectByName(`system-node-${toId}`);
        if (mesh) pEnd.copy(mesh.position);
        else {
          const p = selectedSystem?.planets.find((pl: any) => pl.id === toId);
          if (p) pEnd.set(p.orbitRadius, 0, 0);
        }
      }

      midPoint.addVectors(pStart, pEnd).multiplyScalar(0.5);
      const distance = pStart.distanceTo(pEnd);
      midPoint.y += distance * 0.12;

      const curve = new THREE.QuadraticBezierCurve3(pStart, midPoint, pEnd);
      const points = curve.getPoints(20);

      if (lineRef.current) {
        lineRef.current.geometry.setFromPoints(points);
      }
      if (leftLineRef.current && status === 'path') {
        const leftPoints = points.map(p => new THREE.Vector3(p.x - 0.045, p.y, p.z + 0.015));
        leftLineRef.current.geometry.setFromPoints(leftPoints);
      }
      if (rightLineRef.current && status === 'path') {
        const rightPoints = points.map(p => new THREE.Vector3(p.x + 0.045, p.y, p.z - 0.015));
        rightLineRef.current.geometry.setFromPoints(rightPoints);
      }

      if (particleRef.current) {
        const speed = isActivePath ? 0.32 : 0.12;
        const time = (state.clock.elapsedTime * speed) % 1;
        const pos = curve.getPoint(time);
        particleRef.current.position.copy(pos);
      }

      if (labelRef.current) {
        labelPos.addVectors(pStart, pEnd).multiplyScalar(0.5);
        labelPos.y += distance * 0.06 + 0.1;
        labelRef.current.position.copy(labelPos);
      }

      if (dotsGroupRef.current && status === 'path') {
        const children = dotsGroupRef.current.children;
        for (let i = 0; i < children.length; i++) {
          const t = i / (children.length - 1);
          const pos = curve.getPoint(t);
          children[i].position.copy(pos);
        }
      }
    } else {
      // For static levels, just animate the pulse particle using the precomputed curve
      if (particleRef.current && staticPoints) {
        const speed = isActivePath ? 0.32 : 0.12;
        const time = (state.clock.elapsedTime * speed) % 1;
        const pos = staticPoints.curve.getPoint(time);
        particleRef.current.position.copy(pos);
      }
    }
  });

  return (
    <group>
      {status === 'path' ? (
        <group>
          {/* Central corridor highway */}
          <line ref={lineRef as any}>
            <bufferGeometry />
            <lineBasicMaterial color="#10b981" transparent opacity={0.3} />
          </line>
          {/* Left lane */}
          <line ref={leftLineRef as any}>
            <bufferGeometry />
            <lineBasicMaterial color="#10b981" transparent opacity={0.7} />
          </line>
          {/* Right lane */}
          <line ref={rightLineRef as any}>
            <bufferGeometry />
            <lineBasicMaterial color="#10b981" transparent opacity={0.7} />
          </line>
        </group>
      ) : (
        <line ref={lineRef as any}>
          <bufferGeometry />
          <lineBasicMaterial color={color} transparent opacity={opacity} />
        </line>
      )}
      
      {(status !== 'unvisited' || Math.random() < 0.2) && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[isActivePath ? 0.045 : 0.02, 8, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      )}

      {/* Grid path cubes along shortest path */}
      {status === 'path' && (
        <group ref={dotsGroupRef}>
          {Array.from({ length: 15 }).map((_, idx) => (
            <mesh key={idx} geometry={dotGeo} material={dotMat} />
          ))}
        </group>
      )}

      <group ref={labelRef}>
        <Billboard>
          <Text
            fontSize={0.09}
            color={isActivePath ? '#ffffff' : '#64748b'}
            anchorX="center"
            anchorY="middle"
          >
            {`${weight} LY`}
          </Text>
        </Billboard>
      </group>
    </group>
  );
}

export default function RouteVisualizer() {
  const { level, selectedGalaxy, selectedSystem } = useUniverseStore();
  const { 
    generateGraph, 
    edges, 
    nodesState, 
    shortestPath, 
    mstEdges,
    selectedAlgorithm,
    courseLocked
  } = useAlgorithmStore();

  useEffect(() => {
    generateGraph(level, selectedGalaxy, selectedSystem);
  }, [level, selectedGalaxy, selectedSystem, generateGraph]);

  if (!edges || edges.length === 0) return null;

  // Compile active path segments for the current scale
  const pathSegments: { from: string; to: string; weight: number }[] = [];
  if (courseLocked && shortestPath.length >= 2) {
    for (let i = 0; i < shortestPath.length - 1; i++) {
      const u = shortestPath[i];
      const v = shortestPath[i + 1];
      const segContext = getSegmentLevel(u, v);
      if (segContext.level === level) {
        if (level === 'universe' || 
            (level === 'galaxy' && segContext.galaxy?.id === selectedGalaxy?.id) ||
            (level === 'system' && segContext.system?.id === selectedSystem?.id)) {
          
          const pU = getNodeWorldPosition(u);
          const pV = getNodeWorldPosition(v);
          const dist = new THREE.Vector3(...pU).distanceTo(new THREE.Vector3(...pV));
          pathSegments.push({
            from: u,
            to: v,
            weight: parseFloat(dist.toFixed(1))
          });
        }
      }
    }
  }

  return (
    <group>
      {edges.map((edge) => {
        let status: 'unvisited' | 'frontier' | 'visited' | 'path' | 'mst' = 'unvisited';

        if (courseLocked) {
          // In course-locked mode, standard edges act as background guides
          status = 'unvisited';
          
          // Skip drawing if represented in pathSegments to avoid duplication
          const isPathSegment = pathSegments.some(
            seg => (seg.from === edge.from && seg.to === edge.to) || (seg.from === edge.to && seg.to === edge.from)
          );
          if (isPathSegment) return null;
        } else {
          if (selectedAlgorithm === 'kruskal') {
            if (mstEdges.includes(edge.id)) {
              status = 'mst';
            }
          } else {
            const uIdx = shortestPath.indexOf(edge.from);
            const vIdx = shortestPath.indexOf(edge.to);
            
            if (uIdx !== -1 && vIdx !== -1 && Math.abs(uIdx - vIdx) === 1) {
              status = 'visited';
            } else {
              const fromState = nodesState[edge.from];
              const toState = nodesState[edge.to];
              if (fromState?.status === 'visited' && toState?.status === 'visited') {
                status = 'visited';
              } else if (fromState?.status === 'frontier' || toState?.status === 'frontier') {
                status = 'frontier';
              }
            }
          }
        }

        return (
          <RouteArc
            key={edge.id}
            fromId={edge.from}
            toId={edge.to}
            weight={edge.weight}
            status={status}
            level={level}
            selectedGalaxy={selectedGalaxy}
            selectedSystem={selectedSystem}
          />
        );
      })}

      {/* Render active route segments explicitly */}
      {pathSegments.map((seg, idx) => (
        <RouteArc
          key={`path-seg-${idx}-${seg.from}-${seg.to}`}
          fromId={seg.from}
          toId={seg.to}
          weight={seg.weight}
          status="path"
          level={level}
          selectedGalaxy={selectedGalaxy}
          selectedSystem={selectedSystem}
        />
      ))}
    </group>
  );
}
