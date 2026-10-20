import { createNoise2D } from "simplex-noise";

function createSeededRandom(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noise2D = createNoise2D(createSeededRandom(20261020));

export function fbm(x: number, z: number, octaves = 4, lacunarity = 2.0, gain = 0.5): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return total / maxValue;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const l2 = (bx - ax) * (bx - ax) + (bz - az) * (bz - az);
  if (l2 === 0) return Math.hypot(px - ax, pz - az);
  let t = ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * (bx - ax)), pz - (az + t * (bz - az)));
}

// Koordinat Teleport Aman (Di jalan utama depan tiap biome, 100% bebas nyangkut)
export const BIOME_CENTERS = {
  westBeach: { x: -575, z: 0, label: "Pantai Barat & Dermaga" },
  centralMeadow: { x: 0, z: 0, label: "Persimpangan Padang Rumput" },
  eastVillage: { x: 315, z: 0, label: "Gerbang Desa Medieval (Timur)" },
  southKingdom: { x: 0, z: 335, label: "Gerbang Kota Kerajaan (Selatan)" },
  southHarbor: { x: 0, z: 590, label: "Pelabuhan Selatan" },
  nwShrine: { x: -310, z: -252, label: "Gerbang Torii Kuil Maple" },
  northMountains: { x: 0, z: -355, label: "Desa Lembah Salju & Aurora" },
};

// Sistem Jalan Raya & Jalan Setapak yang menghubungkan seluruh pulau
export function getRoadFactor(x: number, z: number): number {
  const wobbleX = noise2D(x * 0.015, z * 0.015) * 8.0;
  const wobbleZ = noise2D(x * 0.015 + 100, z * 0.015 + 100) * 8.0;
  const wx = x + wobbleX;
  const wz = z + wobbleZ;

  // 1. Jalan Barat - Timur (Pantai Barat [-590,0] -> Tengah [0,0] -> Desa Timur [390,0])
  const dWestEast = distToSegment(wx, wz, -585, 0, 395, 0);
  // 2. Jalan Utara - Selatan (Lembah Salju [0,-440] -> Tengah [0,0] -> Kerajaan [0,420] -> Pelabuhan [0,615])
  const dNorthSouth = distToSegment(wx, wz, 0, -440, 0, 615);
  // 3. Jalan Cabang Kuil Maple (Tengah [-80,-80] -> Kuil [-310,-260])
  const dShrine = distToSegment(wx, wz, -60, -60, -310, -265);

  const minRoadDist = Math.min(dWestEast, dNorthSouth, dShrine);

  // Plaza Desa & Plaza Kerajaan juga merupakan area berbatu/jalan
  const dVillagePlaza = Math.hypot(x - 360, z) - 34;
  const dKingdomPlaza = Math.hypot(x, z - 390) - 64;

  const d = Math.min(minRoadDist, Math.max(0, dVillagePlaza), Math.max(0, dKingdomPlaza));
  return 1.0 - smoothstep(3.8, 7.5, d);
}

export function getTerrainHeight(x: number, z: number): number {
  const islandRadius = 700;
  const dist = Math.hypot(x, z);
  const normDist = dist / islandRadius;

  const westDockMask = Math.exp(-Math.pow(z / 120, 2)) * (x < -400 ? 1 : 0);
  const southHarborMask = Math.exp(-Math.pow(x / 100, 2)) * (z > 450 ? 1 : 0);
  const coastNoise = fbm(x * 0.002, z * 0.002, 3) * 0.08 * (1 - Math.max(westDockMask, southHarborMask) * 0.85);
  const effectiveDist = normDist - coastNoise;

  // Laut & Pantai Dangkal
  if (effectiveDist >= 0.88) {
    const shallowSpan = 0.15 + westDockMask * 0.08;
    const shoreT = smoothstep(0.88, 0.88 + shallowSpan, effectiveDist);
    const deepT = smoothstep(0.88 + shallowSpan, 1.35, effectiveDist);
    const sandRipples = fbm(x * 0.015, z * 0.015, 2) * 0.2;
    const shallowHeight = 3.2 * (1 - shoreT) + (-2.2 + sandRipples) * shoreT;
    return shallowHeight - deepT * 18.0;
  }

  const inlandFactor = smoothstep(0.88, 0.70, effectiveDist);
  const rollingNoise = (fbm(x * 0.0025, z * 0.0025, 4) + 1.0) * 0.5;
  let height = 3.6 + rollingNoise * 11.5 * inlandFactor;

  // Dataran Rata Desa Timur (+8.5m)
  const distVillage = Math.hypot(x - 360, z);
  const villageMask = 1.0 - smoothstep(105, 195, distVillage);
  height = height * (1 - villageMask) + 8.5 * villageMask;

  // Dataran Rata Kota Kerajaan Selatan (+24m)
  const distKingdom = Math.hypot(x, z - 390);
  const kingdomMask = 1.0 - smoothstep(130, 235, distKingdom);
  height = height * (1 - kingdomMask) + 24.0 * kingdomMask;

  // Teras Kuil Maple Barat Laut (+18.5m)
  const distShrine = Math.hypot(x + 310, z + 310);
  const shrineMask = 1.0 - smoothstep(75, 150, distShrine);
  height = height * (1 - shrineMask) + 18.5 * shrineMask;

  // Pegunungan Salju Utara (tetapi jalur jalan Z di sekitar X=0 dibuat lembah landai)
  if (z < -180) {
    const northT = smoothstep(-180, -520, z);
    const valleyPassMask = Math.exp(-Math.pow(x / 55, 2)); // Lembah jalan utama ke desa salju
    const ridge = Math.pow(Math.abs(fbm(x * 0.0045, z * 0.0045, 5)), 1.25) * 92.0 * (1 - valleyPassMask * 0.78);
    height += (16.0 + ridge) * northT * inlandFactor * (1 - shrineMask * 0.85);
  }

  // Pantai Barat Landai
  if (x < -380) {
    const westBeachT = smoothstep(-380, -610, x);
    height = height * (1 - westBeachT * 0.62);
  }

  return Math.max(3.2, height);
}

