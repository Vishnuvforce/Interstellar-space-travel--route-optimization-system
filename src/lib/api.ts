import { supabase } from './supabase';
import { Galaxy, StarSystem, Planet, Moon } from '../types/universe';
import type { Database } from './database.types';

type GalaxyRow = Database['public']['Tables']['galaxies']['Row'];
type SystemRow = Database['public']['Tables']['star_systems']['Row'];
type PlanetRow = Database['public']['Tables']['planets']['Row'];
type MoonRow = Database['public']['Tables']['moons']['Row'];

// Transform database rows to app types
function rowToMoon(row: MoonRow): Moon {
  return {
    id: row.id,
    name: row.name,
    radius: row.radius,
    orbitRadius: row.orbit_radius,
    orbitSpeed: row.orbit_speed,
    color: row.color,
  };
}

function rowToPlanet(row: PlanetRow, moons: Moon[]): Planet {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Planet['type'],
    radius: row.radius,
    orbitRadius: row.orbit_radius,
    orbitSpeed: row.orbit_speed,
    rotationSpeed: row.rotation_speed,
    color: row.color,
    atmosphereColor: row.atmosphere_color,
    atmosphereIntensity: row.atmosphere_intensity,
    moons,
    description: row.description,
    temperature: row.temperature,
    mass: row.mass,
    discovered: row.discovered,
  };
}

function rowToSystem(row: SystemRow, planets: Planet[]): StarSystem {
  return {
    id: row.id,
    name: row.name,
    starType: row.star_type as StarSystem['starType'],
    starColor: row.star_color,
    starRadius: row.star_radius,
    position: [row.position_x, row.position_y, row.position_z],
    planets,
    description: row.description,
  };
}

function rowToGalaxy(row: GalaxyRow, systems: StarSystem[]): Galaxy {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Galaxy['type'],
    position: [row.position_x, row.position_y, row.position_z],
    color: row.color,
    coreColor: row.core_color,
    armColor: row.arm_color,
    systems,
    description: row.description,
    distance: row.distance,
    starCount: row.star_count,
  };
}

// Fetch all galaxies (without nested data for performance)
export async function fetchGalaxies(): Promise<Galaxy[]> {
  const { data, error } = await supabase.from('galaxies').select('*').order('name');
  if (error) throw error;
  return data.map((g) => rowToGalaxy(g, []));
}

// Fetch a single galaxy with all nested data
export async function fetchGalaxy(id: string): Promise<Galaxy | null> {
  const { data: galaxy, error: gError } = await supabase
    .from('galaxies')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (gError) throw gError;
  if (!galaxy) return null;

  const { data: systems, error: sError } = await supabase
    .from('star_systems')
    .select('*')
    .eq('galaxy_id', id);
  if (sError) throw sError;

  const fullSystems: StarSystem[] = [];
  for (const sys of systems || []) {
    const planets = await fetchSystemPlanets(sys.id);
    fullSystems.push(rowToSystem(sys, planets));
  }

  return rowToGalaxy(galaxy, fullSystems);
}

// Fetch star systems for a galaxy
export async function fetchGalaxySystems(galaxyId: string): Promise<StarSystem[]> {
  const { data, error } = await supabase
    .from('star_systems')
    .select('*')
    .eq('galaxy_id', galaxyId)
    .order('name');
  if (error) throw error;
  return data.map((s) => rowToSystem(s, []));
}

// Fetch a single star system with planets
export async function fetchStarSystem(id: string): Promise<StarSystem | null> {
  const { data, error } = await supabase.from('star_systems').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const planets = await fetchSystemPlanets(id);
  return rowToSystem(data, planets);
}

// Fetch planets for a system
async function fetchSystemPlanets(systemId: string): Promise<Planet[]> {
  const { data: planets, error: pError } = await supabase
    .from('planets')
    .select('*')
    .eq('system_id', systemId)
    .order('orbit_radius');
  if (pError) throw pError;

  const fullPlanets: Planet[] = [];
  for (const p of planets || []) {
    const { data: moons, error: mError } = await supabase
      .from('moons')
      .select('*')
      .eq('planet_id', p.id)
      .order('orbit_radius');
    if (mError) throw mError;
    fullPlanets.push(rowToPlanet(p, moons?.map(rowToMoon) || []));
  }
  return fullPlanets;
}

// Fetch a single planet with moons
export async function fetchPlanet(id: string): Promise<Planet | null> {
  const { data, error } = await supabase.from('planets').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: moons, error: mError } = await supabase
    .from('moons')
    .select('*')
    .eq('planet_id', id)
    .order('orbit_radius');
  if (mError) throw mError;

  return rowToPlanet(data, moons?.map(rowToMoon) || []);
}

// Bookmark operations
export async function fetchBookmarks(userId: string) {
  const { data, error } = await supabase
    .from('user_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBookmark(
  userId: string,
  itemType: 'galaxy' | 'system' | 'planet',
  itemId: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from('user_bookmarks')
    .insert({ user_id: userId, item_type: itemType, item_id: itemId, notes: notes || '' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBookmark(id: string) {
  const { error } = await supabase.from('user_bookmarks').delete().eq('id', id);
  if (error) throw error;
}

// Session operations
export async function fetchSession(userId: string) {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveSession(
  userId: string,
  level: string,
  galaxyId?: string,
  systemId?: string,
  planetId?: string,
  cameraPos?: [number, number, number]
) {
  const existing = await fetchSession(userId);

  const data = {
    user_id: userId,
    current_level: level,
    current_galaxy_id: galaxyId || null,
    current_system_id: systemId || null,
    current_planet_id: planetId || null,
    camera_position_x: cameraPos?.[0] ?? null,
    camera_position_y: cameraPos?.[1] ?? null,
    camera_position_z: cameraPos?.[2] ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase.from('user_sessions').update(data).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_sessions').insert(data);
    if (error) throw error;
  }
}

// Profile operations
export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProfile(userId: string, username?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, username: username || '' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: { username?: string; avatar_url?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
