/*
  # Seed Initial Universe Data

  This migration populates the database with initial galaxy, star system, planet, and moon data.
*/

-- Seed Galaxies
INSERT INTO galaxies (id, name, type, position_x, position_y, position_z, color, core_color, arm_color, description, distance, star_count) VALUES
('milky-way', 'Milky Way', 'barred_spiral', 0, 0, 0, '#a8d8ff', '#ffe4b5', '#6ab4ff', 'Our home galaxy, a barred spiral galaxy approximately 100,000 light-years in diameter.', '0 ly (Home)', '200-400 billion'),
('andromeda', 'Andromeda', 'spiral', 12, 2, -8, '#ffd4a8', '#ffe8c0', '#ffb870', 'The nearest large galaxy to the Milky Way, on a collision course with us in ~4.5 billion years.', '2.537 million ly', '~1 trillion'),
('triangulum', 'Triangulum', 'spiral', -10, -3, 5, '#c8f0d8', '#e0ffe8', '#80d090', 'The third-largest galaxy in the Local Group, a smaller but beautiful spiral galaxy.', '2.73 million ly', '~40 billion'),
('whirlpool', 'Whirlpool', 'spiral', 6, -8, -12, '#f0c8ff', '#ffe0ff', '#d090e0', 'A stunning grand-design spiral galaxy famous for its perfectly defined spiral arms.', '23.16 million ly', '~160 billion'),
('sombrero', 'Sombrero', 'elliptical', -5, 10, -15, '#ffe0a0', '#fff0c0', '#ffc060', 'Named for its resemblance to a Mexican hat, this galaxy features a bright nucleus and dust lane.', '29.35 million ly', '~800 billion');

-- Seed Star Systems for Milky Way
INSERT INTO star_systems (id, galaxy_id, name, star_type, star_color, star_radius, position_x, position_y, position_z, description) VALUES
('sol', 'milky-way', 'Sol System', 'G', '#fff5c0', 1, -2, 0.5, -1, 'Our home star system, containing 8 planets and countless smaller bodies.'),
('alpha-centauri', 'milky-way', 'Alpha Centauri', 'G', '#ffe8a0', 1.2, 1.5, -0.3, 2, 'The nearest star system to Sol, a triple star system 4.37 light-years away.'),
('kepler-452', 'milky-way', 'Kepler-452', 'G', '#ffe0a0', 1.11, 3, 1, -2, 'A Sun-like star 1,400 light-years away hosting a potentially habitable super-Earth.');

-- Seed Star Systems for Andromeda
INSERT INTO star_systems (id, galaxy_id, name, star_type, star_color, star_radius, position_x, position_y, position_z, description) VALUES
('andromeda-prime', 'andromeda', 'Andromeda Prime', 'A', '#c0d8ff', 1.8, -2, 0.3, 1, 'A brilliant blue-white star system near the Andromeda core.'),
('andromeda-core', 'andromeda', 'Messier System', 'B', '#80a0ff', 3.2, 1, -0.5, -2, 'A massive blue giant near the Andromeda galactic core, surrounded by ancient worlds.');

-- Seed Star Systems for Triangulum
INSERT INTO star_systems (id, galaxy_id, name, star_type, star_color, star_radius, position_x, position_y, position_z, description) VALUES
('triangulum-alpha', 'triangulum', 'Triangulum Alpha', 'K', '#ffb870', 0.8, 0, 0, 0, 'An orange dwarf star with a rich planetary system in the outer spiral arm.');

-- Seed Star Systems for Whirlpool
INSERT INTO star_systems (id, galaxy_id, name, star_type, star_color, star_radius, position_x, position_y, position_z, description) VALUES
('whirlpool-core', 'whirlpool', 'Vortex Prime', 'F', '#fff0c0', 1.3, 0.5, 0, -0.5, 'A bright yellow-white star in the inner spiral arm of the Whirlpool Galaxy.');

-- Seed Star Systems for Sombrero
INSERT INTO star_systems (id, galaxy_id, name, star_type, star_color, star_radius, position_x, position_y, position_z, description) VALUES
('sombrero-rim', 'sombrero', 'Brim System', 'M', '#ff8060', 0.5, -1, 0, 1, 'A red dwarf system in the famous dust lane of the Sombrero Galaxy.');

