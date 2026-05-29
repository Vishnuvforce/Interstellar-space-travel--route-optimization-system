export type ExplorationLevel = 'universe' | 'galaxy' | 'system' | 'planet';

export interface Moon {
  id: string;
  name: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
}

export interface Planet {
  id: string;
  name: string;
  type: 'terrestrial' | 'gas_giant' | 'ice' | 'desert' | 'ocean' | 'lava';
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  color: string;
  atmosphereColor: string;
  atmosphereIntensity: number;
  moons: Moon[];
  description: string;
  temperature: string;
  mass: string;
  discovered: string;
}

export interface StarSystem {
  id: string;
  name: string;
  starType: 'G' | 'K' | 'M' | 'F' | 'A' | 'B' | 'O';
  starColor: string;
  starRadius: number;
  position: [number, number, number];
  planets: Planet[];
  description: string;
}

export interface Galaxy {
  id: string;
  name: string;
  type: 'spiral' | 'elliptical' | 'irregular' | 'barred_spiral';
  position: [number, number, number];
  color: string;
  coreColor: string;
  armColor: string;
  systems: StarSystem[];
  description: string;
  distance: string;
  starCount: string;
}