export function getTerrainSlope(x: number, z: number): number {
  const eps = 1.0;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  return Math.hypot((hR - hL) / (2 * eps), (hU - hD) / (2 * eps));
}

// Permukaan lantai termasuk Dermaga Pantai Barat, Dermaga Pelabuhan Selatan & Tangga Kuil
export function getWalkableHeight(x: number, z: number): number {
  let h = getTerrainHeight(x, z);
  // Dermaga Kayu Pantai Barat (X: -594 s/d -624, Z: -2.5 s/d +2.5)
  if (x >= -624 && x <= -592 && Math.abs(z) <= 2.6) {
    h = Math.max(h, 1.55);
  }
  // Dermaga Pelabuhan Selatan (X: -5.5 s/d +5.5, Z: 610 s/d 652)
  if (Math.abs(x) <= 5.5 && z >= 608 && z <= 652) {
    h = Math.max(h, 1.8);
  }
  return h;
}

// Daftar Lingkaran Bangunan Solid agar pemain tidak tembus dinding rumah/menara tanpa beban CPU Rapier
export interface SolidObstacle { x: number; z: number; r: number; }
export const SOLID_OBSTACLES: SolidObstacle[] = [
  // Sumur & Rumah-Rumah Desa Medieval
  { x: 360, z: 0, r: 2.3 },
  { x: 334, z: -20, r: 5.2 }, { x: 388, z: -22, r: 5.2 },
  { x: 328, z: 22, r: 5.0 },  { x: 390, z: 24, r: 5.4 },
  { x: 360, z: -40, r: 5.6 }, { x: 360, z: 44, r: 5.2 },
  { x: 412, z: 0, r: 5.2 },   { x: 398, z: -42, r: 4.8 },
  // Pagoda Kuil Maple
  { x: -310, z: -315, r: 11.5 },
  // Menara & Bangunan Kota Kerajaan
  { x: -27, z: 366, r: 4.8 }, { x: -9, z: 366, r: 4.8 },
  { x: 18, z: 382, r: 5.8 },  { x: 36, z: 374, r: 7.2 },
  { x: 0, z: 424, r: 16.0 },  { x: -23, z: 420, r: 5.5 }, { x: 23, z: 420, r: 5.5 },
  { x: -12, z: 394, r: 2.4 }, { x: 12, z: 394, r: 2.4 },
  // Mercusuar Pelabuhan
  { x: 28, z: 623, r: 3.8 },
];

export function resolveObstacleCollisions(x: number, z: number, playerRadius = 0.55): [number, number] {
  let nx = x;
  let nz = z;
  for (let i = 0; i < SOLID_OBSTACLES.length; i++) {
    const ob = SOLID_OBSTACLES[i];
    const dx = nx - ob.x;
    const dz = nz - ob.z;
    const dist = Math.hypot(dx, dz);
    const minDist = ob.r + playerRadius;
    if (dist < minDist && dist > 0.0001) {
      const push = (minDist - dist) / dist;
      nx += dx * push;
      nz += dz * push;
    }
  }
  return [nx, nz];
}