-- Seed Planets for Sol System
INSERT INTO planets (id, system_id, name, type, radius, orbit_radius, orbit_speed, rotation_speed, color, atmosphere_color, atmosphere_intensity, description, temperature, mass, discovered) VALUES
('mercury', 'sol', 'Mercury', 'desert', 0.38, 3, 4.7, 0.017, '#b5b5b5', '#888888', 0.1, 'The smallest planet, closest to the Sun with extreme temperature variations.', '-180°C to 430°C', '3.3 × 10²³ kg', 'Ancient times'),
('earth', 'sol', 'Earth', 'ocean', 1, 6, 2.97, 0.463, '#2d7dd2', '#87ceeb', 0.4, 'Our home world. The only known planet harboring life in the universe.', '-88°C to 58°C', '5.97 × 10²⁴ kg', 'Always known'),
('mars', 'sol', 'Mars', 'desert', 0.53, 8.5, 2.41, 0.241, '#c1440e', '#e8a87c', 0.2, 'The Red Planet, a cold desert world with the largest volcano in the solar system.', '-125°C to 20°C', '6.4 × 10²³ kg', 'Ancient times'),
('jupiter', 'sol', 'Jupiter', 'gas_giant', 2.2, 13, 1.31, 12.6, '#c88b3a', '#e8c4a0', 0.5, 'The largest planet, a gas giant with the iconic Great Red Spot storm.', '-145°C (cloud tops)', '1.9 × 10²⁷ kg', 'Ancient times'),
('saturn', 'sol', 'Saturn', 'gas_giant', 1.9, 18, 0.97, 9.87, '#e4d191', '#f0e8c8', 0.45, 'The jewel of the solar system, renowned for its spectacular ring system.', '-178°C (cloud tops)', '5.68 × 10²⁶ kg', 'Ancient times');

-- Seed Planets for Alpha Centauri
INSERT INTO planets (id, system_id, name, type, radius, orbit_radius, orbit_speed, rotation_speed, color, atmosphere_color, atmosphere_intensity, description, temperature, mass, discovered) VALUES
('proxima-b', 'alpha-centauri', 'Proxima b', 'terrestrial', 1.1, 4, 1.1, 0.5, '#6b8e6b', '#90ee90', 0.35, 'A potentially habitable exoplanet orbiting in the habitable zone of Proxima Centauri.', '-40°C to 10°C (estimated)', '~1.27 Earth masses', '2016'),
('proxima-c', 'alpha-centauri', 'Proxima c', 'ice', 0.7, 7, 0.7, 0.3, '#b0d4e8', '#e0f0ff', 0.2, 'A cold super-Earth candidate in the outer reaches of the system.', '-220°C (estimated)', '~7 Earth masses', '2019');

-- Seed Planets for Kepler-452
INSERT INTO planets (id, system_id, name, type, radius, orbit_radius, orbit_speed, rotation_speed, color, atmosphere_color, atmosphere_intensity, description, temperature, mass, discovered) VALUES
('kepler-452b', 'kepler-452', 'Kepler-452b', 'terrestrial', 1.6, 5, 1.0, 0.4, '#4a9e6a', '#88ddaa', 0.5, 'Earth''s "older cousin" - a super-Earth in the habitable zone, possibly covered in oceans.', '10°C to 40°C (estimated)', '~5 Earth masses', '2015');

-- Seed Planets for Andromeda Prime
INSERT INTO planets (id, system_id, name, type, radius, orbit_radius, orbit_speed, rotation_speed, color, atmosphere_color, atmosphere_intensity, description, temperature, mass, discovered) VALUES
('andros-1', 'andromeda-prime', 'Andros I', 'lava', 0.9, 3.5, 2.1, 1.2, '#ff4400', '#ff8844', 0.6, 'A volcanic hellworld scorched by the intense radiation of its blue-white host star.', '900°C (surface)', '~0.8 Earth masses', '2042 (remote sensing)'),
('andros-2', 'andromeda-prime', 'Andros II', 'ice', 1.4, 8, 1.1, 0.2, '#a0c8e8', '#d0eeff', 0.3, 'An icy world with subsurface oceans, far from the intense radiation zone.', '-200°C (surface)', '~2.2 Earth masses', '2042 (remote sensing)');

-- Seed Planets for Messier System
INSERT INTO planets (id, system_id, name, type, radius, orbit_radius, orbit_speed, rotation_speed, color, atmosphere_color, atmosphere_intensity, description, temperature, mass, discovered) VALUES
('messier-1', 'andromeda-core', 'Aethon', 'gas_giant', 3, 10, 0.8, 5, '#1a3a6a', '#3a6aaa', 0.7, 'A colossal gas giant with deep blue storms raging across its surface.', '-200°C (upper atmosphere)', '~3.5 Jupiter masses', '2045 (remote sensing)');

-- Seed Planets for Triangulum Alpha
INSERT INTO planets (id, system_id, name, type, radius, orbit_radius, orbit_speed, rotation_speed, color, atmosphere_color, atmosphere_intensity, description, temperature, mass, discovered) VALUES
('tri-alpha-1', 'triangulum-alpha', 'Verdania', 'ocean', 1.2, 4.5, 1.5, 0.55, '#1a7a8a', '#40c0d0', 0.55, 'A world of vast oceans with massive weather systems visible from space.', '15°C (average)', '~1.3 Earth masses', '2050 (spectrographic analysis)'),
('tri-alpha-2', 'triangulum-alpha', 'Duskfall', 'terrestrial', 0.85, 7, 1.0, 0.35, '#8a7a5a', '#d0c090', 0.25, 'A rocky world with vast plains and ancient impact craters.', '-30°C (average)', '~0.7 Earth masses', '2050 (spectrographic analysis)');

-- Seed Planets for Vortex Prime
INSERT INTO planets (id, system_id, name, type, radius, orbit_radius, orbit_speed, rotation_speed, color, atmosphere_color, atmosphere_intensity, description, temperature, mass, discovered) VALUES
('vortex-1', 'whirlpool-core', 'Cyclonia', 'gas_giant', 2.5, 9, 0.9, 8, '#6a3a8a', '#9a60c0', 0.65, 'A purple gas giant with hypnotic spiral cloud formations across its surface.', '-150°C (upper atmosphere)', '~2 Jupiter masses', '2055 (deep space telescope)');

-- Seed Planets for Brim System
INSERT INTO planets (id, system_id, name, type, radius, orbit_radius, orbit_speed, rotation_speed, color, atmosphere_color, atmosphere_intensity, description, temperature, mass, discovered) VALUES
('brim-1', 'sombrero-rim', 'Dusthaven', 'desert', 0.75, 3, 1.8, 0.4, '#c8a060', '#e8c080', 0.15, 'A warm desert world lit by the ruddy glow of its red dwarf host star.', '60°C (average)', '~0.6 Earth masses', '2058 (spectrographic)');

-- Seed Moons
INSERT INTO moons (id, planet_id, name, radius, orbit_radius, orbit_speed, color) VALUES
('moon', 'earth', 'Moon', 0.27, 1.8, 1.02, '#c0c0c0'),
('phobos', 'mars', 'Phobos', 0.1, 1.3, 2.1, '#8b7355'),
('deimos', 'mars', 'Deimos', 0.08, 1.8, 1.3, '#8b7355'),
('io', 'jupiter', 'Io', 0.18, 3.2, 1.7, '#ffff00'),
('europa', 'jupiter', 'Europa', 0.16, 4, 1.4, '#e8d5b7'),
('ganymede', 'jupiter', 'Ganymede', 0.26, 5.2, 1.1, '#a0937d'),
('titan', 'saturn', 'Titan', 0.26, 4.5, 0.56, '#e8a040'),
('enceladus', 'saturn', 'Enceladus', 0.12, 3, 1.37, '#ffffff'),
('proxima-c-1', 'proxima-c', 'Glacius', 0.2, 2, 1.5, '#d0e8f0'),
('kepler-m1', 'kepler-452b', 'Arkon', 0.3, 2.5, 1.2, '#9a8c7e'),
('kepler-m2', 'kepler-452b', 'Belith', 0.2, 3.5, 0.8, '#7a8c9e'),
('andros-2-m1', 'andros-2', 'Crystalis', 0.35, 3, 0.9, '#e0f0ff'),
('aethon-m1', 'messier-1', 'Nyx', 0.4, 5, 1.2, '#334466'),
('aethon-m2', 'messier-1', 'Erebus', 0.3, 7, 0.8, '#223355'),
('verdania-m1', 'tri-alpha-1', 'Tide', 0.22, 2.2, 1.8, '#a0b8c0'),
('cyclonia-m1', 'vortex-1', 'Swirl', 0.3, 4.5, 1.5, '#7a5090'),
('cyclonia-m2', 'vortex-1', 'Gyre', 0.2, 6, 1.0, '#6a4080');
